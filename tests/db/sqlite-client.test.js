import test from 'node:test';
import assert from 'node:assert/strict';
import { SqliteClient } from '../../src/db/sqlite-client.js';

test('TTTRUCKS-20 Subtarea TTTRUCKS-23 - SqliteClient estructura y protocolo de mensajería', async (t) => {
  await t.test('Instanciación con valores por defecto', () => {
    const client = new SqliteClient();
    assert.equal(client.estado, 'no_iniciado');
    assert.equal(typeof client.inicializar, 'function');
    assert.equal(typeof client.ejecutar, 'function');
    assert.equal(typeof client.consultar, 'function');
    assert.equal(typeof client.obtenerEstado, 'function');
  });

  await t.test('Llamar métodos sin inicializar worker lanza error controlado', async () => {
    const client = new SqliteClient();
    await assert.rejects(
      async () => client.ejecutar('SELECT 1'),
      /El worker no ha sido iniciado/
    );
  });

  await t.test('Protocolo de promesas procesa respuestas correctamente', async () => {
    const mockWorker = {
      postMessage(msg) {
        setTimeout(() => {
          if (mockWorker.onmessage) {
            mockWorker.onmessage({
              data: { id: msg.id, ok: true, resultado: { ok: true, status: 'simulado' } }
            });
          }
        }, 5);
      },
      terminate() {}
    };

    const client = new SqliteClient();
    client._conectarWorker(mockWorker);
    client.estado = 'listo';

    const res = await client.ejecutar('CREATE TABLE test (id INT);');
    assert.deepEqual(res, { ok: true, status: 'simulado' });
    client.cerrar();
    assert.equal(client.estado, 'cerrado');
  });
});
