// Servicio CRUD 14 para la entidad Organización (TTTRUCKS-34: Subtareas TTTRUCKS-35 y TTTRUCKS-37)
// Gestiona el ciclo de vida fiscal, cabeceras de informes, actualización y trazabilidad auditada exclusiva a ROL_ADMIN.

import { ForbiddenError, UnauthorizedError } from '../auth/guardias.js';
import { InterceptorAuditoria } from '../audit/interceptor.js';
import { validarLogotipo } from './personalizacion.js';

// Helper para escapar comillas simples en sentencias SQLite
function esc(val) {
  return val == null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Valida formato básico de CIF/NIF/NIE español (9 caracteres alfanuméricos)
 * @param {string} cif
 * @returns {boolean}
 */
export function validarCIF(cif) {
  if (!cif || typeof cif !== 'string') return false;
  const cifLimpio = cif.trim().toUpperCase();
  // Validación de longitud y caracteres básicos de identificación fiscal
  const patronFiscal = /^[A-HJ-NP-SUVW0-9][0-9]{7}[A-J0-9]$/i;
  return patronFiscal.test(cifLimpio);
}

/**
 * Ejecuta una consulta SELECT en SqliteClient o DatabaseSync
 */
async function consultarDB(db, sql, params = []) {
  if (typeof db.consultar === 'function') {
    return db.consultar(sql, params);
  }
  if (typeof db.prepare === 'function') {
    return db.prepare(sql).all(...params);
  }
  throw new Error('Cliente de base de datos no compatible');
}

/**
 * Ejecuta una sentencia de inserción/mutación en SqliteClient o DatabaseSync
 */
async function ejecutarDB(db, sql) {
  if (typeof db.ejecutar === 'function') {
    return db.ejecutar(sql);
  }
  if (typeof db.exec === 'function') {
    return db.exec(sql);
  }
  throw new Error('Cliente de base de datos no compatible');
}

/**
 * CRUD 14: CREATE - Alta inicial de empresa / organización
 * @param {object} db - Cliente SQLite o DatabaseSync
 * @param {object} datos - Datos corporativos y fiscales
 * @returns {Promise<object>} Registro creado
 */
export async function crearOrganizacion(db, datos) {
  const {
    cif,
    razon_social,
    direccion = null,
    cp = null,
    ciudad = null,
    provincia = null,
    telefono = null,
    email = null,
    logo_url = null
  } = datos || {};

  if (!cif || typeof cif !== 'string' || !cif.trim()) {
    throw new Error('El CIF/NIF es obligatorio.');
  }

  const cifNorm = cif.trim().toUpperCase();
  if (!validarCIF(cifNorm)) {
    throw new Error(`El formato del CIF/NIF "${cif}" no es válido.`);
  }

  if (!razon_social || typeof razon_social !== 'string' || !razon_social.trim()) {
    throw new Error('La razón social de la empresa es obligatoria.');
  }

  // Comprobar unicidad de CIF
  const existentes = await consultarDB(db, 'SELECT id_organizacion FROM organizacion WHERE cif = ?;', [cifNorm]);
  if (existentes && existentes.length > 0) {
    throw new Error(`Ya existe una organización registrada con el CIF "${cifNorm}".`);
  }

  const sql = `
    INSERT INTO organizacion (
      cif, razon_social, direccion, cp, ciudad, provincia,
      telefono, email, logo_url, activo, creado_en, actualizado_en
    ) VALUES (
      ${esc(cifNorm)},
      ${esc(razon_social.trim())},
      ${esc(direccion?.trim())},
      ${esc(cp?.trim())},
      ${esc(ciudad?.trim())},
      ${esc(provincia?.trim())},
      ${esc(telefono?.trim())},
      ${esc(email?.trim())},
      ${esc(logo_url?.trim())},
      1,
      datetime('now'),
      datetime('now')
    );
  `.trim();

  await ejecutarDB(db, sql);
  return obtenerOrganizacionPorCif(db, cifNorm);
}

/**
 * CRUD 14: READ - Obtiene una organización por su identificador primario
 */
export async function obtenerOrganizacionPorId(db, id_organizacion) {
  if (!id_organizacion) return null;
  const filas = await consultarDB(
    db,
    'SELECT * FROM organizacion WHERE id_organizacion = ?;',
    [id_organizacion]
  );
  return filas[0] || null;
}

/**
 * CRUD 14: READ - Obtiene una organización por su CIF
 */
export async function obtenerOrganizacionPorCif(db, cif) {
  if (!cif) return null;
  const cifNorm = cif.trim().toUpperCase();
  const filas = await consultarDB(
    db,
    'SELECT * FROM organizacion WHERE cif = ?;',
    [cifNorm]
  );
  return filas[0] || null;
}

/**
 * CRUD 14: READ - Obtiene la organización activa principal (tenant local de la flota)
 */
export async function obtenerOrganizacionActiva(db) {
  const filas = await consultarDB(
    db,
    'SELECT * FROM organizacion WHERE activo = 1 ORDER BY id_organizacion ASC LIMIT 1;'
  );
  return filas[0] || null;
}

/**
 * CRUD 14: READ - Obtiene los datos formateados para cabeceras de informes operativos y perfil
 */
export async function obtenerCabeceraInformes(db, id_organizacion = null) {
  const org = id_organizacion
    ? await obtenerOrganizacionPorId(db, id_organizacion)
    : await obtenerOrganizacionActiva(db);

  if (!org) return null;

  const partesDireccion = [org.direccion, org.cp, org.ciudad, org.provincia ? `(${org.provincia})` : null]
    .filter(Boolean)
    .join(' ');

  return {
    id_organizacion: org.id_organizacion,
    razon_social: org.razon_social,
    cif: org.cif,
    direccion_completa: partesDireccion || 'Dirección fiscal no configurada',
    contacto: [org.telefono, org.email].filter(Boolean).join(' | ') || 'Sin contacto configurado',
    telefono: org.telefono,
    email: org.email,
    logo_url: org.logo_url,
    activo: Boolean(org.activo)
  };
}

/**
 * CRUD 14: READ - Listado de organizaciones registradas
 */
export async function listarOrganizaciones(db, { soloActivas = false } = {}) {
  const sql = soloActivas
    ? 'SELECT * FROM organizacion WHERE activo = 1 ORDER BY id_organizacion ASC;'
    : 'SELECT * FROM organizacion ORDER BY id_organizacion ASC;';
  return consultarDB(db, sql);
}

/**
 * CRUD 14: UPDATE - Actualización fiscal y corporativa de la organización
 */
export async function actualizarOrganizacion(db, id_organizacion, cambios = {}) {
  const orgActual = await obtenerOrganizacionPorId(db, id_organizacion);
  if (!orgActual) {
    throw new Error(`Organización con ID ${id_organizacion} no encontrada.`);
  }

  const setClauses = [];

  if (cambios.cif !== undefined) {
    const cifNorm = (cambios.cif || '').trim().toUpperCase();
    if (!validarCIF(cifNorm)) {
      throw new Error(`El formato del CIF/NIF "${cambios.cif}" no es válido.`);
    }
    if (cifNorm !== orgActual.cif) {
      const duplicado = await consultarDB(
        db,
        'SELECT id_organizacion FROM organizacion WHERE cif = ? AND id_organizacion != ?;',
        [cifNorm, id_organizacion]
      );
      if (duplicado && duplicado.length > 0) {
        throw new Error(`El CIF "${cifNorm}" ya está registrado en otra organización.`);
      }
    }
    setClauses.push(`cif = ${esc(cifNorm)}`);
  }

  if (cambios.razon_social !== undefined) {
    if (!cambios.razon_social || !cambios.razon_social.trim()) {
      throw new Error('La razón social no puede estar vacía.');
    }
    setClauses.push(`razon_social = ${esc(cambios.razon_social.trim())}`);
  }

  if (cambios.direccion !== undefined) setClauses.push(`direccion = ${esc(cambios.direccion?.trim())}`);
  if (cambios.cp !== undefined) setClauses.push(`cp = ${esc(cambios.cp?.trim())}`);
  if (cambios.ciudad !== undefined) setClauses.push(`ciudad = ${esc(cambios.ciudad?.trim())}`);
  if (cambios.provincia !== undefined) setClauses.push(`provincia = ${esc(cambios.provincia?.trim())}`);
  if (cambios.telefono !== undefined) setClauses.push(`telefono = ${esc(cambios.telefono?.trim())}`);
  if (cambios.email !== undefined) setClauses.push(`email = ${esc(cambios.email?.trim())}`);
  if (cambios.logo_url !== undefined) setClauses.push(`logo_url = ${esc(cambios.logo_url?.trim())}`);
  if (cambios.activo !== undefined) setClauses.push(`activo = ${cambios.activo ? 1 : 0}`);

  setClauses.push("actualizado_en = datetime('now')");

  const sql = `
    UPDATE organizacion
    SET ${setClauses.join(', ')}
    WHERE id_organizacion = ${id_organizacion};
  `.trim();

  await ejecutarDB(db, sql);
  return obtenerOrganizacionPorId(db, id_organizacion);
}

/**
 * CRUD 14: DELETE - Limpieza o restablecimiento de parámetros opcionales
 * Mantiene intactos CIF y razón social, restableciendo a NULL datos de contacto y logo.
 */
export async function restablecerParametrosOpcionales(db, id_organizacion) {
  const orgActual = await obtenerOrganizacionPorId(db, id_organizacion);
  if (!orgActual) {
    throw new Error(`Organización con ID ${id_organizacion} no encontrada.`);
  }

  const sql = `
    UPDATE organizacion
    SET direccion = NULL,
        cp = NULL,
        ciudad = NULL,
        provincia = NULL,
        telefono = NULL,
        email = NULL,
        logo_url = NULL,
        actualizado_en = datetime('now')
    WHERE id_organizacion = ${id_organizacion};
  `.trim();

  await ejecutarDB(db, sql);
  return obtenerOrganizacionPorId(db, id_organizacion);
}

/**
 * CRUD 14: DELETE - Baja lógica de la organización
 */
export async function bajaLogicaOrganizacion(db, id_organizacion) {
  return actualizarOrganizacion(db, id_organizacion, { activo: 0 });
}

/**
 * CRUD 14: Reactivación de la organización
 */
export async function reactivarOrganizacion(db, id_organizacion) {
  return actualizarOrganizacion(db, id_organizacion, { activo: 1 });
}

/**
 * Valida que la sesión pertenezca exclusivamente a un ROL_ADMIN para edición corporativa (TTTRUCKS-37)
 * @param {object} sesion - Sesión activa del usuario ejecutor
 */
export function verificarAdminOrganizacion(sesion) {
  if (!sesion || !sesion.id_usuario || !sesion.rol) {
    throw new UnauthorizedError('401 Unauthorized: Debe contar con una sesión activa para gestionar la organización.');
  }
  if (sesion.rol !== 'ROL_ADMIN') {
    throw new ForbiddenError('403 Forbidden: La configuración corporativa sólo puede ser editada exclusivamente por usuarios con ROL_ADMIN.');
  }
  return true;
}

/**
 * CRUD 14: CREATE con trazabilidad en log_auditoria y guardia exclusiva de ROL_ADMIN (TTTRUCKS-37)
 */
export async function crearOrganizacionAuditada(db, sesion, datos) {
  verificarAdminOrganizacion(sesion);
  const nuevaOrg = await crearOrganizacion(db, datos);

  await InterceptorAuditoria.registrarMutacion(
    db,
    {
      accion: 'INSERT',
      entidad: 'organizacion',
      id_registro: nuevaOrg.id_organizacion,
      anterior: null,
      nuevo: nuevaOrg
    },
    sesion
  );

  return nuevaOrg;
}

/**
 * CRUD 14: UPDATE con trazabilidad en log_auditoria y guardia exclusiva de ROL_ADMIN (TTTRUCKS-37)
 */
export async function actualizarOrganizacionAuditada(db, sesion, id_organizacion, cambios) {
  verificarAdminOrganizacion(sesion);
  const anterior = await obtenerOrganizacionPorId(db, id_organizacion);
  if (!anterior) {
    throw new Error(`Organización con ID ${id_organizacion} no encontrada.`);
  }

  const nuevo = await actualizarOrganizacion(db, id_organizacion, cambios);

  await InterceptorAuditoria.registrarMutacion(
    db,
    {
      accion: 'UPDATE',
      entidad: 'organizacion',
      id_registro: id_organizacion,
      anterior,
      nuevo
    },
    sesion
  );

  return nuevo;
}

/**
 * CRUD 14: DELETE (restablecer opcionales) con trazabilidad en log_auditoria y guardia de ROL_ADMIN (TTTRUCKS-37)
 */
export async function restablecerParametrosOpcionalesAuditado(db, sesion, id_organizacion) {
  verificarAdminOrganizacion(sesion);
  const anterior = await obtenerOrganizacionPorId(db, id_organizacion);
  if (!anterior) {
    throw new Error(`Organización con ID ${id_organizacion} no encontrada.`);
  }

  const nuevo = await restablecerParametrosOpcionales(db, id_organizacion);

  await InterceptorAuditoria.registrarMutacion(
    db,
    {
      accion: 'UPDATE',
      entidad: 'organizacion',
      id_registro: id_organizacion,
      anterior,
      nuevo
    },
    sesion
  );

  return nuevo;
}

/**
 * Gestión de logotipo con validación, trazabilidad en log_auditoria y guardia de ROL_ADMIN (TTTRUCKS-37)
 */
export async function asignarLogotipoAuditado(db, sesion, id_organizacion, logo) {
  verificarAdminOrganizacion(sesion);
  const anterior = await obtenerOrganizacionPorId(db, id_organizacion);
  if (!anterior) {
    throw new Error(`Organización con ID ${id_organizacion} no encontrada.`);
  }

  validarLogotipo(logo);
  const nuevo = await actualizarOrganizacion(db, id_organizacion, { logo_url: logo.trim() });

  await InterceptorAuditoria.registrarMutacion(
    db,
    {
      accion: 'UPDATE',
      entidad: 'organizacion',
      id_registro: id_organizacion,
      anterior,
      nuevo
    },
    sesion
  );

  return nuevo;
}
