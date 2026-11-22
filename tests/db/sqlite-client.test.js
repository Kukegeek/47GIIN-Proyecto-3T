import test from 'node:test';
import assert from 'node:assert/strict';
import { SqliteClient } from '../../src/db/sqlite-client.js';

test('TTTRUCKS-23 y TTTRUCKS-24 - SqliteClient protocolo, transacciones y bootstrapping', async (t) => {
  await t.test('Instanciación con valores iniciales por defecto', () => {
    const client = new SqliteClient();
    assert.equal(client.estado, 'no_iniciado');
    assert.equal(typeof client.inicializar, 'function');
    assert.equal(typeof client.ejecutar, 'function');
    assert.equal(typeof client.consultar, 'function');
    assert.equal(typeof client.transaccion, 'function');
    assert.equal(typeof client.esquemaInicializado, 'function');
    assert.equal(typeof client.bootstrap, 'function');
    assert.equal(typeof client.obtenerEstado, 'function');
    assert.equal(typeof client.cerrar, 'function');
  });

  await t.test('Llamar métodos sin worker activo lanza error controlado', async () => {
    const client = new SqliteClient();
    await assert.rejects(
      async () => client.ejecutar('SELECT 1'),
      /El worker no ha sido iniciado/
    );
    await assert.rejects(
      async () => client.consultar('SELECT * FROM test'),
      /El worker no ha sido iniciado/
    );
    await assert.rejects(
      async () => client.obtenerEstado(),
      /El worker no ha sido iniciado/
    );
    await assert.rejects(
      async () => client.transaccion(async () => {}),
      /El worker no ha sido iniciado/
    );
  });

  // Mock de worker que simula respuestas basadas en el tipo de mensaje
  const crearMockWorker = (manejador) => {
    const mock = {
      postMessage(msg) {
        setTimeout(() => {
          if (mock.onmessage) {
            manejador(msg, (respuesta) => {
              mock.onmessage({ data: { id: msg.id, ...respuesta } });
            });
          }
        }, 2);
      },
      terminate() {}
    };
    return mock;
  };

  await t.test('Protocolo de promesas procesa EXEC correctamente', async () => {
    const mock = crearMockWorker((msg, responder) => {
      assert.equal(msg.tipo, 'EXEC');
      assert.equal(msg.payload.sql, 'CREATE TABLE test (id INT);');
      responder({ ok: true, resultado: { ok: true } });
    });

    const client = new SqliteClient();
    client._conectarWorker(mock);
    client.estado = 'listo';

    const res = await client.ejecutar('CREATE TABLE test (id INT);');
    assert.deepEqual(res, { ok: true });
  });

  await t.test('Protocolo de promesas procesa QUERY con parámetros correctamente', async () => {
    const mock = crearMockWorker((msg, responder) => {
      assert.equal(msg.tipo, 'QUERY');
      assert.deepEqual(msg.payload.params, [42]);
      responder({
        ok: true,
        resultado: [{ id: 42, nombre: 'Prueba' }]
      });
    });

    const client = new SqliteClient();
    client._conectarWorker(mock);
    client.estado = 'listo';

    const filas = await client.consultar('SELECT * FROM test WHERE id = ?;', [42]);
    assert.deepEqual(filas, [{ id: 42, nombre: 'Prueba' }]);
  });

  await t.test('Protocolo de promesas procesa STATUS correctamente', async () => {
    const mock = crearMockWorker((msg, responder) => {
      assert.equal(msg.tipo, 'STATUS');
      responder({
        ok: true,
        resultado: { ok: true, inicializado: true, storageType: 'OPFS', dbName: 'test.db' }
      });
    });

    const client = new SqliteClient();
    client._conectarWorker(mock);
    client.estado = 'listo';

    const estado = await client.obtenerEstado();
    assert.equal(estado.storageType, 'OPFS');
    assert.equal(estado.inicializado, true);
  });

  await t.test('Respuesta con ok: false rechaza la promesa con el mensaje de error', async () => {
    const mock = crearMockWorker((msg, responder) => {
      responder({ ok: false, error: 'syntax error in SQL statement' });
    });

    const client = new SqliteClient();
    client._conectarWorker(mock);
    client.estado = 'listo';

    await assert.rejects(
      async () => client.ejecutar('SQL INVALIDO'),
      /syntax error in SQL statement/
    );
  });

  await t.test('cerrar() rechaza peticiones pendientes y marca estado cerrado', async () => {
    const mock = {
      postMessage() {},
      terminate() {}
    };

    const client = new SqliteClient();
    client._conectarWorker(mock);
    client.estado = 'listo';

    const promesa = client.ejecutar('SELECT 1');
    client.cerrar();

    await assert.rejects(promesa, /Cliente cerrado antes de completar la operación/);
    assert.equal(client.estado, 'cerrado');
  });

  // Pruebas específicas para TTTRUCKS-24 (Transacciones y Bootstrapping)
  await t.test('transaccion ejecuta BEGIN, operaciones y COMMIT en caso de éxito', async () => {
    const historial = [];
    const mock = crearMockWorker((msg, responder) => {
      if (msg.tipo === 'EXEC') {
        historial.push(msg.payload.sql);
        responder({ ok: true, resultado: { ok: true } });
      }
    });

    const client = new SqliteClient();
    client._conectarWorker(mock);
    client.estado = 'listo';

    const res = await client.transaccion(async (tx) => {
      await tx.ejecutar('INSERT INTO test VALUES (1);');
      await tx.ejecutar('INSERT INTO test VALUES (2);');
      return 'completado';
    });

    assert.equal(res, 'completado');
    assert.deepEqual(historial, [
      'BEGIN TRANSACTION;',
      'INSERT INTO test VALUES (1);',
      'INSERT INTO test VALUES (2);',
      'COMMIT;'
    ]);
  });

  await t.test('transaccion ejecuta ROLLBACK si el callback lanza error', async () => {
    const historial = [];
    const mock = crearMockWorker((msg, responder) => {
      if (msg.tipo === 'EXEC') {
        historial.push(msg.payload.sql);
        responder({ ok: true, resultado: { ok: true } });
      }
    });

    const client = new SqliteClient();
    client._conectarWorker(mock);
    client.estado = 'listo';

    await assert.rejects(
      async () => {
        await client.transaccion(async (tx) => {
          await tx.ejecutar('INSERT INTO test VALUES (1);');
          throw new Error('Fallo provocado en negocio');
        });
      },
      /Fallo provocado en negocio/
    );

    assert.deepEqual(historial, [
      'BEGIN TRANSACTION;',
      'INSERT INTO test VALUES (1);',
      'ROLLBACK;'
    ]);
  });

  await t.test('bootstrap ejecuta DDL completo si las tablas no existen', async () => {
    const historial = [];
    let consultoTablas = false;

    const mock = crearMockWorker((msg, responder) => {
      if (msg.tipo === 'QUERY') {
        consultoTablas = true;
        // Simula base de datos vacía (0 tablas)
        responder({ ok: true, resultado: [{ total: 0 }] });
      } else if (msg.tipo === 'EXEC') {
        historial.push(msg.payload.sql);
        responder({ ok: true, resultado: { ok: true } });
      }
    });

    const client = new SqliteClient();
    client._conectarWorker(mock);
    client.estado = 'listo';

    const res = await client.bootstrap('CREATE TABLE t1 (id INT); CREATE TABLE t2 (id INT);');
    assert.deepEqual(res, { inicializado: true, yaExistia: false });
    assert.equal(consultoTablas, true);
    assert.equal(historial[0], 'BEGIN TRANSACTION;');
    assert.equal(historial[1], 'CREATE TABLE t1 (id INT); CREATE TABLE t2 (id INT);');
    assert.equal(historial[2], 'COMMIT;');
  });

  await t.test('bootstrap no ejecuta DDL si las 15 tablas ya existen', async () => {
    const historial = [];

    const mock = crearMockWorker((msg, responder) => {
      if (msg.tipo === 'QUERY') {
        // Simula base de datos ya inicializada con 15 tablas
        responder({ ok: true, resultado: [{ total: 15 }] });
      } else if (msg.tipo === 'EXEC') {
        historial.push(msg.payload.sql);
        responder({ ok: true, resultado: { ok: true } });
      }
    });

    const client = new SqliteClient();
    client._conectarWorker(mock);
    client.estado = 'listo';

    const res = await client.bootstrap('CREATE TABLE t1 (id INT);');
    assert.deepEqual(res, { inicializado: true, yaExistia: true });
    assert.equal(historial.length, 0); // No ejecuta ningún EXEC
  });

  await t.test('bootstrap lanza error si no se pasa DDL', async () => {
    const client = new SqliteClient();
    await assert.rejects(
      async () => client.bootstrap(''),
      /El script DDL es obligatorio/
    );
  });
});
