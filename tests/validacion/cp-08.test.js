/**
 * ============================================================================
 * CASO FORMAL DE PRUEBA: CP-08
 * Tarea: TTTRUCKS-44 (Subtarea 2 de TTTRUCKS-42)
 * Historia: TTTRUCKS-42 - [VALIDACIÓN S1] Pruebas Automatizadas de Seguridad RBAC
 * Trazabilidad: TTTRUCKS-30, TTTRUCKS-42, Sección 11.2, CP-08
 *
 * Criterio de Aceptación (Gherkin - BDD):
 *   Dado un entorno transaccional con tabla log_auditoria configurada
 *   Cuando se ejecutan operaciones de alta, modificación, baja o inicio de sesión
 *   Entonces se generan registros síncronos append-only con diff JSON, hora UTC
 *          y campos sensibles redactados, impidiendo cualquier intento de UPDATE
 *          o DELETE mediante triggers nativos y excepciones 403 Forbidden.
 * ============================================================================
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Módulos bajo certificación formal CP-08
import {
  generarTimestampUTC,
  esTimestampUTCValido,
  resolverOrigenSesion,
  calcularDiff,
  CAMPOS_SENSIBLES,
} from '../../src/audit/diff.js';
import {
  SQL_TRIGGERS_INMUTABILIDAD,
  activarInmutabilidad,
  validarInmutabilidad,
} from '../../src/audit/inmutabilidad.js';
import {
  InterceptorAuditoria,
  normalizarEvento,
  ACCIONES_VALIDAS,
} from '../../src/audit/interceptor.js';
import {
  verificarAutorizacionSQL,
  ForbiddenError,
  UnauthorizedError,
} from '../../src/auth/guardias.js';
import { crearUsuario } from '../../src/auth/usuarios.js';
import { autenticarUsuario } from '../../src/auth/autenticacion.js';
import { inicializarMatrizPermisos } from '../../src/auth/permisos.js';
import {
  crearOrganizacionAuditada,
  actualizarOrganizacionAuditada,
} from '../../src/organizacion/organizacion.js';

describe('CP-08: Inmutabilidad de log_auditoria y generación síncrona con diff JSON y hora UTC (TTTRUCKS-44)', () => {
  let db;
  let sesionAdmin;
  let sesionConductor;

  beforeEach(async () => {
    // 1. Instanciar base de datos SQLite en memoria
    db = new DatabaseSync(':memory:');

    // 2. Cargar esquema oficial DDL en 3FN con triggers de inmutabilidad
    const ddl = readFileSync(resolve(process.cwd(), 'sql/schema.sql'), 'utf-8');
    db.exec(ddl);

    // 3. Inicializar matriz granular de permisos RBAC
    await inicializarMatrizPermisos(db);

    // 4. Crear usuarios de prueba con roles asignados
    await crearUsuario(db, {
      username: 'auditor_admin',
      password: 'AdminPassword123!',
      nombre: 'Administrador Auditor',
      rol: 'ROL_ADMIN',
    });

    await crearUsuario(db, {
      username: 'chofer_ruta',
      password: 'ChoferPassword123!',
      nombre: 'Conductor de Ruta',
      rol: 'ROL_CONDUCTOR',
    });

    // 5. Autenticar usuarios para generar sesiones activas
    sesionAdmin = await autenticarUsuario(db, 'auditor_admin', 'AdminPassword123!', {
      origen_sesion: 'local_pwa',
    });
    sesionConductor = await autenticarUsuario(db, 'chofer_ruta', 'ChoferPassword123!', {
      origen_sesion: 'movil_conductor',
    });
  });

  describe('Fase 1: Generación síncrona de eventos append-only (LOGIN, INSERT, UPDATE, DELETE)', () => {
    it('el inicio de sesión genera inmediatamente un evento síncrono LOGIN en log_auditoria', () => {
      const logs = db
        .prepare('SELECT * FROM log_auditoria WHERE accion = ? ORDER BY id_log DESC;')
        .all('LOGIN');

      assert.ok(logs.length >= 2, 'Deben existir al menos 2 eventos de login registrados');
      const ultimoLogin = logs[0];

      assert.equal(ultimoLogin.accion, 'LOGIN');
      assert.equal(ultimoLogin.entidad, 'usuario');
      assert.equal(ultimoLogin.username, 'chofer_ruta');
      assert.equal(ultimoLogin.rol_ejecutor, 'ROL_CONDUCTOR');
      assert.equal(ultimoLogin.origen_sesion, 'movil_conductor');
      assert.ok(ultimoLogin.timestamp_utc.endsWith('Z'));

      const valorNuevo = JSON.parse(ultimoLogin.valor_nuevo);
      assert.equal(valorNuevo.login_exitoso, true);
    });

    it('la creación auditada de entidad genera un evento INSERT con valor_anterior nulo y valor_nuevo completo', async () => {
      const org = await crearOrganizacionAuditada(db, sesionAdmin, {
        cif: 'B99887766',
        razon_social: 'Logística TransMediterránea S.L.',
        direccion: 'Av. del Transporte 42',
        ciudad: 'Valencia',
      });

      const logInsert = db
        .prepare('SELECT * FROM log_auditoria WHERE entidad = ? AND accion = ? AND id_registro = ?;')
        .get('organizacion', 'INSERT', String(org.id_organizacion));

      assert.ok(logInsert, 'Debe existir un registro de auditoría para la creación');
      assert.equal(logInsert.id_usuario, sesionAdmin.id_usuario);
      assert.equal(logInsert.username, sesionAdmin.username);
      assert.equal(logInsert.rol_ejecutor, 'ROL_ADMIN');
      assert.equal(logInsert.valor_anterior, null);

      const nuevoParsed = JSON.parse(logInsert.valor_nuevo);
      assert.equal(nuevoParsed.cif, 'B99887766');
      assert.equal(nuevoParsed.razon_social, 'Logística TransMediterránea S.L.');
      assert.equal(nuevoParsed.ciudad, 'Valencia');
    });

    it('la actualización auditada de entidad genera un evento UPDATE con delta exacto en diff JSON', async () => {
      // 1. Crear organización inicial
      const org = await crearOrganizacionAuditada(db, sesionAdmin, {
        cif: 'A11223344',
        razon_social: 'Flotas del Norte S.A.',
        ciudad: 'Bilbao',
      });

      // 2. Modificar razón social y ciudad
      await actualizarOrganizacionAuditada(
        db,
        sesionAdmin,
        org.id_organizacion,
        {
          razon_social: 'Flotas del Norte Holding S.A.',
          ciudad: 'Santander',
        }
      );

      const logUpdate = db
        .prepare('SELECT * FROM log_auditoria WHERE entidad = ? AND accion = ? AND id_registro = ?;')
        .get('organizacion', 'UPDATE', String(org.id_organizacion));

      assert.ok(logUpdate, 'Debe existir el registro de auditoría de UPDATE');
      assert.equal(logUpdate.id_usuario, sesionAdmin.id_usuario);
      assert.equal(logUpdate.username, 'auditor_admin');

      const antDiff = JSON.parse(logUpdate.valor_anterior);
      const nvoDiff = JSON.parse(logUpdate.valor_nuevo);

      assert.equal(antDiff.razon_social, 'Flotas del Norte S.A.');
      assert.equal(nvoDiff.razon_social, 'Flotas del Norte Holding S.A.');
      assert.equal(antDiff.ciudad, 'Bilbao');
      assert.equal(nvoDiff.ciudad, 'Santander');
    });

    it('el borrado auditado genera un evento DELETE con valor_anterior poblado y valor_nuevo nulo', async () => {
      const registroPrevio = {
        id_vehiculo: 101,
        matricula: '5678XYZ',
        marca: 'Scania',
        modelo: 'R500',
      };

      await InterceptorAuditoria.registrarMutacion(
        db,
        {
          entidad: 'vehiculo',
          id_registro: 101,
          accion: 'DELETE',
          anterior: registroPrevio,
          nuevo: null,
          origen_sesion: 'local_pwa',
        },
        sesionAdmin
      );

      const logDelete = db
        .prepare('SELECT * FROM log_auditoria WHERE entidad = ? AND accion = ? AND id_registro = ?;')
        .get('vehiculo', 'DELETE', '101');

      assert.ok(logDelete, 'Debe existir el registro de DELETE');
      assert.equal(logDelete.valor_nuevo, null);
      assert.deepEqual(JSON.parse(logDelete.valor_anterior), registroPrevio);
    });
  });

  describe('Fase 2: Motor de diff JSON y sanitización automática de credenciales sensibles', () => {
    it('CAMPOS_SENSIBLES incluye password, password_hash, salt y token', () => {
      assert.ok(CAMPOS_SENSIBLES.includes('password'));
      assert.ok(CAMPOS_SENSIBLES.includes('password_hash'));
      assert.ok(CAMPOS_SENSIBLES.includes('salt'));
      assert.ok(CAMPOS_SENSIBLES.includes('token'));
    });

    it('calcularDiff redacta campos sensibles como [REDACTADO] en altas (INSERT)', () => {
      const nuevoUsuario = {
        username: 'nuevo_user',
        password_hash: 'super_secret_hash_value',
        salt: 'random_salt_123',
        token: 'jwt_or_session_token_xyz',
        nombre: 'Nuevo Usuario',
      };

      const diff = calcularDiff(null, nuevoUsuario);
      assert.equal(diff.valor_anterior, null);
      assert.ok(diff.valor_nuevo);

      const parsed = JSON.parse(diff.valor_nuevo);
      assert.equal(parsed.password_hash, '[REDACTADO]');
      assert.equal(parsed.salt, '[REDACTADO]');
      assert.equal(parsed.token, '[REDACTADO]');
      assert.equal(parsed.nombre, 'Nuevo Usuario');
      assert.equal(parsed.username, 'nuevo_user');
    });

    it('calcularDiff redacta campos sensibles en modificaciones (UPDATE)', () => {
      const anterior = {
        id: 5,
        username: 'user5',
        password_hash: 'antiguo_hash',
        salt: 'antiguo_salt',
        email: 'user5@old.com',
      };
      const nuevo = {
        id: 5,
        username: 'user5',
        password_hash: 'nuevo_hash_actualizado',
        salt: 'nuevo_salt_renovado',
        email: 'user5@new.com',
      };

      const diff = calcularDiff(anterior, nuevo);
      assert.equal(diff.cambiosDetectados, true);

      const antParsed = JSON.parse(diff.valor_anterior);
      const nvoParsed = JSON.parse(diff.valor_nuevo);

      assert.equal(antParsed.password_hash, '[REDACTADO]');
      assert.equal(nvoParsed.password_hash, '[REDACTADO]');
      assert.equal(antParsed.salt, '[REDACTADO]');
      assert.equal(nvoParsed.salt, '[REDACTADO]');
      assert.equal(antParsed.email, 'user5@old.com');
      assert.equal(nvoParsed.email, 'user5@new.com');
    });

    it('el log de auditoría persistido nunca almacena contraseñas o hashes en claro', async () => {
      await InterceptorAuditoria.registrarMutacion(
        db,
        {
          entidad: 'usuario',
          id_registro: 99,
          accion: 'UPDATE',
          anterior: { password_hash: 'secret_hash_1', salt: 'salt_1', activo: 1 },
          nuevo: { password_hash: 'secret_hash_2', salt: 'salt_2', activo: 1 },
        },
        sesionAdmin
      );

      const log = db
        .prepare('SELECT * FROM log_auditoria WHERE entidad = ? AND id_registro = ?;')
        .get('usuario', '99');

      assert.ok(log);
      assert.ok(!log.valor_anterior.includes('secret_hash_1'));
      assert.ok(!log.valor_nuevo.includes('secret_hash_2'));
      assert.ok(log.valor_anterior.includes('[REDACTADO]'));
      assert.ok(log.valor_nuevo.includes('[REDACTADO]'));
    });
  });

  describe('Fase 3: Marcas temporales UTC conformes a ISO-8601 estricto y resolución de sesión', () => {
    it('todos los registros de auditoría disponen de timestamp_utc conforme a ISO-8601 (terminado en Z)', () => {
      const logs = db.prepare('SELECT id_log, timestamp_utc FROM log_auditoria;').all();
      assert.ok(logs.length > 0);

      for (const log of logs) {
        assert.ok(
          esTimestampUTCValido(log.timestamp_utc),
          `Timestamp ${log.timestamp_utc} del registro ${log.id_log} no es ISO-8601 UTC válido`
        );
        assert.ok(log.timestamp_utc.endsWith('Z'));
        const date = new Date(log.timestamp_utc);
        assert.ok(!isNaN(date.getTime()));
      }
    });

    it('resolverOrigenSesion infiere correctamente el origen de sesión o aplica fallback local_pwa', () => {
      assert.equal(resolverOrigenSesion({ origen_sesion: 'movil_conductor' }), 'movil_conductor');
      assert.equal(resolverOrigenSesion({ origen_sesion: 'vps_sync' }), 'vps_sync');
      assert.equal(resolverOrigenSesion(null), 'local_pwa');
      assert.equal(resolverOrigenSesion({}), 'local_pwa');
    });
  });

  describe('Fase 4: Inmutabilidad estricta - Bloqueo absoluto de modificaciones (UPDATE)', () => {
    it('Trigger SQLite nativo bloquea cualquier sentencia UPDATE sobre log_auditoria con mensaje 403', () => {
      const primerLog = db.prepare('SELECT id_log, username FROM log_auditoria LIMIT 1;').get();
      assert.ok(primerLog);

      assert.throws(
        () => {
          db.exec(`UPDATE log_auditoria SET username = 'hacker_malicioso' WHERE id_log = ${primerLog.id_log};`);
        },
        /403 Forbidden: La tabla log_auditoria es estrictamente inmutable/
      );

      // Comprobar que el valor original no fue alterado
      const logInalterado = db
        .prepare('SELECT username FROM log_auditoria WHERE id_log = ?;')
        .get(primerLog.id_log);
      assert.equal(logInalterado.username, primerLog.username);
    });

    it('validarInmutabilidad lanza ForbiddenError 403 ante cualquier intento de UPDATE', () => {
      const queriesUpdate = [
        'UPDATE log_auditoria SET accion = "HACK"',
        'update   log_auditoria   set valor_nuevo = null',
        'UPDATE log_auditoria WHERE id_log = 1',
      ];

      for (const query of queriesUpdate) {
        assert.throws(
          () => validarInmutabilidad(query),
          (err) => err instanceof ForbiddenError && err.status === 403 && /estrictamente inmutable/.test(err.message)
        );
      }
    });

    it('verificarAutorizacionSQL en capa de persistencia bloquea UPDATE a administradores y conductores con 403', async () => {
      // Intento por Administrador
      await assert.rejects(
        async () => {
          await verificarAutorizacionSQL(db, sesionAdmin, 'UPDATE log_auditoria SET username = "admin_edit";');
        },
        (err) => err instanceof ForbiddenError && err.status === 403
      );

      // Intento por Conductor
      await assert.rejects(
        async () => {
          await verificarAutorizacionSQL(db, sesionConductor, 'UPDATE log_auditoria SET accion = "CLEAR";');
        },
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });
  });

  describe('Fase 5: Inmutabilidad estricta - Bloqueo absoluto de borrado (DELETE / TRUNCATE)', () => {
    it('Trigger SQLite nativo bloquea cualquier sentencia DELETE individual sobre log_auditoria con mensaje 403', () => {
      const totalAntes = db.prepare('SELECT count(*) as total FROM log_auditoria;').get().total;
      assert.ok(totalAntes > 0);

      assert.throws(
        () => {
          db.exec('DELETE FROM log_auditoria WHERE id_log = 1;');
        },
        /403 Forbidden: La tabla log_auditoria es estrictamente inmutable/
      );

      const totalDespues = db.prepare('SELECT count(*) as total FROM log_auditoria;').get().total;
      assert.equal(totalDespues, totalAntes, 'El número de registros debe permanecer inalterado');
    });

    it('Trigger SQLite nativo bloquea el vaciado masivo (DELETE FROM log_auditoria) con mensaje 403', () => {
      const totalAntes = db.prepare('SELECT count(*) as total FROM log_auditoria;').get().total;

      assert.throws(
        () => {
          db.exec('DELETE FROM log_auditoria;');
        },
        /403 Forbidden: La tabla log_auditoria es estrictamente inmutable/
      );

      const totalDespues = db.prepare('SELECT count(*) as total FROM log_auditoria;').get().total;
      assert.equal(totalDespues, totalAntes);
    });

    it('validarInmutabilidad lanza ForbiddenError 403 ante cualquier intento de DELETE', () => {
      const queriesDelete = [
        'DELETE FROM log_auditoria WHERE id_log = 2',
        'delete   from   log_auditoria',
        'DELETE FROM log_auditoria;',
      ];

      for (const query of queriesDelete) {
        assert.throws(
          () => validarInmutabilidad(query),
          (err) => err instanceof ForbiddenError && err.status === 403 && /estrictamente inmutable/.test(err.message)
        );
      }
    });

    it('verificarAutorizacionSQL en capa de persistencia bloquea DELETE a cualquier usuario con 403', async () => {
      // Conductor intentando borrar su rastro
      await assert.rejects(
        async () => {
          await verificarAutorizacionSQL(db, sesionConductor, 'DELETE FROM log_auditoria WHERE username = "chofer_ruta";');
        },
        (err) => err instanceof ForbiddenError && err.status === 403
      );

      // Administrador intentando depurar auditoría
      await assert.rejects(
        async () => {
          await verificarAutorizacionSQL(db, sesionAdmin, 'DELETE FROM log_auditoria;');
        },
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });
  });

  describe('Fase 6: Certificación de preservación y consulta de la pista de auditoría forense', () => {
    it('las lecturas SELECT sobre log_auditoria son permitidas para ROL_ADMIN', async () => {
      const sqlSelect = 'SELECT * FROM log_auditoria ORDER BY id_log DESC;';
      const autorizada = await verificarAutorizacionSQL(db, sesionAdmin, sqlSelect);
      assert.equal(autorizada, true);

      const logs = db.prepare(sqlSelect).all();
      assert.ok(Array.isArray(logs));
      assert.ok(logs.length >= 2);
    });

    it('los triggers son idempotentes y pueden reactivarse con activarInmutabilidad sin duplicar errores', async () => {
      const activado = await activarInmutabilidad(db);
      assert.equal(activado, true);

      // Sigue bloqueando adecuadamente
      assert.throws(
        () => db.exec('DELETE FROM log_auditoria;'),
        /403 Forbidden/
      );
    });
  });
});
