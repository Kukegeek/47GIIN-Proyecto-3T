import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { normalizarEvento, InterceptorAuditoria, ACCIONES_VALIDAS } from '../../src/audit/interceptor.js';

test('TTTRUCKS-30 Subtarea TTTRUCKS-31 - Interceptor transaccional de auditoría', async (t) => {
  await t.test('Constante ACCIONES_VALIDAS incluye INSERT, UPDATE, DELETE y LOGIN', () => {
    assert.deepEqual([...ACCIONES_VALIDAS], ['INSERT', 'UPDATE', 'DELETE', 'LOGIN']);
  });

  await t.test('normalizarEvento valida y asigna campos con y sin sesión', () => {
    // Sin sesión (usuario por defecto sistema)
    const ev1 = normalizarEvento({
      accion: 'insert',
      entidad: 'vehiculo',
      id_registro: 10
    });
    assert.equal(ev1.accion, 'INSERT');
    assert.equal(ev1.entidad, 'vehiculo');
    assert.equal(ev1.id_registro, '10');
    assert.equal(ev1.username, 'sistema');
    assert.equal(ev1.rol_ejecutor, 'ROL_SISTEMA');
    assert.equal(ev1.id_usuario, null);

    // Con sesión activa
    const sesion = { id_usuario: 5, username: 'carlos_admin', rol: 'ROL_ADMIN', origen_sesion: 'web_chrome' };
    const ev2 = normalizarEvento({
      accion: 'DELETE',
      entidad: 'usuario',
      id_registro: '2'
    }, sesion);
    assert.equal(ev2.accion, 'DELETE');
    assert.equal(ev2.id_usuario, 5);
    assert.equal(ev2.username, 'carlos_admin');
    assert.equal(ev2.rol_ejecutor, 'ROL_ADMIN');
    assert.equal(ev2.origen_sesion, 'web_chrome');
  });

  await t.test('normalizarEvento rechaza acciones desconocidas o eventos sin entidad', () => {
    assert.throws(
      () => normalizarEvento({ accion: 'DROP', entidad: 'usuario' }),
      /Acción de auditoría no válida/
    );
    assert.throws(
      () => normalizarEvento({ accion: 'INSERT' }),
      /La entidad auditada es obligatoria/
    );
    assert.throws(
      () => normalizarEvento(null),
      /El evento de auditoría es obligatorio/
    );
  });

  await t.test('InterceptorAuditoria.registrar lanza error sin cliente SQLite', async () => {
    await assert.rejects(
      async () => InterceptorAuditoria.registrar(null, { accion: 'INSERT', entidad: 'usuario' }),
      /Se requiere un cliente SQLite/
    );
  });

  await t.test('InterceptorAuditoria.registrar formatea y ejecuta INSERT en log_auditoria', async () => {
    let sqlEjecutado = '';
    const mockCliente = {
      async ejecutar(sql) {
        sqlEjecutado = sql;
        return { ok: true };
      }
    };

    const res = await InterceptorAuditoria.registrar(
      mockCliente,
      {
        accion: 'LOGIN',
        entidad: 'auth',
        id_registro: 'sesion-123',
        valor_nuevo: { exito: true }
      },
      { id_usuario: 1, username: 'admin', rol: 'ROL_ADMIN' }
    );

    assert.equal(res.accion, 'LOGIN');
    assert.equal(res.username, 'admin');
    assert.ok(sqlEjecutado.includes('INSERT INTO log_auditoria'));
    assert.ok(sqlEjecutado.includes("'LOGIN'"));
    assert.ok(sqlEjecutado.includes("'auth'"));
    assert.ok(sqlEjecutado.includes("'sesion-123'"));
    assert.ok(sqlEjecutado.includes("'admin'"));
  });

  await t.test('ejecutarConAuditoria realiza commit atómico conjunto', async () => {
    const orden = [];
    const mockCliente = {
      async transaccion(callback) {
        orden.push('BEGIN');
        const res = await callback({
          async ejecutar(sql) {
            orden.push(`EXEC: ${sql.split(' ')[0]}`);
          }
        });
        orden.push('COMMIT');
        return res;
      }
    };

    const sesion = { id_usuario: 2, username: 'operador', rol: 'ROL_ADMIN' };
    const resultado = await InterceptorAuditoria.ejecutarConAuditoria(
      mockCliente,
      sesion,
      { accion: 'INSERT', entidad: 'organizacion' },
      async (tx) => {
        await tx.ejecutar('INSERT INTO organizacion ...');
        return { id_registro: 'org-1' };
      }
    );

    assert.deepEqual(resultado, { id_registro: 'org-1' });
    assert.deepEqual(orden, ['BEGIN', 'EXEC: INSERT', 'EXEC: INSERT', 'COMMIT']);
  });

  await t.test('Integración real en SQLite: inserción verificada en tabla log_auditoria', () => {
    const db = new DatabaseSync(':memory:');
    const schemaPath = path.resolve(process.cwd(), 'sql/schema.sql');
    const ddl = fs.readFileSync(schemaPath, 'utf8');
    db.exec(ddl);

    // Registro síncrono mediante el método compatible
    const sesion = { id_usuario: null, username: 'conductor1', rol: 'ROL_CONDUCTOR', origen_sesion: 'app_movil' };
    InterceptorAuditoria.registrar(
      db,
      {
        accion: 'INSERT',
        entidad: 'repostaje',
        id_registro: 'rep-99',
        valor_nuevo: { litros: 450, precio: 620 }
      },
      sesion
    );

    const filas = db.prepare('SELECT * FROM log_auditoria WHERE entidad = ?').all('repostaje');
    assert.equal(filas.length, 1);
    assert.equal(filas[0].id_log, 1);
    assert.equal(filas[0].username, 'conductor1');
    assert.equal(filas[0].rol_ejecutor, 'ROL_CONDUCTOR');
    assert.equal(filas[0].accion, 'INSERT');
    assert.equal(filas[0].entidad, 'repostaje');
    assert.equal(filas[0].id_registro, 'rep-99');
    assert.ok(filas[0].timestamp_utc);
  });
});
