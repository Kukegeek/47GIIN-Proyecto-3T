// Servicio CRUD 11 para la entidad Usuario (TTTRUCKS-25: Subtarea TTTRUCKS-26)
// Soporta alta con hash SHA-256 + salt, consulta, edición y baja lógica (activo = 0).

import { generarSalt, hashearPassword } from './crypto.js';

export const ROLES_VALIDOS = Object.freeze(['ROL_ADMIN', 'ROL_CONDUCTOR']);

// Helper para escapar comillas simples en sentencias SQLite directas
function esc(val) {
  return val == null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;
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
 * CRUD 11: CREATE - Da de alta un usuario con hash SHA-256 + salt y rol
 */
export async function crearUsuario(db, datos) {
  const { username, password, nombre, apellidos = null, email = null, rol = 'ROL_CONDUCTOR' } = datos || {};

  if (!username || typeof username !== 'string' || !username.trim()) {
    throw new Error('El nombre de usuario (username) es obligatorio.');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    throw new Error('El nombre del usuario es obligatorio.');
  }

  const rolNormalizado = (rol || '').toUpperCase();
  if (!ROLES_VALIDOS.includes(rolNormalizado)) {
    throw new Error(`Rol inválido: "${rol}". Roles permitidos: ${ROLES_VALIDOS.join(', ')}`);
  }

  // Comprueba unicidad de username
  const existentes = await consultarDB(db, 'SELECT id_usuario FROM usuario WHERE username = ?;', [username.trim()]);
  if (existentes && existentes.length > 0) {
    throw new Error(`El nombre de usuario "${username}" ya está registrado.`);
  }

  const salt = generarSalt();
  const password_hash = await hashearPassword(password, salt);

  const sql = `
    INSERT INTO usuario (
      username, password_hash, salt, nombre, apellidos, email, rol, activo, creado_en
    ) VALUES (
      ${esc(username.trim())},
      ${esc(password_hash)},
      ${esc(salt)},
      ${esc(nombre.trim())},
      ${esc(apellidos?.trim())},
      ${esc(email?.trim())},
      ${esc(rolNormalizado)},
      1,
      datetime('now')
    );
  `.trim();

  await ejecutarDB(db, sql);

  // Recupera el registro recién insertado
  const creado = await consultarDB(db, 'SELECT id_usuario, username, nombre, apellidos, email, rol, activo, creado_en FROM usuario WHERE username = ?;', [username.trim()]);
  return creado[0] || null;
}

/**
 * CRUD 11: READ - Obtiene un usuario por ID (sin exponer salt ni password_hash)
 */
export async function obtenerUsuarioPorId(db, id_usuario) {
  const filas = await consultarDB(
    db,
    'SELECT id_usuario, username, nombre, apellidos, email, rol, activo, ultimo_login, creado_en FROM usuario WHERE id_usuario = ?;',
    [id_usuario]
  );
  return filas[0] || null;
}

/**
 * CRUD 11: READ - Obtiene un usuario por username (incluye salt y hash para autenticación interna)
 */
export async function obtenerUsuarioPorUsername(db, username) {
  const filas = await consultarDB(
    db,
    'SELECT id_usuario, username, password_hash, salt, nombre, apellidos, email, rol, activo, ultimo_login, creado_en FROM usuario WHERE username = ?;',
    [username]
  );
  return filas[0] || null;
}

/**
 * CRUD 11: READ - Lista todos los usuarios (operadores) con su último login
 */
export async function listarUsuarios(db, { soloActivos = false } = {}) {
  const sql = soloActivos
    ? 'SELECT id_usuario, username, nombre, apellidos, email, rol, activo, ultimo_login, creado_en FROM usuario WHERE activo = 1 ORDER BY id_usuario ASC;'
    : 'SELECT id_usuario, username, nombre, apellidos, email, rol, activo, ultimo_login, creado_en FROM usuario ORDER BY id_usuario ASC;';
  return consultarDB(db, sql);
}

/**
 * CRUD 11: UPDATE - Modifica datos de perfil, rol o contraseña de un usuario
 */
export async function actualizarUsuario(db, id_usuario, cambios = {}) {
  const usuarioActual = await obtenerUsuarioPorId(db, id_usuario);
  if (!usuarioActual) {
    throw new Error(`Usuario con ID ${id_usuario} no encontrado.`);
  }

  const setClauses = [];

  if (cambios.nombre != null) {
    if (!cambios.nombre.trim()) throw new Error('El nombre no puede estar vacío.');
    setClauses.push(`nombre = ${esc(cambios.nombre.trim())}`);
  }
  if (cambios.apellidos !== undefined) {
    setClauses.push(`apellidos = ${esc(cambios.apellidos?.trim())}`);
  }
  if (cambios.email !== undefined) {
    setClauses.push(`email = ${esc(cambios.email?.trim())}`);
  }
  if (cambios.rol != null) {
    const rolNorm = cambios.rol.toUpperCase();
    if (!ROLES_VALIDOS.includes(rolNorm)) {
      throw new Error(`Rol inválido: "${cambios.rol}". Permitidos: ${ROLES_VALIDOS.join(', ')}`);
    }
    setClauses.push(`rol = ${esc(rolNorm)}`);
  }
  if (cambios.password != null) {
    if (cambios.password.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    const nuevoSalt = generarSalt();
    const nuevoHash = await hashearPassword(cambios.password, nuevoSalt);
    setClauses.push(`salt = ${esc(nuevoSalt)}`);
    setClauses.push(`password_hash = ${esc(nuevoHash)}`);
  }
  if (cambios.ultimo_login !== undefined) {
    setClauses.push(`ultimo_login = ${esc(cambios.ultimo_login)}`);
  }

  if (setClauses.length === 0) {
    return usuarioActual;
  }

  const sql = `UPDATE usuario SET ${setClauses.join(', ')} WHERE id_usuario = ${id_usuario};`;
  await ejecutarDB(db, sql);

  return obtenerUsuarioPorId(db, id_usuario);
}

/**
 * CRUD 11: DELETE - Bloqueo/baja lógica del usuario (activo = 0) para preservar integridad referencial e históricos
 */
export async function bajaLogicaUsuario(db, id_usuario) {
  const usuarioActual = await obtenerUsuarioPorId(db, id_usuario);
  if (!usuarioActual) {
    throw new Error(`Usuario con ID ${id_usuario} no encontrado.`);
  }

  const sql = `UPDATE usuario SET activo = 0 WHERE id_usuario = ${id_usuario};`;
  await ejecutarDB(db, sql);

  return { id_usuario, activo: 0, baja_logica: true };
}

/**
 * Reactiva un usuario previamente dado de baja lógica (activo = 1)
 */
export async function reactivarUsuario(db, id_usuario) {
  const usuarioActual = await obtenerUsuarioPorId(db, id_usuario);
  if (!usuarioActual) {
    throw new Error(`Usuario con ID ${id_usuario} no encontrado.`);
  }

  const sql = `UPDATE usuario SET activo = 1 WHERE id_usuario = ${id_usuario};`;
  await ejecutarDB(db, sql);

  return { id_usuario, activo: 1, reactivado: true };
}
