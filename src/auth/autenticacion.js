// Servicio de autenticación criptográfica y gestión de sesión activa (TTTRUCKS-25: Subtarea TTTRUCKS-28)
// Valida credenciales con SHA-256 + salt, gestiona el ciclo de vida de la sesión y actualiza ultimo_login.

import { verificarPassword } from './crypto.js';
import { obtenerUsuarioPorUsername } from './usuarios.js';
import { InterceptorAuditoria } from '../audit/interceptor.js';

// Helper para escapar cadenas SQL
function esc(val) {
  return val == null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Ejecuta una sentencia de mutación en SqliteClient o DatabaseSync
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
 * Gestor en memoria para la sesión activa del usuario
 */
export class GestorSesion {
  constructor() {
    this._sesion = null;
  }

  /**
   * Establece una nueva sesión activa
   * @param {object} sesion
   */
  iniciar(sesion) {
    if (!sesion || !sesion.id_usuario || !sesion.username || !sesion.rol) {
      throw new Error('Estructura de sesión inválida: se requieren id_usuario, username y rol.');
    }
    const timestampActual = new Date().toISOString();
    this._sesion = {
      ...sesion,
      iniciada_en: sesion.iniciada_en || timestampActual,
      ultimo_acceso: sesion.ultimo_acceso || timestampActual
    };
    return this._sesion;
  }

  /**
   * Finaliza la sesión activa
   */
  cerrar() {
    this._sesion = null;
  }

  /**
   * Comprueba si existe una sesión activa actualmente
   * @returns {boolean}
   */
  estaAutenticado() {
    return this._sesion !== null;
  }

  /**
   * Devuelve la sesión activa actual o null
   * @returns {object|null}
   */
  obtener() {
    return this._sesion;
  }

  /**
   * Actualiza la marca temporal de último acceso de la sesión
   */
  renovarActividad() {
    if (this._sesion) {
      this._sesion.ultimo_acceso = new Date().toISOString();
    }
  }
}

// Instancia singleton por defecto para la aplicación
export const gestorSesion = new GestorSesion();

/**
 * Valida credenciales contra la base de datos sin alterar la sesión activa
 * @param {object} db - Cliente SQLite o DatabaseSync
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<object>} Datos del usuario verificado (sin salt ni hash)
 */
export async function validarCredenciales(db, username, password) {
  if (!username || typeof username !== 'string' || !username.trim()) {
    throw new Error('Credenciales inválidas');
  }
  if (!password || typeof password !== 'string' || !password) {
    throw new Error('Credenciales inválidas');
  }

  const usuario = await obtenerUsuarioPorUsername(db, username.trim());
  if (!usuario) {
    throw new Error('Credenciales inválidas');
  }

  if (Number(usuario.activo) !== 1) {
    throw new Error('El usuario está inactivo o bloqueado.');
  }

  const esValida = await verificarPassword(password, usuario.salt, usuario.password_hash);
  if (!esValida) {
    throw new Error('Credenciales inválidas');
  }

  const { password_hash, salt, ...usuarioSeguro } = usuario;
  return usuarioSeguro;
}

/**
 * Autentica un usuario, inicia la sesión activa, actualiza ultimo_login y registra auditoría LOGIN
 * @param {object} db - Cliente SQLite o DatabaseSync
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña en texto plano
 * @param {object} [opciones] - Opciones adicionales (origen_sesion, registrarAuditoria, gestor)
 * @returns {Promise<object>} Objeto de sesión activa
 */
export async function autenticarUsuario(db, username, password, opciones = {}) {
  const {
    origen_sesion = 'local_pwa',
    registrarAuditoria = true,
    gestor = gestorSesion
  } = opciones;

  const usuarioSeguro = await validarCredenciales(db, username, password);
  const timestampIso = new Date().toISOString();

  // Actualizar ultimo_login en la tabla usuario
  const sqlUpdate = `
    UPDATE usuario
    SET ultimo_login = ${esc(timestampIso)}
    WHERE id_usuario = ${usuarioSeguro.id_usuario};
  `.trim();
  await ejecutarDB(db, sqlUpdate);

  const sesion = {
    id_usuario: usuarioSeguro.id_usuario,
    username: usuarioSeguro.username,
    nombre: usuarioSeguro.nombre,
    apellidos: usuarioSeguro.apellidos,
    email: usuarioSeguro.email,
    rol: usuarioSeguro.rol,
    origen_sesion,
    token: `sess_${usuarioSeguro.id_usuario}_${Date.now()}`,
    iniciada_en: timestampIso,
    ultimo_acceso: timestampIso
  };

  const sesionIniciada = gestor.iniciar(sesion);

  // Registro desasistido de auditoría de inicio de sesión
  if (registrarAuditoria) {
    try {
      await InterceptorAuditoria.registrar(
        db,
        {
          accion: 'LOGIN',
          entidad: 'usuario',
          id_registro: usuarioSeguro.id_usuario,
          valor_nuevo: { login_exitoso: true, timestamp: timestampIso }
        },
        sesionIniciada
      );
    } catch (e) {
      // Si la tabla log_auditoria no existiese o fallara en entornos reducidos, se reporta sin interrumpir el login
      console.warn('Aviso: no se pudo registrar evento de auditoría LOGIN:', e.message);
    }
  }

  return sesionIniciada;
}

/**
 * Cierra la sesión activa actual en el gestor indicado
 * @param {GestorSesion} [gestor] - Gestor de sesión a cerrar (por defecto el singleton)
 */
export function cerrarSesion(gestor = gestorSesion) {
  gestor.cerrar();
}

/**
 * Obtiene la sesión activa actual
 * @param {GestorSesion} [gestor] - Gestor de sesión (por defecto el singleton)
 * @returns {object|null}
 */
export function obtenerSesionActiva(gestor = gestorSesion) {
  return gestor.obtener();
}
