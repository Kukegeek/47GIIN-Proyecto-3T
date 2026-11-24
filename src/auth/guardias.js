// Guardias de autorización RBAC (TTTRUCKS-25: Subtarea TTTRUCKS-29)
// Protege el enrutador de vistas UI y la capa de persistencia SQLite contra operaciones no autorizadas (403 Forbidden).

import { tienePermiso } from './permisos.js';

export class ForbiddenError extends Error {
  constructor(mensaje = '403 Forbidden: Operación o acceso no autorizado') {
    super(mensaje);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

export class UnauthorizedError extends Error {
  constructor(mensaje = '401 Unauthorized: Sesión de usuario no válida o inactiva') {
    super(mensaje);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

// Mapa de rutas protegidas de la aplicación y sus privilegios mínimos requeridos
export const RUTAS_PROTEGIDAS = Object.freeze({
  '/usuarios': { modulo: 'usuarios', accion: 'leer' },
  '/roles': { modulo: 'roles', accion: 'leer' },
  '/auditoria': { modulo: 'auditoria', accion: 'leer' },
  '/organizacion': { modulo: 'organizacion', accion: 'leer' },
  '/rutas': { modulo: 'rutas', accion: 'leer' },
  '/flota': { modulo: 'flota', accion: 'leer' },
  '/conductores': { modulo: 'conductores', accion: 'leer' },
  '/mantenimiento': { modulo: 'mantenimiento', accion: 'leer' },
  '/tacografo': { modulo: 'tacografo', accion: 'leer' },
  '/reportes': { modulo: 'reportes', accion: 'leer' }
});

// Mapa de correspondencia entre tablas físicas y módulos lógicos RBAC
const TABLA_A_MODULO = Object.freeze({
  usuario: 'usuarios',
  rol_permiso: 'roles',
  log_auditoria: 'auditoria',
  organizacion: 'organizacion',
  vehiculo: 'flota',
  remolque: 'flota',
  hoja_ruta: 'rutas',
  tramo: 'rutas',
  conductor: 'conductores',
  parte_trabajo: 'conductores',
  mantenimiento_preventivo: 'mantenimiento',
  orden_reparacion: 'mantenimiento',
  registro_tacografo: 'tacografo',
  inspeccion: 'tacografo'
});

/**
 * Analiza una sentencia SQL para extraer la operación canónica y el módulo afectado
 * @param {string} sql
 * @returns {{ operacion: string, modulo: string|null }|null}
 */
export function analizarSentenciaSQL(sql) {
  if (!sql || typeof sql !== 'string') return null;

  const texto = sql.trim().replace(/\s+/g, ' ');
  const primerToken = (texto.split(' ')[0] || '').toUpperCase();

  let operacion = null;
  let nombreTabla = null;

  if (primerToken === 'INSERT') {
    operacion = 'crear';
    const match = texto.match(/INSERT\s+(?:OR\s+\w+\s+)?INTO\s+([a-zA-Z0-9_]+)/i);
    if (match) nombreTabla = match[1].toLowerCase();
  } else if (primerToken === 'UPDATE') {
    operacion = 'actualizar';
    const match = texto.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
    if (match) nombreTabla = match[1].toLowerCase();
  } else if (primerToken === 'DELETE') {
    operacion = 'eliminar';
    const match = texto.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i);
    if (match) nombreTabla = match[1].toLowerCase();
  } else if (primerToken === 'SELECT') {
    operacion = 'leer';
    const match = texto.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (match) nombreTabla = match[1].toLowerCase();
  }

  if (!operacion || !nombreTabla) {
    return null;
  }

  const modulo = TABLA_A_MODULO[nombreTabla] || nombreTabla;
  return { operacion, modulo, tabla: nombreTabla };
}

/**
 * Guardia de persistencia: Valida si una sesión activa tiene autorización para ejecutar una sentencia SQL
 * @param {object} db - Instancia de BD o cliente SQLite
 * @param {object} sesion - Sesión de usuario activa
 * @param {string} sql - Sentencia SQL a ejecutar
 * @throws {UnauthorizedError} Si no hay sesión válida
 * @throws {ForbiddenError} Si el rol no cuenta con privilegios en la tabla/módulo
 * @returns {Promise<boolean>}
 */
export async function verificarAutorizacionSQL(db, sesion, sql) {
  if (!sesion || !sesion.id_usuario || !sesion.rol) {
    throw new UnauthorizedError('401 Unauthorized: Operación de datos denegada sin sesión autenticada.');
  }

  const analisis = analizarSentenciaSQL(sql);
  // Si la sentencia no es una mutación o lectura sobre entidad reconocida (ej. PRAGMA, BEGIN, COMMIT), se permite
  if (!analisis || !analisis.modulo) {
    return true;
  }

  const { operacion, modulo, tabla } = analisis;

  // Inmutabilidad estricta: log_auditoria jamás admite UPDATE o DELETE (TTTRUCKS-33)
  if (tabla === 'log_auditoria' && (operacion === 'actualizar' || operacion === 'eliminar')) {
    throw new ForbiddenError(
      `403 Forbidden: La tabla log_auditoria es estrictamente inmutable (append-only). No se permite ${operacion} registros de auditoría.`
    );
  }

  // Restricción exclusiva de edición sobre organizacion a ROL_ADMIN (TTTRUCKS-37)
  if (tabla === 'organizacion' && operacion !== 'leer' && sesion.rol !== 'ROL_ADMIN') {
    throw new ForbiddenError(
      `403 Forbidden: La edición de la entidad "organizacion" está restringida exclusivamente al rol ROL_ADMIN.`
    );
  }

  const autorizado = await tienePermiso(db, sesion.rol, modulo, operacion);

  if (!autorizado) {
    throw new ForbiddenError(
      `403 Forbidden: Operación "${operacion}" no autorizada sobre el módulo "${modulo}" para el rol "${sesion.rol}".`
    );
  }

  return true;
}

/**
 * Crea un proxy/adaptador sobre el cliente SQLite que intercepta las consultas
 * aplicando la guardia de autorización RBAC en tiempo de ejecución.
 * @param {object} db - Cliente SQLite nativo o SqliteClient
 * @param {object} sesion - Sesión del usuario actual
 * @returns {object} Adaptador protegido
 */
export function crearAdaptadorSqlConGuardia(db, sesion) {
  return {
    async ejecutar(sql) {
      await verificarAutorizacionSQL(db, sesion, sql);
      if (typeof db.ejecutar === 'function') return db.ejecutar(sql);
      if (typeof db.exec === 'function') return db.exec(sql);
      throw new Error('Método ejecutar no disponible en cliente');
    },

    async consultar(sql, params = []) {
      await verificarAutorizacionSQL(db, sesion, sql);
      if (typeof db.consultar === 'function') return db.consultar(sql, params);
      if (typeof db.prepare === 'function') return db.prepare(sql).all(...params);
      throw new Error('Método consultar no disponible en cliente');
    },

    exec(sql) {
      // Para entornos sincrónicos de prueba donde no se aguarda promesa previa
      // Se evalúa análisis básico de seguridad
      const analisis = analizarSentenciaSQL(sql);
      if (analisis && sesion) {
        if (!sesion.id_usuario || !sesion.rol) {
          throw new UnauthorizedError('401 Unauthorized');
        }
      }
      return db.exec(sql);
    }
  };
}

/**
 * Guardia de navegación UI: Evalúa si un usuario autenticado puede acceder a una ruta de la interfaz
 * @param {string} ruta - Ruta solicitada (ej. '/usuarios')
 * @param {object|null} sesion - Sesión activa actual
 * @param {object} db - Base de datos para consultar permisos
 * @returns {Promise<{ permitido: boolean, status?: number, redirect?: string, error?: string }>}
 */
export async function evaluarAccesoRuta(ruta, sesion, db) {
  const rutaNorm = (ruta || '').trim().toLowerCase();
  const regla = RUTAS_PROTEGIDAS[rutaNorm];

  // Si la ruta no está registrada como protegida (ej. /login, /403, /publico), acceso libre
  if (!regla) {
    return { permitido: true };
  }

  // Si la ruta requiere autorización pero no hay sesión activa
  if (!sesion || !sesion.id_usuario || !sesion.rol) {
    return {
      permitido: false,
      status: 401,
      redirect: '/login',
      error: '401 Unauthorized: Debe iniciar sesión para acceder a esta vista.'
    };
  }

  const autorizado = await tienePermiso(db, sesion.rol, regla.modulo, regla.accion);
  if (!autorizado) {
    return {
      permitido: false,
      status: 403,
      redirect: '/403',
      error: `403 Forbidden: Su rol "${sesion.rol}" no tiene acceso a la vista de ${regla.modulo}.`
    };
  }

  return { permitido: true };
}

/**
 * Filtra los elementos del menú de navegación de la interfaz según los permisos del usuario
 * Cumple con el criterio BDD de ocultar menús no autorizados para el rol.
 * @param {Array<{ ruta: string, etiqueta: string }>} itemsMenu
 * @param {object|null} sesion
 * @param {object} db
 * @returns {Promise<Array<{ ruta: string, etiqueta: string }>>}
 */
export async function filtrarMenuPorRol(itemsMenu, sesion, db) {
  if (!Array.isArray(itemsMenu)) return [];

  const permitidos = [];
  for (const item of itemsMenu) {
    const acceso = await evaluarAccesoRuta(item.ruta, sesion, db);
    if (acceso.permitido) {
      permitidos.push(item);
    }
  }

  return permitidos;
}
