// Módulo de inmutabilidad estricta para log_auditoria (TTTRUCKS-30: Subtarea TTTRUCKS-33)
// Garantiza la naturaleza estrictamente append-only bloqueando UPDATE y DELETE en BBDD y capa de persistencia.

import { ForbiddenError } from '../auth/guardias.js';

export const SQL_TRIGGERS_INMUTABILIDAD = `
CREATE TRIGGER IF NOT EXISTS trg_inmutabilidad_update_log_auditoria
BEFORE UPDATE ON log_auditoria
BEGIN
    SELECT RAISE(FAIL, '403 Forbidden: La tabla log_auditoria es estrictamente inmutable (append-only). No se permiten modificaciones.');
END;

CREATE TRIGGER IF NOT EXISTS trg_inmutabilidad_delete_log_auditoria
BEFORE DELETE ON log_auditoria
BEGIN
    SELECT RAISE(FAIL, '403 Forbidden: La tabla log_auditoria es estrictamente inmutable (append-only). No se permite el borrado de registros.');
END;
`.trim();

/**
 * Activa los triggers de inmutabilidad en la conexión o cliente SQLite indicado
 * @param {object} db - Instancia de base de datos (DatabaseSync o SqliteClient)
 */
export async function activarInmutabilidad(db) {
  if (!db) {
    throw new Error('Se requiere una instancia válida de base de datos.');
  }

  if (typeof db.ejecutar === 'function') {
    await db.ejecutar(SQL_TRIGGERS_INMUTABILIDAD);
  } else if (typeof db.exec === 'function') {
    db.exec(SQL_TRIGGERS_INMUTABILIDAD);
  } else {
    throw new Error('Cliente de base de datos no compatible');
  }

  return true;
}

/**
 * Valida a nivel aplicativo si una sentencia intenta mutar destructivamente log_auditoria
 * @param {string} sql - Sentencia SQL a evaluar
 * @throws {ForbiddenError} Si la sentencia es UPDATE o DELETE sobre log_auditoria
 */
export function validarInmutabilidad(sql) {
  if (!sql || typeof sql !== 'string') return true;

  const texto = sql.trim().replace(/\s+/g, ' ');
  const esUpdate = /UPDATE\s+log_auditoria\b/i.test(texto);
  const esDelete = /DELETE\s+FROM\s+log_auditoria\b/i.test(texto);

  if (esUpdate || esDelete) {
    const accion = esUpdate ? 'modificación (UPDATE)' : 'borrado (DELETE)';
    throw new ForbiddenError(
      `403 Forbidden: La tabla log_auditoria es estrictamente inmutable (append-only). Intento de ${accion} rechazado.`
    );
  }

  return true;
}
