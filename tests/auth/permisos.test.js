import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  asignarPermiso,
  obtenerPermiso,
  listarPermisosPorRol,
  listarTodosPermisos,
  tienePermiso,
  actualizarPermiso,
  revocarPermisoModulo,
  eliminarPermisosRol,
  inicializarMatrizPermisos,
  ROLES_CANONICOS,
  MODULOS_SISTEMA
} from '../../src/auth/permisos.js';

describe('TTTRUCKS-25 Subtarea TTTRUCKS-27 - CRUD 12 Matriz de Roles y Permisos (rol_permiso)', () => {
  let db;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    const schemaPath = resolve(process.cwd(), 'sql/schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  });

  it('Constantes exportadas contienen los roles y módulos canónicos esperados', () => {
    assert.ok(ROLES_CANONICOS.includes('ROL_ADMIN'));
    assert.ok(ROLES_CANONICOS.includes('ROL_CONDUCTOR'));
    assert.ok(MODULOS_SISTEMA.includes('usuarios'));
    assert.ok(MODULOS_SISTEMA.includes('roles'));
    assert.ok(MODULOS_SISTEMA.includes('auditoria'));
    assert.ok(MODULOS_SISTEMA.includes('organizacion'));
  });

  it('CREATE: asignarPermiso inserta y actualiza permisos por rol y módulo de forma idempotente', async () => {
    const perm = await asignarPermiso(db, {
      rol: 'ROL_TEST',
      modulo: 'rutas',
      puede_crear: 1,
      puede_leer: 1,
      puede_actualizar: 0,
      puede_eliminar: 0
    });

    assert.ok(perm.id_permiso > 0);
    assert.equal(perm.rol, 'ROL_TEST');
    assert.equal(perm.modulo, 'rutas');
    assert.equal(perm.puede_crear, 1);
    assert.equal(perm.puede_leer, 1);
    assert.equal(perm.puede_actualizar, 0);
    assert.equal(perm.puede_eliminar, 0);

    // Actualización idempotente (ON CONFLICT)
    const actualizado = await asignarPermiso(db, {
      rol: 'ROL_TEST',
      modulo: 'rutas',
      puede_actualizar: 1
    });

    assert.equal(actualizado.puede_actualizar, 1);
  });

  it('CREATE: validación de campos obligatorios en asignarPermiso', async () => {
    await assert.rejects(
      async () => asignarPermiso(db, { rol: '', modulo: 'rutas' }),
      /El identificador de rol es obligatorio/
    );

    await assert.rejects(
      async () => asignarPermiso(db, { rol: 'ROL_TEST', modulo: ' ' }),
      /El identificador del módulo es obligatorio/
    );
  });

  it('READ: inicializarMatrizPermisos aprovisiona ROL_ADMIN con acceso total y ROL_CONDUCTOR restringido', async () => {
    await inicializarMatrizPermisos(db);

    const permisosAdmin = await listarPermisosPorRol(db, 'ROL_ADMIN');
    assert.equal(permisosAdmin.length, MODULOS_SISTEMA.length);
    for (const p of permisosAdmin) {
      assert.equal(p.puede_crear, 1);
      assert.equal(p.puede_leer, 1);
      assert.equal(p.puede_actualizar, 1);
      assert.equal(p.puede_eliminar, 1);
    }

    // ROL_CONDUCTOR no debe tener acceso a usuarios ni auditoría
    const permUsuariosConductor = await obtenerPermiso(db, 'ROL_CONDUCTOR', 'usuarios');
    assert.ok(permUsuariosConductor);
    assert.equal(permUsuariosConductor.puede_crear, 0);
    assert.equal(permUsuariosConductor.puede_leer, 0);
    assert.equal(permUsuariosConductor.puede_actualizar, 0);
    assert.equal(permUsuariosConductor.puede_eliminar, 0);

    // ROL_CONDUCTOR tiene lectura en rutas
    const permRutasConductor = await obtenerPermiso(db, 'ROL_CONDUCTOR', 'rutas');
    assert.ok(permRutasConductor);
    assert.equal(permRutasConductor.puede_leer, 1);
    assert.equal(permRutasConductor.puede_eliminar, 0);
  });

  it('READ: tienePermiso evalúa RBAC de forma segura con principio de menor privilegio', async () => {
    await inicializarMatrizPermisos(db);

    assert.equal(await tienePermiso(db, 'ROL_ADMIN', 'usuarios', 'crear'), true);
    assert.equal(await tienePermiso(db, 'ROL_ADMIN', 'usuarios', 'eliminar'), true);

    // Conductor denegado en usuarios
    assert.equal(await tienePermiso(db, 'ROL_CONDUCTOR', 'usuarios', 'crear'), false);
    assert.equal(await tienePermiso(db, 'ROL_CONDUCTOR', 'usuarios', 'leer'), false);

    // Conductor permitido en lectura de rutas
    assert.equal(await tienePermiso(db, 'ROL_CONDUCTOR', 'rutas', 'leer'), true);
    assert.equal(await tienePermiso(db, 'ROL_CONDUCTOR', 'rutas', 'eliminar'), false);

    // Módulo o rol inexistente devuelve false (deny by default)
    assert.equal(await tienePermiso(db, 'ROL_INEXISTENTE', 'rutas', 'leer'), false);

    // Acción desconocida lanza excepción
    await assert.rejects(
      async () => tienePermiso(db, 'ROL_ADMIN', 'rutas', 'volar'),
      /Acción desconocida "volar"/
    );
  });

  it('UPDATE: actualizarPermiso ajusta banderas granulares y protege a ROL_ADMIN contra lockout', async () => {
    await inicializarMatrizPermisos(db);

    // Ajuste granular en ROL_CONDUCTOR para módulo flota (conceder actualizar)
    const ajustado = await actualizarPermiso(db, 'ROL_CONDUCTOR', 'flota', {
      puede_actualizar: 1
    });
    assert.equal(ajustado.puede_actualizar, 1);
    assert.equal(await tienePermiso(db, 'ROL_CONDUCTOR', 'flota', 'actualizar'), true);

    // Intento de revocar permisos críticos a ROL_ADMIN lanza error de protección
    await assert.rejects(
      async () => actualizarPermiso(db, 'ROL_ADMIN', 'usuarios', { puede_actualizar: 0 }),
      /No está permitido revocar permisos de administración sobre módulos de seguridad/
    );
  });

  it('DELETE: revocarPermisoModulo y eliminarPermisosRol revocan privilegios con salvaguardas para ROL_ADMIN', async () => {
    await asignarPermiso(db, { rol: 'ROL_INVITADO', modulo: 'reportes', puede_leer: 1 });
    await asignarPermiso(db, { rol: 'ROL_INVITADO', modulo: 'rutas', puede_leer: 1 });

    let listaInvitado = await listarPermisosPorRol(db, 'ROL_INVITADO');
    assert.equal(listaInvitado.length, 2);

    // Revocación de un único módulo
    await revocarPermisoModulo(db, 'ROL_INVITADO', 'reportes');
    listaInvitado = await listarPermisosPorRol(db, 'ROL_INVITADO');
    assert.equal(listaInvitado.length, 1);
    assert.equal(listaInvitado[0].modulo, 'rutas');

    // Revocación masiva de rol secundario
    await eliminarPermisosRol(db, 'ROL_INVITADO');
    listaInvitado = await listarPermisosPorRol(db, 'ROL_INVITADO');
    assert.equal(listaInvitado.length, 0);

    // Salvaguarda: ROL_ADMIN no puede ser eliminado en bloque
    await assert.rejects(
      async () => eliminarPermisosRol(db, 'ROL_ADMIN'),
      /No está permitido eliminar los permisos del rol ROL_ADMIN del sistema/
    );
  });

  it('READ: listarTodosPermisos devuelve el censo completo de la matriz', async () => {
    await asignarPermiso(db, { rol: 'ROL_A', modulo: 'm1', puede_leer: 1 });
    await asignarPermiso(db, { rol: 'ROL_B', modulo: 'm2', puede_leer: 1 });

    const todos = await listarTodosPermisos(db);
    assert.ok(todos.length >= 2);
    assert.ok(todos.some((p) => p.rol === 'ROL_A' && p.modulo === 'm1'));
    assert.ok(todos.some((p) => p.rol === 'ROL_B' && p.modulo === 'm2'));
  });
});
