import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SQL_TRIGGERS_INMUTABILIDAD,
  activarInmutabilidad,
  validarInmutabilidad
} from '../../src/audit/inmutabilidad.js';
import { verificarAutorizacionSQL, ForbiddenError } from '../../src/auth/guardias.js';

describe('TTTRUCKS-30 Subtarea TTTRUCKS-33 - Inmutabilidad Estricta de log_auditoria (Bloqueo UPDATE/DELETE)', () => {
  let db;
  const sesionAdmin = { id_usuario: 1, username: 'admin', rol: 'ROL_ADMIN' };
  const sesionConductor = { id_usuario: 2, username: 'conductor', rol: 'ROL_CONDUCTOR' };

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    const schemaPath = resolve(process.cwd(), 'sql/schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);

    // Sembrar un registro inicial de auditoría legítimo
    db.exec(`
      INSERT INTO log_auditoria (id_log, username, rol_ejecutor, accion, entidad, id_registro, timestamp_utc)
      VALUES (1, 'sistema', 'ROL_SISTEMA', 'LOGIN', 'auth', 'ses-1', '2026-11-23T12:00:00.000Z');
    `);
  });

  describe('Bloqueo mediante Triggers nativos de SQLite', () => {
    it('Permite inserciones legítimas (naturaleza append-only)', () => {
      db.exec(`
        INSERT INTO log_auditoria (username, rol_ejecutor, accion, entidad, id_registro)
        VALUES ('admin', 'ROL_ADMIN', 'INSERT', 'vehiculo', 'veh-99');
      `);

      const filas = db.prepare('SELECT count(*) as total FROM log_auditoria;').get();
      assert.equal(filas.total, 2);
    });

    it('Triggers bloquean cualquier UPDATE sobre log_auditoria lanzando excepción 403', () => {
      assert.throws(
        () => {
          db.exec("UPDATE log_auditoria SET username = 'hacker' WHERE id_log = 1;");
        },
        /403 Forbidden: La tabla log_auditoria es estrictamente inmutable/
      );

      // Comprobar que el valor original permanece inalterado
      const row = db.prepare('SELECT username FROM log_auditoria WHERE id_log = 1;').get();
      assert.equal(row.username, 'sistema');
    });

    it('Triggers bloquean cualquier DELETE sobre log_auditoria lanzando excepción 403', () => {
      assert.throws(
        () => {
          db.exec('DELETE FROM log_auditoria WHERE id_log = 1;');
        },
        /403 Forbidden: La tabla log_auditoria es estrictamente inmutable/
      );

      // Comprobar que el registro sigue existiendo
      const row = db.prepare('SELECT count(*) as total FROM log_auditoria WHERE id_log = 1;').get();
      assert.equal(row.total, 1);
    });

    it('activarInmutabilidad es idempotente y crea los triggers en esquemas sin ellos', async () => {
      const dbLimpia = new DatabaseSync(':memory:');
      dbLimpia.exec(`
        CREATE TABLE log_auditoria (
          id_log INTEGER PRIMARY KEY,
          username TEXT
        );
      `);

      await activarInmutabilidad(dbLimpia);

      dbLimpia.exec("INSERT INTO log_auditoria (id_log, username) VALUES (1, 'test');");

      assert.throws(
        () => dbLimpia.exec("DELETE FROM log_auditoria WHERE id_log = 1;"),
        /403 Forbidden/
      );
    });
  });

  describe('Validación y defensa en profundidad en la capa de datos (guardias.js)', () => {
    it('validarInmutabilidad rechaza UPDATE y DELETE sobre log_auditoria con ForbiddenError', () => {
      assert.throws(
        () => validarInmutabilidad('UPDATE log_auditoria SET accion = "HACK"'),
        (err) => err instanceof ForbiddenError && err.status === 403
      );

      assert.throws(
        () => validarInmutabilidad('DELETE FROM log_auditoria'),
        (err) => err instanceof ForbiddenError && err.status === 403
      );

      // Consultas de inserción y lectura son permitidas por el validador
      assert.equal(validarInmutabilidad('INSERT INTO log_auditoria (accion) VALUES ("INSERT")'), true);
      assert.equal(validarInmutabilidad('SELECT * FROM log_auditoria'), true);
    });

    it('verificarAutorizacionSQL bloquea UPDATE o DELETE en log_auditoria incluso a ROL_ADMIN', async () => {
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionAdmin, 'UPDATE log_auditoria SET username = "root";'),
        (err) => err instanceof ForbiddenError && err.status === 403 && /estrictamente inmutable/.test(err.message)
      );

      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionAdmin, 'DELETE FROM log_auditoria WHERE id_log = 1;'),
        (err) => err instanceof ForbiddenError && err.status === 403 && /estrictamente inmutable/.test(err.message)
      );
    });

    it('verificarAutorizacionSQL bloquea igualmente a ROL_CONDUCTOR', async () => {
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, 'DELETE FROM log_auditoria WHERE id_log = 1;'),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });
  });
});
