import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inicializarMatrizPermisos } from '../../src/auth/permisos.js';
import {
  analizarSentenciaSQL,
  verificarAutorizacionSQL,
  crearAdaptadorSqlConGuardia,
  evaluarAccesoRuta,
  filtrarMenuPorRol,
  ForbiddenError,
  UnauthorizedError
} from '../../src/auth/guardias.js';

describe('TTTRUCKS-25 Subtarea TTTRUCKS-29 - Guardias de Autorización RBAC (UI y SQLite)', () => {
  let db;
  const sesionAdmin = { id_usuario: 1, username: 'admin', rol: 'ROL_ADMIN' };
  const sesionConductor = { id_usuario: 2, username: 'conductor1', rol: 'ROL_CONDUCTOR' };

  beforeEach(async () => {
    db = new DatabaseSync(':memory:');
    const schemaPath = resolve(process.cwd(), 'sql/schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
    // Inicializar matriz estándar (Admin total, Conductor restringido)
    await inicializarMatrizPermisos(db);
  });

  describe('Análisis de sentencias SQL', () => {
    it('Detecta operaciones y mapea tablas a módulos correctamente', () => {
      assert.deepEqual(
        analizarSentenciaSQL("INSERT INTO usuario (username) VALUES ('test')"),
        { operacion: 'crear', modulo: 'usuarios', tabla: 'usuario' }
      );

      assert.deepEqual(
        analizarSentenciaSQL("UPDATE rol_permiso SET puede_leer = 1 WHERE id_permiso = 1"),
        { operacion: 'actualizar', modulo: 'roles', tabla: 'rol_permiso' }
      );

      assert.deepEqual(
        analizarSentenciaSQL("DELETE FROM usuario WHERE id_usuario = 5"),
        { operacion: 'eliminar', modulo: 'usuarios', tabla: 'usuario' }
      );

      assert.deepEqual(
        analizarSentenciaSQL("SELECT * FROM hoja_ruta WHERE id_ruta = 1"),
        { operacion: 'leer', modulo: 'rutas', tabla: 'hoja_ruta' }
      );

      assert.equal(analizarSentenciaSQL("PRAGMA foreign_keys = ON;"), null);
    });
  });

  describe('Guardia de persistencia en capa de datos SQLite', () => {
    it('Permite al ROL_ADMIN ejecutar sentencias SQL de escritura sobre usuario y rol_permiso', async () => {
      const sqlUsuario = "INSERT INTO usuario (username, password_hash, salt, nombre) VALUES ('test', 'hash', 'salt', 'Test');";
      const sqlRol = "UPDATE rol_permiso SET puede_crear = 1 WHERE rol = 'ROL_CONDUCTOR';";

      assert.equal(await verificarAutorizacionSQL(db, sesionAdmin, sqlUsuario), true);
      assert.equal(await verificarAutorizacionSQL(db, sesionAdmin, sqlRol), true);
    });

    it('Lanza ForbiddenError (403) cuando ROL_CONDUCTOR intenta escribir sobre usuario o rol_permiso', async () => {
      const sqlInsertUsuario = "INSERT INTO usuario (username, password_hash, salt, nombre) VALUES ('hacker', 'h', 's', 'Hack');";
      const sqlUpdateRol = "UPDATE rol_permiso SET puede_crear = 1 WHERE rol = 'ROL_CONDUCTOR';";
      const sqlDeleteUsuario = "DELETE FROM usuario WHERE id_usuario = 1;";

      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sqlInsertUsuario),
        (err) => err instanceof ForbiddenError && err.status === 403 && /403 Forbidden/.test(err.message)
      );

      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sqlUpdateRol),
        (err) => err instanceof ForbiddenError && err.status === 403 && /403 Forbidden/.test(err.message)
      );

      await assert.rejects(
        async () => verificarAutorizacionSQL(db, sesionConductor, sqlDeleteUsuario),
        (err) => err instanceof ForbiddenError && err.status === 403 && /403 Forbidden/.test(err.message)
      );
    });

    it('Lanza UnauthorizedError (401) si no se proporciona sesión activa en sentencia protegida', async () => {
      const sql = "INSERT INTO usuario (username) VALUES ('anon');";
      await assert.rejects(
        async () => verificarAutorizacionSQL(db, null, sql),
        (err) => err instanceof UnauthorizedError && err.status === 401
      );
    });

    it('crearAdaptadorSqlConGuardia bloquea la ejecución en el cliente de datos', async () => {
      const dbProtegida = crearAdaptadorSqlConGuardia(db, sesionConductor);

      await assert.rejects(
        async () => dbProtegida.ejecutar("DELETE FROM rol_permiso WHERE id_permiso = 1;"),
        /403 Forbidden/
      );
    });
  });

  describe('Guardia de navegación en enrutador UI', () => {
    it('Permite acceso a rutas públicas sin sesión (ej. /login)', async () => {
      const acceso = await evaluarAccesoRuta('/login', null, db);
      assert.equal(acceso.permitido, true);
    });

    it('Redirige a /login con 401 si una ruta protegida se solicita sin sesión activa', async () => {
      const acceso = await evaluarAccesoRuta('/usuarios', null, db);
      assert.equal(acceso.permitido, false);
      assert.equal(acceso.status, 401);
      assert.equal(acceso.redirect, '/login');
    });

    it('Redirige a /403 con 403 Forbidden cuando ROL_CONDUCTOR intenta acceder a /usuarios o /roles', async () => {
      const accesoUsuarios = await evaluarAccesoRuta('/usuarios', sesionConductor, db);
      assert.equal(accesoUsuarios.permitido, false);
      assert.equal(accesoUsuarios.status, 403);
      assert.equal(accesoUsuarios.redirect, '/403');
      assert.match(accesoUsuarios.error, /403 Forbidden/);

      const accesoRoles = await evaluarAccesoRuta('/roles', sesionConductor, db);
      assert.equal(accesoRoles.permitido, false);
      assert.equal(accesoRoles.status, 403);
    });

    it('Permite el acceso a ROL_ADMIN a todas las vistas protegidas', async () => {
      const accesoUsuarios = await evaluarAccesoRuta('/usuarios', sesionAdmin, db);
      assert.equal(accesoUsuarios.permitido, true);

      const accesoAuditoria = await evaluarAccesoRuta('/auditoria', sesionAdmin, db);
      assert.equal(accesoAuditoria.permitido, true);
    });

    it('Permite a ROL_CONDUCTOR acceder a las vistas que tiene autorizadas (ej. /rutas)', async () => {
      const accesoRutas = await evaluarAccesoRuta('/rutas', sesionConductor, db);
      assert.equal(accesoRutas.permitido, true);
    });
  });

  describe('Criterio BDD: Ocultamiento del menú en la interfaz', () => {
    const menuCompleto = [
      { ruta: '/rutas', etiqueta: 'Hojas de Ruta' },
      { ruta: '/tacografo', etiqueta: 'Tacógrafo' },
      { ruta: '/usuarios', etiqueta: 'Administración de Usuarios' },
      { ruta: '/roles', etiqueta: 'Roles y Permisos' },
      { ruta: '/auditoria', etiqueta: 'Auditoría del Sistema' }
    ];

    it('Para ROL_CONDUCTOR oculta las opciones de menú administrativas', async () => {
      const menuVisible = await filtrarMenuPorRol(menuCompleto, sesionConductor, db);
      const rutasVisibles = menuVisible.map((m) => m.ruta);

      assert.ok(rutasVisibles.includes('/rutas'));
      assert.ok(rutasVisibles.includes('/tacografo'));
      assert.ok(!rutasVisibles.includes('/usuarios'));
      assert.ok(!rutasVisibles.includes('/roles'));
      assert.ok(!rutasVisibles.includes('/auditoria'));
    });

    it('Para ROL_ADMIN mantiene todas las opciones del menú visibles', async () => {
      const menuVisible = await filtrarMenuPorRol(menuCompleto, sesionAdmin, db);
      assert.equal(menuVisible.length, menuCompleto.length);
    });
  });
});
