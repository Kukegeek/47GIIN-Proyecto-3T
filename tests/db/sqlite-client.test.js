import test from 'node:test';
import assert from 'node:assert/strict';
import { SqliteClient } from '../../src/db/sqlite-client.js';

test('TTTRUCKS-23 - SqliteClient protocolo de mensajería y gestión de promesas', async (t) => {
  await t.test('Instanciación con valores iniciales por defecto', () => {
    const client = new SqliteClient();
    assert.equal(client.estado, 'no_iniciado');
    assert.equal(typeof client.inicializar, 'function');
    assert.equal(typeof client.ejecutar, 'function');
    assert.equal(typeof client.consultar, 'function');
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
  });

  // Crea un mock de worker que simula respuestas basadas en el tipo de mensaje
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
      postMessage() {}, // No responde nunca
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
});
