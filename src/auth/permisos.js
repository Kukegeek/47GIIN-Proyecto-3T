// Servicio CRUD 12 para la entidad rol_permiso (TTTRUCKS-25: Subtarea TTTRUCKS-27)
// Soporta definición de matriz RBAC, consulta por rol/módulo, ajuste granular y revocación.

export const ROLES_CANONICOS = Object.freeze(['ROL_ADMIN', 'ROL_CONDUCTOR']);

export const MODULOS_SISTEMA = Object.freeze([
  'usuarios',
  'roles',
  'auditoria',
  'organizacion',
  'flota',
  'rutas',
  'conductores',
  'mantenimiento',
  'tacografo',
  'reportes'
]);

export const ACCIONES_VALIDAS = Object.freeze(['crear', 'leer', 'actualizar', 'eliminar']);

const MAPA_ACCIONES = Object.freeze({
  crear: 'puede_crear',
  leer: 'puede_leer',
  actualizar: 'puede_actualizar',
  eliminar: 'puede_eliminar'
});

// Helper para escapar comillas simples en sentencias SQLite
function esc(val) {
  return val == null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;
}

// Coerción segura a bit 0 o 1
function aBit(val, porDefecto = 0) {
  if (val === undefined || val === null) return porDefecto;
  return Boolean(val) ? 1 : 0;
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
 * Ejecuta una sentencia de inserción/modificación en SqliteClient o DatabaseSync
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
 * CRUD 12: CREATE - Asigna o define un permiso de rol sobre un módulo
 * Si ya existe para ese par (rol, modulo), actualiza sus valores.
 */
export async function asignarPermiso(db, datos) {
  const {
    rol,
    modulo,
    puede_crear = 0,
    puede_leer = 1,
    puede_actualizar = 0,
    puede_eliminar = 0,
    puedeCrear,
    puedeLeer,
    puedeActualizar,
    puedeEliminar
  } = datos || {};

  if (!rol || typeof rol !== 'string' || !rol.trim()) {
    throw new Error('El identificador de rol es obligatorio.');
  }
  if (!modulo || typeof modulo !== 'string' || !modulo.trim()) {
    throw new Error('El identificador del módulo es obligatorio.');
  }

  const rolNorm = rol.trim().toUpperCase();
  const moduloNorm = modulo.trim().toLowerCase();

  const c = aBit(puedeCrear !== undefined ? puedeCrear : puede_crear, 0);
  const l = aBit(puedeLeer !== undefined ? puedeLeer : puede_leer, 1);
  const a = aBit(puedeActualizar !== undefined ? puedeActualizar : puede_actualizar, 0);
  const e = aBit(puedeEliminar !== undefined ? puedeEliminar : puede_eliminar, 0);

  const sql = `
    INSERT INTO rol_permiso (rol, modulo, puede_crear, puede_leer, puede_actualizar, puede_eliminar)
    VALUES (${esc(rolNorm)}, ${esc(moduloNorm)}, ${c}, ${l}, ${a}, ${e})
    ON CONFLICT(rol, modulo) DO UPDATE SET
      puede_crear = excluded.puede_crear,
      puede_leer = excluded.puede_leer,
      puede_actualizar = excluded.puede_actualizar,
      puede_eliminar = excluded.puede_eliminar;
  `.trim();

  await ejecutarDB(db, sql);
  return obtenerPermiso(db, rolNorm, moduloNorm);
}

/**
 * CRUD 12: READ - Consulta el permiso de un rol para un módulo específico
 */
export async function obtenerPermiso(db, rol, modulo) {
  if (!rol || !modulo) return null;
  const rolNorm = rol.trim().toUpperCase();
  const moduloNorm = modulo.trim().toLowerCase();

  const filas = await consultarDB(
    db,
    'SELECT id_permiso, rol, modulo, puede_crear, puede_leer, puede_actualizar, puede_eliminar FROM rol_permiso WHERE rol = ? AND modulo = ?;',
    [rolNorm, moduloNorm]
  );
  return filas[0] || null;
}

/**
 * CRUD 12: READ - Obtiene la matriz completa de permisos para un rol
 */
export async function listarPermisosPorRol(db, rol) {
  if (!rol) return [];
  const rolNorm = rol.trim().toUpperCase();
  return consultarDB(
    db,
    'SELECT id_permiso, rol, modulo, puede_crear, puede_leer, puede_actualizar, puede_eliminar FROM rol_permiso WHERE rol = ? ORDER BY modulo ASC;',
    [rolNorm]
  );
}

/**
 * CRUD 12: READ - Lista todos los registros de la tabla rol_permiso
 */
export async function listarTodosPermisos(db) {
  return consultarDB(
    db,
    'SELECT id_permiso, rol, modulo, puede_crear, puede_leer, puede_actualizar, puede_eliminar FROM rol_permiso ORDER BY rol ASC, modulo ASC;'
  );
}

/**
 * CRUD 12: READ (Evaluación RBAC) - Verifica si un rol tiene permiso para una acción en un módulo
 * Por principio de menor privilegio, si no hay registro devuelve false.
 */
export async function tienePermiso(db, rol, modulo, accion) {
  if (!rol || !modulo || !accion) return false;

  const accionNorm = accion.trim().toLowerCase();
  const columna = MAPA_ACCIONES[accionNorm];
  if (!columna) {
    throw new Error(`Acción desconocida "${accion}". Válidas: ${ACCIONES_VALIDAS.join(', ')}`);
  }

  const permiso = await obtenerPermiso(db, rol, modulo);
  if (!permiso) return false;

  return Boolean(permiso[columna]);
}

/**
 * CRUD 12: UPDATE - Ajuste granular de lectura/escritura/creación/eliminación
 */
export async function actualizarPermiso(db, rol, modulo, ajustes = {}) {
  const actual = await obtenerPermiso(db, rol, modulo);
  if (!actual) {
    throw new Error(`No existe configuración de permisos para el rol "${rol}" en el módulo "${modulo}".`);
  }

  const rolNorm = rol.trim().toUpperCase();
  const moduloNorm = modulo.trim().toLowerCase();

  // Protección anti-bloqueo: no deshabilitar ROL_ADMIN en módulos de seguridad
  if (rolNorm === 'ROL_ADMIN' && ['usuarios', 'roles'].includes(moduloNorm)) {
    if (ajustes.puede_actualizar === 0 || ajustes.puedeActualizar === false) {
      throw new Error('No está permitido revocar permisos de administración sobre módulos de seguridad.');
    }
  }

  const clauses = [];
  if (ajustes.puede_crear !== undefined || ajustes.puedeCrear !== undefined) {
    clauses.push(`puede_crear = ${aBit(ajustes.puedeCrear ?? ajustes.puede_crear)}`);
  }
  if (ajustes.puede_leer !== undefined || ajustes.puedeLeer !== undefined) {
    clauses.push(`puede_leer = ${aBit(ajustes.puedeLeer ?? ajustes.puede_leer)}`);
  }
  if (ajustes.puede_actualizar !== undefined || ajustes.puedeActualizar !== undefined) {
    clauses.push(`puede_actualizar = ${aBit(ajustes.puedeActualizar ?? ajustes.puede_actualizar)}`);
  }
  if (ajustes.puede_eliminar !== undefined || ajustes.puedeEliminar !== undefined) {
    clauses.push(`puede_eliminar = ${aBit(ajustes.puedeEliminar ?? ajustes.puede_eliminar)}`);
  }

  if (clauses.length === 0) {
    return actual;
  }

  const sql = `
    UPDATE rol_permiso
    SET ${clauses.join(', ')}
    WHERE rol = ${esc(rolNorm)} AND modulo = ${esc(moduloNorm)};
  `.trim();

  await ejecutarDB(db, sql);
  return obtenerPermiso(db, rolNorm, moduloNorm);
}

/**
 * CRUD 12: DELETE - Revoca el permiso de un rol sobre un módulo particular
 */
export async function revocarPermisoModulo(db, rol, modulo) {
  const rolNorm = (rol || '').trim().toUpperCase();
  const moduloNorm = (modulo || '').trim().toLowerCase();

  if (rolNorm === 'ROL_ADMIN' && ['usuarios', 'roles'].includes(moduloNorm)) {
    throw new Error('No se pueden revocar permisos esenciales de ROL_ADMIN en módulos críticos.');
  }

  const sql = `DELETE FROM rol_permiso WHERE rol = ${esc(rolNorm)} AND modulo = ${esc(moduloNorm)};`;
  await ejecutarDB(db, sql);
  return true;
}

/**
 * CRUD 12: DELETE - Revoca todos los permisos de un rol secundario
 */
export async function eliminarPermisosRol(db, rol) {
  const rolNorm = (rol || '').trim().toUpperCase();
  if (rolNorm === 'ROL_ADMIN') {
    throw new Error('No está permitido eliminar los permisos del rol ROL_ADMIN del sistema.');
  }

  const sql = `DELETE FROM rol_permiso WHERE rol = ${esc(rolNorm)};`;
  await ejecutarDB(db, sql);
  return true;
}

/**
 * Matriz RBAC inicial del sistema
 * Aprovisiona la matriz por defecto para ROL_ADMIN y ROL_CONDUCTOR.
 */
export async function inicializarMatrizPermisos(db) {
  // ROL_ADMIN: control total en todos los módulos
  for (const modulo of MODULOS_SISTEMA) {
    await asignarPermiso(db, {
      rol: 'ROL_ADMIN',
      modulo,
      puede_crear: 1,
      puede_leer: 1,
      puede_actualizar: 1,
      puede_eliminar: 1
    });
  }

  // ROL_CONDUCTOR: privilegios limitados por segregación de funciones
  // Solo lectura en rutas, flota, mantenimiento y tacógrafo; creación/lectura en tacógrafo
  // Módulos administrativos (usuarios, roles, auditoria, organizacion) denegados estrictamente (0,0,0,0)
  for (const modulo of MODULOS_SISTEMA) {
    let puede_crear = 0;
    let puede_leer = 0;
    let puede_actualizar = 0;
    let puede_eliminar = 0;

    if (modulo === 'rutas' || modulo === 'flota' || modulo === 'conductores') {
      puede_leer = 1;
    } else if (modulo === 'tacografo') {
      puede_leer = 1;
      puede_crear = 1; // Registro de eventos propios de tacógrafo
    }

    await asignarPermiso(db, {
      rol: 'ROL_CONDUCTOR',
      modulo,
      puede_crear,
      puede_leer,
      puede_actualizar,
      puede_eliminar
    });
  }
}
