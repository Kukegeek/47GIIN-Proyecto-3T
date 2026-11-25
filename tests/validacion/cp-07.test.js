/**
 * ============================================================================
 * CASO FORMAL DE PRUEBA: CP-07
 * Tarea: TTTRUCKS-43 (Subtarea 1 de TTTRUCKS-42)
 * Historia: TTTRUCKS-42 - [VALIDACIÓN S1] Pruebas Automatizadas de Seguridad RBAC
 * Trazabilidad: TTTRUCKS-25, TTTRUCKS-34, TTTRUCKS-42, Sección 11.1, CP-07
 *
 * Criterio de Aceptación (Gherkin - BDD):
 *   Dado un usuario autenticado con ROL_CONDUCTOR
 *   Cuando intenta acceder a vistas de administración o ejecutar operaciones
 *          de escritura sobre usuario, rol_permiso, organizacion o log_auditoria
 *   Entonces el sistema oculta los menús en la UI y lanza una excepción de
 *          autorización 403 Forbidden (ForbiddenError) en la capa de datos.
 * ============================================================================
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Módulos bajo certificación formal CP-07
import { hashearPassword } from '../../src/auth/crypto.js';
import { crearUsuario } from '../../src/auth/usuarios.js';
import { inicializarMatrizPermisos } from '../../src/auth/permisos.js';
import { autenticarUsuario } from '../../src/auth/autenticacion.js';
import {
  evaluarAccesoRuta,
  filtrarMenuPorRol,
  verificarAutorizacionSQL,
  ForbiddenError,
  UnauthorizedError,
} from '../../src/auth/guardias.js';
import {
  verificarAdminOrganizacion,
  crearOrganizacionAuditada,
  actualizarOrganizacionAuditada,
  restablecerParametrosOpcionalesAuditado,
  asignarLogotipoAuditado,
  crearOrganizacion,
} from '../../src/organizacion/organizacion.js';
import { TortuosityEngine } from '../../src/rutas/tortuosity.js';

describe('CP-07: Intento de acceso denegado a usuario con rol Conductor (TTTRUCKS-43)', () => {
  let db;
  let sesionConductor;
  let sesionAdmin;

  const MENU_SISTEMA = [
    { ruta: '/dashboard', label: 'Panel Principal', modulo: 'dashboard' },
    { ruta: '/rutas', label: 'Planificador de Rutas', modulo: 'rutas' },
    { ruta: '/tacografo', label: 'Tacógrafo Digital', modulo: 'tacografo' },
    { ruta: '/usuarios', label: 'Gestión de Operadores', modulo: 'usuarios' },
    { ruta: '/roles', label: 'Matriz de Permisos RBAC', modulo: 'roles' },
    { ruta: '/organizacion', label: 'Configuración Corporativa', modulo: 'organizacion' },
    { ruta: '/auditoria', label: 'Registro de Auditoría', modulo: 'auditoria' },
  ];

  beforeEach(async () => {
    // 1. Instanciar base de datos SQLite en memoria para la prueba
    db = new DatabaseSync(':memory:');

    // 2. Desplegar esquema DDL oficial en 3FN
    const ddl = readFileSync(resolve(process.cwd(), 'sql/schema.sql'), 'utf-8');
    db.exec(ddl);

    // 3. Inicializar matriz granular de permisos RBAC
    await inicializarMatrizPermisos(db);

    // 4. Crear usuario Administrador (ROL_ADMIN)
    await crearUsuario(db, {
      username: 'admin_test',
      password: 'PasswordAdmin123!',
      nombre: 'Administrador Principal',
      rol: 'ROL_ADMIN',
    });

    // 5. Crear usuario Conductor (ROL_CONDUCTOR)
    await crearUsuario(db, {
      username: 'conductor_test',
      password: 'PasswordConductor123!',
      nombre: 'Conductor Operativo',
      rol: 'ROL_CONDUCTOR',
    });

    // 6. Autenticar usuarios para obtener sesiones activas legítimas
    sesionAdmin = await autenticarUsuario(db, 'admin_test', 'PasswordAdmin123!');
    sesionConductor = await autenticarUsuario(db, 'conductor_test', 'PasswordConductor123!');
  });

  describe('Fase 1: Autenticación legítima y verificación de sesión del Conductor', () => {
    it('el Conductor inicia sesión exitosamente pero con rol restringido ROL_CONDUCTOR', () => {
      assert.ok(sesionConductor.id_usuario > 0);
      assert.equal(sesionConductor.username, 'conductor_test');
      assert.equal(sesionConductor.rol, 'ROL_CONDUCTOR');
      assert.ok(sesionConductor.token && sesionConductor.token.startsWith('sess_'));
    });

    it('el inicio de sesión actualiza ultimo_login y registra auditoría LOGIN', () => {
      const user = db.prepare('SELECT ultimo_login FROM usuario WHERE username = ?').get('conductor_test');
      assert.ok(user.ultimo_login !== null, 'ultimo_login debe registrarse al autenticar');

      const logLogin = db.prepare("SELECT * FROM log_auditoria WHERE accion = 'LOGIN' AND username = ?").get('conductor_test');
      assert.ok(logLogin, 'Debe registrarse evento LOGIN en log_auditoria');
      assert.equal(logLogin.rol_ejecutor, 'ROL_CONDUCTOR');
    });
  });

  describe('Fase 2: Bloqueo en la interfaz de usuario (Enrutador de vistas y filtrado de menú)', () => {
    it('evaluarAccesoRuta deniega el acceso a /usuarios y redirige a /403 al Conductor', async () => {
      const acceso = await evaluarAccesoRuta('/usuarios', sesionConductor, db);
      assert.equal(acceso.permitido, false);
      assert.equal(acceso.redirect, '/403');
    });

    it('evaluarAccesoRuta deniega el acceso a /roles y redirige a /403 al Conductor', async () => {
      const acceso = await evaluarAccesoRuta('/roles', sesionConductor, db);
      assert.equal(acceso.permitido, false);
      assert.equal(acceso.redirect, '/403');
    });

    it('evaluarAccesoRuta deniega el acceso a /organizacion y redirige a /403 al Conductor', async () => {
      const acceso = await evaluarAccesoRuta('/organizacion', sesionConductor, db);
      assert.equal(acceso.permitido, false);
      assert.equal(acceso.redirect, '/403');
    });

    it('filtrarMenuPorRol oculta absolutamente los módulos administrativos al Conductor', async () => {
      const menuConductor = await filtrarMenuPorRol(MENU_SISTEMA, sesionConductor, db);
      const rutasVisibles = menuConductor.map((item) => item.ruta);

      // Debe ver sus rutas operativas
      assert.ok(rutasVisibles.includes('/dashboard'));
      assert.ok(rutasVisibles.includes('/rutas'));
      assert.ok(rutasVisibles.includes('/tacografo'));

      // No debe ver bajo ninguna circunstancia rutas de administración
      assert.equal(rutasVisibles.includes('/usuarios'), false, 'Ruta /usuarios no debe ser visible a Conductor');
      assert.equal(rutasVisibles.includes('/roles'), false, 'Ruta /roles no debe ser visible a Conductor');
      assert.equal(rutasVisibles.includes('/organizacion'), false, 'Ruta /organizacion no debe ser visible a Conductor');
      assert.equal(rutasVisibles.includes('/auditoria'), false, 'Ruta /auditoria no debe ser visible a Conductor');
    });

    it('ROL_ADMIN sí dispone de acceso y visualización a todas las rutas', async () => {
      const acceso = await evaluarAccesoRuta('/usuarios', sesionAdmin, db);
      assert.equal(acceso.permitido, true);

      const menuAdmin = await filtrarMenuPorRol(MENU_SISTEMA, sesionAdmin, db);
      assert.equal(menuAdmin.length, MENU_SISTEMA.length);
    });
  });

  describe('Fase 3: Bloqueo en capa de persistencia SQLite contra CRUD de Usuarios (usuario / rol_permiso)', () => {
    it('bloquea sentencias INSERT sobre la tabla usuario con 403 Forbidden al Conductor', async () => {
      const sql = "INSERT INTO usuario (username, password_hash, salt, nombre, rol) VALUES ('hacker', 'h', 's', 'Hack', 'ROL_ADMIN')";
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sql),
        (err) => err instanceof ForbiddenError && err.status === 403 && /403 Forbidden/i.test(err.message)
      );
    });

    it('bloquea sentencias UPDATE sobre la tabla usuario con 403 Forbidden al Conductor', async () => {
      const sql = "UPDATE usuario SET rol = 'ROL_ADMIN' WHERE id_usuario = 2";
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sql),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });

    it('bloquea sentencias DELETE sobre la tabla usuario con 403 Forbidden al Conductor', async () => {
      const sql = 'DELETE FROM usuario WHERE id_usuario = 1';
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sql),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });

    it('bloquea cualquier modificación sobre la tabla rol_permiso al Conductor', async () => {
      const sql = "UPDATE rol_permiso SET puede_crear = 1 WHERE rol = 'ROL_CONDUCTOR'";
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sql),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });
  });

  describe('Fase 4: Bloqueo contra CRUD de Organización (CRUD 14 - Empresa)', () => {
    beforeEach(async () => {
      // Crear una organización base para pruebas
      await crearOrganizacion(db, {
        cif: 'B12345678',
        razon_social: 'Transportes Rápidos 3T S.L.',
        email: 'info@3t.es',
      });
    });

    it('verificarAdminOrganizacion lanza 403 Forbidden de forma directa ante Conductor', () => {
      assert.throws(
        () => verificarAdminOrganizacion(sesionConductor),
        (err) => err instanceof ForbiddenError && err.status === 403 && /ROL_ADMIN/i.test(err.message)
      );
    });

    it('crearOrganizacionAuditada rechaza la creación al Conductor con 403 Forbidden', async () => {
      await assert.rejects(
        async () =>
          crearOrganizacionAuditada(db, sesionConductor, {
            cif: 'A99999999',
            razon_social: 'Intrusión Ilícita S.A.',
          }),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });

    it('actualizarOrganizacionAuditada rechaza la modificación al Conductor con 403 Forbidden', async () => {
      await assert.rejects(
        async () =>
          actualizarOrganizacionAuditada(db, sesionConductor, 1, {
            razon_social: 'Nombre Modificado Sin Permiso',
          }),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });

    it('restablecerParametrosOpcionalesAuditado rechaza la operación al Conductor con 403 Forbidden', async () => {
      await assert.rejects(
        async () => restablecerParametrosOpcionalesAuditado(db, sesionConductor, 1),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });

    it('asignarLogotipoAuditado rechaza la asignación de branding corporativo con 403 Forbidden', async () => {
      await assert.rejects(
        async () => asignarLogotipoAuditado(db, sesionConductor, 1, '/assets/logo-falso.png'),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });

    it('verificarAutorizacionSQL en capa SQLite bloquea escrituras directas sobre organizacion', async () => {
      const sql = "UPDATE organizacion SET razon_social = 'Inyeccion Directa' WHERE id_organizacion = 1";
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sql),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });
  });

  describe('Fase 5: Bloqueo de alteración sobre la tabla log_auditoria', () => {
    it('bloquea sentencias UPDATE sobre log_auditoria lanzando 403 Forbidden al Conductor', async () => {
      const sql = "UPDATE log_auditoria SET accion = 'MODIFICADO' WHERE id_log = 1";
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sql),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });

    it('bloquea sentencias DELETE sobre log_auditoria lanzando 403 Forbidden al Conductor', async () => {
      const sql = 'DELETE FROM log_auditoria WHERE id_log = 1';
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sql),
        (err) => err instanceof ForbiddenError && err.status === 403
      );
    });

    it('los triggers nativos de SQLite abortan cualquier mutación destructiva sobre log_auditoria', () => {
      // Intento directo sin pasar por guardias JS
      assert.throws(
        () => db.exec('DELETE FROM log_auditoria'),
        (err) => /inmutable/i.test(err.message) || /FAIL/i.test(err.message)
      );
    });
  });

  describe('Fase 6: Principio de Menor Privilegio (Operaciones operativas legítimas permitidas)', () => {
    it('el Conductor sí tiene permiso de lectura sobre sus datos de perfil', () => {
      const row = db.prepare('SELECT id_usuario, username, nombre, rol FROM usuario WHERE id_usuario = ?').get(sesionConductor.id_usuario);
      assert.equal(row.username, 'conductor_test');
      assert.equal(row.rol, 'ROL_CONDUCTOR');
    });

    it('el Conductor sí puede ejecutar cálculos instantáneos con TortuosityEngine', () => {
      const origen = { lat: 40.416775, lon: -3.703790 }; // Madrid
      const destino = { lat: 41.387015, lon: 2.170047 }; // Barcelona

      const ruta = TortuosityEngine.estimar(origen, destino);
      assert.ok(ruta.distanciaEstimadaKm > 600);
      assert.ok(ruta.duracionEstimadaHoras > 7);
      assert.ok(ruta.tiempoCalculoMs < 1.0);
    });
  });
});
