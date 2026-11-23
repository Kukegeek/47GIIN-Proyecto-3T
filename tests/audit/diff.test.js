import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  generarTimestampUTC,
  esTimestampUTCValido,
  resolverOrigenSesion,
  calcularDiff,
  prepararEventoAuditoria,
  CAMPOS_SENSIBLES
} from '../../src/audit/diff.js';
import { InterceptorAuditoria } from '../../src/audit/interceptor.js';

describe('TTTRUCKS-30 Subtarea TTTRUCKS-32 - Motor de Cálculo de Diff JSON y Marcas Temporales UTC', () => {
  describe('Generación y validación de Timestamp UTC (ISO-8601)', () => {
    it('generarTimestampUTC produce una marca temporal ISO-8601 válida en UTC', () => {
      const ts = generarTimestampUTC();
      assert.ok(typeof ts === 'string');
      assert.ok(ts.endsWith('Z'));
      assert.equal(esTimestampUTCValido(ts), true);
    });

    it('esTimestampUTCValido rechaza cadenas no conformes o fechas inválidas', () => {
      assert.equal(esTimestampUTCValido('2026-11-23 09:40:00'), false);
      assert.equal(esTimestampUTCValido('fecha-invalida'), false);
      assert.equal(esTimestampUTCValido(null), false);
      assert.equal(esTimestampUTCValido(''), false);
    });

    it('generarTimestampUTC lanza error con fechas inválidas', () => {
      assert.throws(() => generarTimestampUTC('no-es-fecha'), /Fecha inválida/);
    });
  });

  describe('Resolución de origen_sesion', () => {
    it('Usa el origen_sesion de la sesión si está presente', () => {
      const sesion = { origen_sesion: 'movil_conductor' };
      assert.equal(resolverOrigenSesion(sesion), 'movil_conductor');
    });

    it('Aplica fallback "local_pwa" en ausencia de sesión o valor explícito', () => {
      assert.equal(resolverOrigenSesion(null), 'local_pwa');
      assert.equal(resolverOrigenSesion({}), 'local_pwa');
      assert.equal(resolverOrigenSesion({ origen_sesion: '  ' }), 'local_pwa');
    });
  });

  describe('Motor de cálculo de diferencias (diff JSON)', () => {
    it('INSERT: valor_anterior es null y valor_nuevo contiene el estado creado', () => {
      const nuevo = { matricula: '1234BBB', marca: 'Volvo', modelo: 'FH16' };
      const diff = calcularDiff(null, nuevo);

      assert.equal(diff.valor_anterior, null);
      assert.equal(diff.cambiosDetectados, true);
      assert.deepEqual(JSON.parse(diff.valor_nuevo), nuevo);
      assert.deepEqual(diff.clavesModificadas, ['matricula', 'marca', 'modelo']);
    });

    it('DELETE: valor_anterior contiene el estado eliminado y valor_nuevo es null', () => {
      const anterior = { matricula: '1234BBB', estado: 'inactivo' };
      const diff = calcularDiff(anterior, null);

      assert.equal(diff.valor_nuevo, null);
      assert.equal(diff.cambiosDetectados, true);
      assert.deepEqual(JSON.parse(diff.valor_anterior), anterior);
    });

    it('UPDATE: aísla únicamente los campos que han cambiado de valor', () => {
      const anterior = { id: 10, nombre: 'Empresa A', telefono: '911111111', ciudad: 'Madrid' };
      const nuevo = { id: 10, nombre: 'Empresa A Corp', telefono: '911111111', ciudad: 'Toledo' };

      const diff = calcularDiff(anterior, nuevo);

      assert.equal(diff.cambiosDetectados, true);
      assert.deepEqual(diff.clavesModificadas.sort(), ['ciudad', 'nombre']);

      const diffAnt = JSON.parse(diff.valor_anterior);
      const diffNvo = JSON.parse(diff.valor_nuevo);

      assert.deepEqual(diffAnt, { nombre: 'Empresa A', ciudad: 'Madrid' });
      assert.deepEqual(diffNvo, { nombre: 'Empresa A Corp', ciudad: 'Toledo' });
      assert.equal(diffAnt.telefono, undefined);
      assert.equal(diffNvo.telefono, undefined);
    });

    it('UPDATE sin modificaciones reales: no detecta cambios', () => {
      const anterior = { clave: 'valor', config: { a: 1 } };
      const nuevo = { clave: 'valor', config: { a: 1 } };

      const diff = calcularDiff(anterior, nuevo);
      assert.equal(diff.cambiosDetectados, false);
      assert.equal(diff.valor_anterior, null);
      assert.equal(diff.valor_nuevo, null);
      assert.equal(diff.clavesModificadas.length, 0);
    });

    it('Sanitización: redacta automáticamente campos sensibles (password, hash, salt, token)', () => {
      const anterior = { username: 'carlos', password_hash: 'hash_secreto', salt: 'salt_123' };
      const nuevo = { username: 'carlos', password_hash: 'nuevo_hash', salt: 'nuevo_salt' };

      const diff = calcularDiff(anterior, nuevo);
      const diffAnt = JSON.parse(diff.valor_anterior);
      const diffNvo = JSON.parse(diff.valor_nuevo);

      assert.equal(diffAnt.password_hash, '[REDACTADO]');
      assert.equal(diffAnt.salt, '[REDACTADO]');
      assert.equal(diffNvo.password_hash, '[REDACTADO]');
      assert.equal(diffNvo.salt, '[REDACTADO]');
    });
  });

  describe('Integración con InterceptorAuditoria en SQLite real', () => {
    let db;

    beforeEach(() => {
      db = new DatabaseSync(':memory:');
      const schemaPath = resolve(process.cwd(), 'sql/schema.sql');
      const schemaSql = readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql);
      // Sembrar usuario id_usuario = 1 para respetar la clave foránea en log_auditoria
      db.exec(`
        INSERT INTO usuario (id_usuario, username, password_hash, salt, nombre, rol, activo)
        VALUES (1, 'admin', 'hash', 'salt', 'Admin', 'ROL_ADMIN', 1);
      `);
    });

    it('prepararEventoAuditoria estructura un evento completo listo para log_auditoria', () => {
      const sesion = { id_usuario: 5, username: 'admin1', rol: 'ROL_ADMIN', origen_sesion: 'vps_sync' };
      const evento = prepararEventoAuditoria({
        accion: 'UPDATE',
        entidad: 'organizacion',
        id_registro: 1,
        anterior: { razon_social: 'Transportes SA' },
        nuevo: { razon_social: 'Transportes Global SA' },
        sesion
      });

      assert.equal(evento.id_usuario, 5);
      assert.equal(evento.username, 'admin1');
      assert.equal(evento.rol_ejecutor, 'ROL_ADMIN');
      assert.equal(evento.accion, 'UPDATE');
      assert.equal(evento.entidad, 'organizacion');
      assert.equal(evento.id_registro, '1');
      assert.equal(evento.origen_sesion, 'vps_sync');
      assert.ok(esTimestampUTCValido(evento.timestamp_utc));
      assert.deepEqual(JSON.parse(evento.valor_anterior), { razon_social: 'Transportes SA' });
      assert.deepEqual(JSON.parse(evento.valor_nuevo), { razon_social: 'Transportes Global SA' });
    });

    it('InterceptorAuditoria.registrarMutacion persiste diff JSON en la tabla log_auditoria', async () => {
      const sesion = { id_usuario: 1, username: 'admin', rol: 'ROL_ADMIN', origen_sesion: 'local_pwa' };
      const registro = await InterceptorAuditoria.registrarMutacion(
        db,
        {
          accion: 'UPDATE',
          entidad: 'vehiculo',
          id_registro: 42,
          anterior: { estado: 'disponible', km: 100000 },
          nuevo: { estado: 'en_ruta', km: 100250 }
        },
        sesion
      );

      assert.ok(registro);

      const filas = db.prepare('SELECT * FROM log_auditoria WHERE id_registro = ?;').all('42');
      assert.equal(filas.length, 1);
      const row = filas[0];

      assert.equal(row.username, 'admin');
      assert.equal(row.rol_ejecutor, 'ROL_ADMIN');
      assert.equal(row.entidad, 'vehiculo');
      assert.equal(row.accion, 'UPDATE');
      assert.equal(row.origen_sesion, 'local_pwa');
      assert.ok(row.timestamp_utc.endsWith('Z'));

      const diffAnt = JSON.parse(row.valor_anterior);
      const diffNvo = JSON.parse(row.valor_nuevo);
      assert.equal(diffAnt.estado, 'disponible');
      assert.equal(diffAnt.km, 100000);
      assert.equal(diffNvo.estado, 'en_ruta');
      assert.equal(diffNvo.km, 100250);
    });
  });
});
