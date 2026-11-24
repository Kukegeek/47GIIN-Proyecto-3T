import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  crearOrganizacion,
  obtenerOrganizacionPorId,
  crearOrganizacionAuditada,
  actualizarOrganizacionAuditada,
  restablecerParametrosOpcionalesAuditado,
  asignarLogotipoAuditado,
  verificarAdminOrganizacion
} from '../../src/organizacion/organizacion.js';
import { verificarAutorizacionSQL, ForbiddenError, UnauthorizedError } from '../../src/auth/guardias.js';
import { inicializarMatrizPermisos } from '../../src/auth/permisos.js';

describe('TTTRUCKS-34 Subtarea TTTRUCKS-37 - Restricción Exclusiva ROL_ADMIN y Trazabilidad en log_auditoria', () => {
  let db;
  const sesionAdmin = { id_usuario: 1, username: 'admin', rol: 'ROL_ADMIN', origen_sesion: 'local_pwa' };
  const sesionConductor = { id_usuario: 2, username: 'conductor1', rol: 'ROL_CONDUCTOR', origen_sesion: 'app_movil' };

  beforeEach(async () => {
    db = new DatabaseSync(':memory:');
    const schemaPath = resolve(process.cwd(), 'sql/schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);

    // Sembrar usuarios en la tabla usuario para satisfacer claves foráneas en log_auditoria
    db.exec(`
      INSERT INTO usuario (id_usuario, username, password_hash, salt, nombre, rol, activo)
      VALUES (1, 'admin', 'h1', 's1', 'Admin Principal', 'ROL_ADMIN', 1),
             (2, 'conductor1', 'h2', 's2', 'Conductor Operativo', 'ROL_CONDUCTOR', 1);
    `);

    // Inicializar matriz RBAC (Admin total, Conductor sin permiso de escritura en organizacion)
    await inicializarMatrizPermisos(db);
  });

  describe('Guardia RBAC: verificación de ROL_ADMIN', () => {
    it('verificarAdminOrganizacion permite el paso a usuarios con ROL_ADMIN', () => {
      assert.equal(verificarAdminOrganizacion(sesionAdmin), true);
    });

    it('verificarAdminOrganizacion bloquea con 403 Forbidden a ROL_CONDUCTOR', () => {
      assert.throws(
        () => verificarAdminOrganizacion(sesionConductor),
        (err) => err instanceof ForbiddenError && err.status === 403 && /ROL_ADMIN/.test(err.message)
      );
    });

    it('verificarAdminOrganizacion bloquea con 401 Unauthorized si no hay sesión activa', () => {
      assert.throws(
        () => verificarAdminOrganizacion(null),
        (err) => err instanceof UnauthorizedError && err.status === 401
      );
    });

    it('verificarAutorizacionSQL en la capa de persistencia bloquea intentos directos de ROL_CONDUCTOR', async () => {
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, "UPDATE organizacion SET razon_social = 'Hacked';"),
        (err) => err instanceof ForbiddenError && err.status === 403 && /restringida exclusivamente al rol ROL_ADMIN/.test(err.message)
      );
    });
  });

  describe('Criterio de Aceptación BDD: Formulario corporativo por ROL_ADMIN con persistencia y auditoría', () => {
    it('Cuando ROL_ADMIN registra la organización, persiste y genera auditoría INSERT síncrona', async () => {
      const nueva = await crearOrganizacionAuditada(db, sesionAdmin, {
        cif: 'B12345678',
        razon_social: 'TransTrucks Ibérica SL',
        direccion: 'Polígono Transportes 10',
        ciudad: 'Murcia'
      });

      assert.ok(nueva.id_organizacion > 0);
      assert.equal(nueva.razon_social, 'TransTrucks Ibérica SL');

      // Verificación en log_auditoria
      const logs = db.prepare('SELECT * FROM log_auditoria WHERE entidad = ? AND accion = ?;').all('organizacion', 'INSERT');
      assert.equal(logs.length, 1);
      assert.equal(logs[0].id_usuario, 1);
      assert.equal(logs[0].username, 'admin');
      assert.equal(logs[0].rol_ejecutor, 'ROL_ADMIN');
      assert.equal(logs[0].id_registro, String(nueva.id_organizacion));
      assert.equal(logs[0].valor_anterior, null);

      const diffNuevo = JSON.parse(logs[0].valor_nuevo);
      assert.equal(diffNuevo.cif, 'B12345678');
      assert.equal(diffNuevo.razon_social, 'TransTrucks Ibérica SL');
      assert.ok(logs[0].timestamp_utc.endsWith('Z'));
    });

    it('Cuando ROL_ADMIN actualiza CIF, razón social y logotipo, se genera registro de auditoría con diff JSON', async () => {
      // Alta previa
      await crearOrganizacion(db, {
        cif: 'B12345678',
        razon_social: 'TransTrucks SL',
        logo_url: '/img/logo_antiguo.png'
      });

      // Actualización auditada por ROL_ADMIN
      const actualizada = await actualizarOrganizacionAuditada(db, sesionAdmin, 1, {
        cif: 'B87654321',
        razon_social: 'TransTrucks Global SA',
        logo_url: '/img/logo_nuevo.svg'
      });

      assert.equal(actualizada.cif, 'B87654321');
      assert.equal(actualizada.razon_social, 'TransTrucks Global SA');
      assert.equal(actualizada.logo_url, '/img/logo_nuevo.svg');

      // Comprobar trazabilidad en log_auditoria
      const logs = db.prepare('SELECT * FROM log_auditoria WHERE entidad = ? AND accion = ?;').all('organizacion', 'UPDATE');
      assert.equal(logs.length, 1);
      assert.equal(logs[0].id_usuario, 1);
      assert.equal(logs[0].rol_ejecutor, 'ROL_ADMIN');
      assert.equal(logs[0].id_registro, '1');

      const ant = JSON.parse(logs[0].valor_anterior);
      const nvo = JSON.parse(logs[0].valor_nuevo);

      assert.deepEqual(ant, {
        cif: 'B12345678',
        razon_social: 'TransTrucks SL',
        logo_url: '/img/logo_antiguo.png'
      });

      assert.deepEqual(nvo, {
        cif: 'B87654321',
        razon_social: 'TransTrucks Global SA',
        logo_url: '/img/logo_nuevo.svg'
      });
    });
  });

  describe('Operaciones auditadas adicionales: logotipo y restablecimiento de opcionales', () => {
    beforeEach(async () => {
      await crearOrganizacion(db, {
        cif: 'B12345678',
        razon_social: 'TransTrucks SL',
        direccion: 'Calle Test 123',
        telefono: '968111222',
        logo_url: '/img/logo_inicial.png'
      });
    });

    it('asignarLogotipoAuditado valida permisos de ROL_ADMIN, formato y registra auditoría', async () => {
      const res = await asignarLogotipoAuditado(db, sesionAdmin, 1, '/assets/nuevo_logo.webp');
      assert.equal(res.logo_url, '/assets/nuevo_logo.webp');

      const logs = db.prepare('SELECT * FROM log_auditoria WHERE entidad = ? AND accion = ?;').all('organizacion', 'UPDATE');
      assert.equal(logs.length, 1);
      assert.equal(JSON.parse(logs[0].valor_nuevo).logo_url, '/assets/nuevo_logo.webp');
    });

    it('restablecerParametrosOpcionalesAuditado genera registro con el diff de limpieza', async () => {
      const restablecida = await restablecerParametrosOpcionalesAuditado(db, sesionAdmin, 1);
      assert.equal(restablecida.telefono, null);
      assert.equal(restablecida.logo_url, null);

      const logs = db.prepare('SELECT * FROM log_auditoria WHERE entidad = ? AND accion = ?;').all('organizacion', 'UPDATE');
      assert.equal(logs.length, 1);
      const diffAnt = JSON.parse(logs[0].valor_anterior);
      const diffNvo = JSON.parse(logs[0].valor_nuevo);

      assert.equal(diffAnt.telefono, '968111222');
      assert.equal(diffNvo.telefono, null);
    });

    it('Rechaza operaciones auditadas si son invocadas por ROL_CONDUCTOR', async () => {
      await assert.rejects(
        async () => actualizarOrganizacionAuditada(db, sesionConductor, 1, { razon_social: 'Fraude' }),
        /403 Forbidden/
      );

      await assert.rejects(
        async () => asignarLogotipoAuditado(db, sesionConductor, 1, '/img/logo.png'),
        /403 Forbidden/
      );

      await assert.rejects(
        async () => restablecerParametrosOpcionalesAuditado(db, sesionConductor, 1),
        /403 Forbidden/
      );

      // Comprobar que ningún log fue insertado por el conductor
      const logsConductor = db.prepare('SELECT count(*) as total FROM log_auditoria WHERE username = ?;').get('conductor1');
      assert.equal(logsConductor.total, 0);
    });
  });
});
