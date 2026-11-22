// Interceptor transaccional de auditoría inmutable (TTTRUCKS-30: Subtarea TTTRUCKS-31)
// Garantiza el registro append-only de eventos INSERT, UPDATE, DELETE y LOGIN en log_auditoria.

export const ACCIONES_VALIDAS = Object.freeze(['INSERT', 'UPDATE', 'DELETE', 'LOGIN']);

/**
 * Valida y normaliza los datos de un evento de auditoría
 * @param {object} evento - Datos del evento (accion, entidad, id_registro, etc.)
 * @param {object} [sesion] - Sesión del usuario actual (id_usuario, username, rol, etc.)
 * @returns {object} Evento normalizado
 */
export function normalizarEvento(evento, sesion = null) {
  if (!evento || typeof evento !== 'object') {
    throw new Error('El evento de auditoría es obligatorio y debe ser un objeto.');
  }

  const accion = (evento.accion || '').toUpperCase();
  if (!ACCIONES_VALIDAS.includes(accion)) {
    throw new Error(`Acción de auditoría no válida: "${evento.accion}". Permitidas: ${ACCIONES_VALIDAS.join(', ')}`);
  }

  if (!evento.entidad || typeof evento.entidad !== 'string') {
    throw new Error('La entidad auditada es obligatoria.');
  }

  // Si hay sesión activa del usuario, sus credenciales prevalecen sobre el payload
  const id_usuario = sesion?.id_usuario ?? evento.id_usuario ?? null;
  const username = sesion?.username ?? evento.username ?? 'sistema';
  const rol_ejecutor = sesion?.rol ?? sesion?.rol_ejecutor ?? evento.rol_ejecutor ?? 'ROL_SISTEMA';
  const origen_sesion = sesion?.origen_sesion ?? evento.origen_sesion ?? 'local_pwa';

  return {
    id_usuario,
    username,
    rol_ejecutor,
    accion,
    entidad: evento.entidad,
    id_registro: evento.id_registro != null ? String(evento.id_registro) : null,
    valor_anterior: evento.valor_anterior != null ? (typeof evento.valor_anterior === 'object' ? JSON.stringify(evento.valor_anterior) : String(evento.valor_anterior)) : null,
    valor_nuevo: evento.valor_nuevo != null ? (typeof evento.valor_nuevo === 'object' ? JSON.stringify(evento.valor_nuevo) : String(evento.valor_nuevo)) : null,
    timestamp_utc: evento.timestamp_utc || new Date().toISOString(),
    origen_sesion
  };
}

/**
 * Interceptor de auditoría para registrar operaciones en log_auditoria
 */
export class InterceptorAuditoria {
  /**
   * Registra un evento en la tabla log_auditoria de forma append-only
   * @param {object} clienteSqlite - Cliente SQLite o contexto transaccional
   * @param {object} evento - Datos del evento a registrar
   * @param {object} [sesion] - Datos de sesión del usuario ejecutor
   * @returns {Promise<object>} Datos del evento registrado
   */
  static async registrar(clienteSqlite, evento, sesion = null) {
    if (!clienteSqlite || (typeof clienteSqlite.ejecutar !== 'function' && typeof clienteSqlite.exec !== 'function')) {
      throw new Error('Se requiere un cliente SQLite o contexto transaccional válido.');
    }

    const datos = normalizarEvento(evento, sesion);

    // Escape seguro de cadenas SQL simples
    const escape = (val) => val == null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;

    const sql = `
      INSERT INTO log_auditoria (
        id_usuario, username, rol_ejecutor, accion, entidad,
        id_registro, valor_anterior, valor_nuevo, timestamp_utc, origen_sesion
      ) VALUES (
        ${datos.id_usuario == null ? 'NULL' : datos.id_usuario},
        ${escape(datos.username)},
        ${escape(datos.rol_ejecutor)},
        ${escape(datos.accion)},
        ${escape(datos.entidad)},
        ${escape(datos.id_registro)},
        ${escape(datos.valor_anterior)},
        ${escape(datos.valor_nuevo)},
        ${escape(datos.timestamp_utc)},
        ${escape(datos.origen_sesion)}
      );
    `.trim();

    if (typeof clienteSqlite.ejecutar === 'function') {
      await clienteSqlite.ejecutar(sql);
    } else {
      clienteSqlite.exec(sql);
    }

    return datos;
  }

  /**
   * Ejecuta una mutación dentro de una transacción asegurando que el registro de auditoría
   * se realice atómicamente en la misma transacción (commit conjunto o rollback conjunto).
   *
   * @param {object} clienteSqlite - Instancia de SqliteClient con método transaccion()
   * @param {object} sesion - Sesión del usuario actual
   * @param {object} evento - Metadatos de la acción auditada
   * @param {Function} operacion - Callback que realiza la mutación en base de datos
   * @returns {Promise<any>}
   */
  static async ejecutarConAuditoria(clienteSqlite, sesion, evento, operacion) {
    if (!clienteSqlite || typeof clienteSqlite.transaccion !== 'function') {
      throw new Error('El cliente proporcionado no soporta transacciones.');
    }

    return clienteSqlite.transaccion(async (tx) => {
      const resultado = await operacion(tx);
      const idReg = evento.id_registro ?? resultado?.id ?? resultado?.id_registro ?? null;
      await InterceptorAuditoria.registrar(tx, { ...evento, id_registro: idReg }, sesion);
      return resultado;
    });
  }
}
