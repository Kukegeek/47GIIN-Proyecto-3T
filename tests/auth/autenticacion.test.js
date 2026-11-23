import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { crearUsuario, bajaLogicaUsuario, obtenerUsuarioPorId } from '../../src/auth/usuarios.js';
import {
  validarCredenciales,
  autenticarUsuario,
  cerrarSesion,
  obtenerSesionActiva,
  GestorSesion,
  gestorSesion
} from '../../src/auth/autenticacion.js';

describe('TTTRUCKS-25 Subtarea TTTRUCKS-28 - Servicio de Autenticación Criptográfica y Gestión de Sesión', () => {
  let db;

  beforeEach(async () => {
    gestorSesion.cerrar();
    db = new DatabaseSync(':memory:');
    const schemaPath = resolve(process.cwd(), 'sql/schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);

    // Sembrar usuario de prueba
    await crearUsuario(db, {
      username: 'operador1',
      password: 'password123',
      nombre: 'Carlos',
      apellidos: 'García',
      email: 'carlos@tttrucks.com',
      rol: 'ROL_CONDUCTOR'
    });
  });

  it('validarCredenciales valida correctamente credenciales válidas y sanitiza la salida', async () => {
    const usuario = await validarCredenciales(db, 'operador1', 'password123');
    assert.ok(usuario);
    assert.equal(usuario.username, 'operador1');
    assert.equal(usuario.nombre, 'Carlos');
    assert.equal(usuario.rol, 'ROL_CONDUCTOR');
    assert.equal(usuario.password_hash, undefined);
    assert.equal(usuario.salt, undefined);
  });

  it('validarCredenciales rechaza contraseñas incorrectas con mensaje genérico', async () => {
    await assert.rejects(
      async () => validarCredenciales(db, 'operador1', 'clave_erronea'),
      /Credenciales inválidas/
    );
  });

  it('validarCredenciales rechaza usuarios inexistentes con mensaje genérico', async () => {
    await assert.rejects(
      async () => validarCredenciales(db, 'usuario_fantasma', 'password123'),
      /Credenciales inválidas/
    );
  });

  it('validarCredenciales bloquea el acceso si el usuario está dado de baja lógica', async () => {
    const user = await validarCredenciales(db, 'operador1', 'password123');
    await bajaLogicaUsuario(db, user.id_usuario);

    await assert.rejects(
      async () => validarCredenciales(db, 'operador1', 'password123'),
      /El usuario está inactivo o bloqueado/
    );
  });

  it('autenticarUsuario inicia la sesión, actualiza ultimo_login y registra auditoría LOGIN', async () => {
    const sesion = await autenticarUsuario(db, 'operador1', 'password123', {
      origen_sesion: 'app_tablet'
    });

    assert.ok(sesion);
    assert.equal(sesion.username, 'operador1');
    assert.equal(sesion.rol, 'ROL_CONDUCTOR');
    assert.equal(sesion.origen_sesion, 'app_tablet');
    assert.ok(sesion.token.startsWith('sess_'));
    assert.ok(gestorSesion.estaAutenticado());
    assert.deepEqual(obtenerSesionActiva(), sesion);

    // Verificar actualización de ultimo_login en la base de datos
    const userDb = await obtenerUsuarioPorId(db, sesion.id_usuario);
    assert.ok(userDb.ultimo_login !== null);

    // Verificar registro automático en log_auditoria
    const logs = db.prepare('SELECT * FROM log_auditoria WHERE accion = ?;').all('LOGIN');
    assert.equal(logs.length, 1);
    assert.equal(logs[0].username, 'operador1');
    assert.equal(logs[0].rol_ejecutor, 'ROL_CONDUCTOR');
    assert.equal(logs[0].entidad, 'usuario');
    assert.equal(logs[0].id_registro, String(sesion.id_usuario));
    assert.equal(logs[0].origen_sesion, 'app_tablet');
  });

  it('cerrarSesion finaliza el estado de autenticación activa', async () => {
    await autenticarUsuario(db, 'operador1', 'password123');
    assert.equal(gestorSesion.estaAutenticado(), true);

    cerrarSesion();
    assert.equal(gestorSesion.estaAutenticado(), false);
    assert.equal(obtenerSesionActiva(), null);
  });

  it('GestorSesion permite instancias aisladas y actualización de actividad', () => {
    const gestorCustom = new GestorSesion();
    assert.equal(gestorCustom.estaAutenticado(), false);

    gestorCustom.iniciar({
      id_usuario: 99,
      username: 'admin_test',
      rol: 'ROL_ADMIN'
    });
    assert.equal(gestorCustom.estaAutenticado(), true);
    const sesion = gestorCustom.obtener();
    assert.equal(sesion.username, 'admin_test');

    const previoAcceso = sesion.ultimo_acceso;
    gestorCustom.renovarActividad();
    assert.ok(gestorCustom.obtener().ultimo_acceso >= previoAcceso);

    gestorCustom.cerrar();
    assert.equal(gestorCustom.estaAutenticado(), false);
  });
});
