import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { generarSalt, hashearPassword, verificarPassword } from '../../src/auth/crypto.js';
import {
  crearUsuario,
  obtenerUsuarioPorId,
  obtenerUsuarioPorUsername,
  listarUsuarios,
  actualizarUsuario,
  bajaLogicaUsuario,
  reactivarUsuario,
  ROLES_VALIDOS
} from '../../src/auth/usuarios.js';

test('TTTRUCKS-25 Subtarea TTTRUCKS-26 - CRUD 11 Usuarios y Criptografía SHA-256', async (t) => {
  // Inicialización de base de datos en memoria con esquema DDL completo
  const db = new DatabaseSync(':memory:');
  const ddlPath = path.resolve(process.cwd(), 'sql/schema.sql');
  const ddl = fs.readFileSync(ddlPath, 'utf8');
  db.exec(ddl);

  await t.test('Criptografía: generarSalt genera hex de 32 caracteres y hashearPassword calcula SHA-256', async () => {
    const salt1 = generarSalt();
    const salt2 = generarSalt();
    assert.equal(salt1.length, 32);
    assert.notEqual(salt1, salt2);

    const hash1 = await hashearPassword('AdminSecret123!', salt1);
    const hash2 = await hashearPassword('AdminSecret123!', salt2);
    assert.equal(hash1.length, 64); // SHA-256 son 64 caracteres hex
    assert.notEqual(hash1, hash2); // Salts diferentes generan hashes distintos

    const coincide = await verificarPassword('AdminSecret123!', salt1, hash1);
    const noCoincide = await verificarPassword('PasswordIncorrecta', salt1, hash1);
    assert.equal(coincide, true);
    assert.equal(noCoincide, false);
  });

  await t.test('CREATE: crearUsuario inserta usuario con salt, hash y rol por defecto', async () => {
    const usuario = await crearUsuario(db, {
      username: 'conductor_juan',
      password: 'MiPasswordSegura1',
      nombre: 'Juan',
      apellidos: 'García Pérez',
      email: 'juan@ticktocktrucks.com',
      rol: 'ROL_CONDUCTOR'
    });

    assert.ok(usuario.id_usuario > 0);
    assert.equal(usuario.username, 'conductor_juan');
    assert.equal(usuario.nombre, 'Juan');
    assert.equal(usuario.rol, 'ROL_CONDUCTOR');
    assert.equal(usuario.activo, 1);
    assert.equal(usuario.password_hash, undefined); // No expuesto en retorno público

    // Verificación interna en base de datos: comprueba que salt y hash se guardaron
    const interno = await obtenerUsuarioPorUsername(db, 'conductor_juan');
    assert.ok(interno.salt);
    assert.ok(interno.password_hash);
    const passValida = await verificarPassword('MiPasswordSegura1', interno.salt, interno.password_hash);
    assert.equal(passValida, true);
  });

  await t.test('CREATE: validaciones de entrada (longitud de clave, duplicados y rol)', async () => {
    // Contraseña corta
    await assert.rejects(
      async () => crearUsuario(db, { username: 'user2', password: '123', nombre: 'Test' }),
      /al menos 6 caracteres/
    );

    // Username duplicado
    await assert.rejects(
      async () => crearUsuario(db, { username: 'conductor_juan', password: 'PasswordValida1', nombre: 'Otro Juan' }),
      /ya está registrado/
    );

    // Rol no válido
    await assert.rejects(
      async () => crearUsuario(db, { username: 'user3', password: 'PasswordValida1', nombre: 'Test', rol: 'ROL_SUPERUSER' }),
      /Rol inválido/
    );
  });

  await t.test('READ: obtenerUsuarioPorId y listarUsuarios con último login', async () => {
    await crearUsuario(db, {
      username: 'admin_maria',
      password: 'AdminPassword99',
      nombre: 'María',
      apellidos: 'López',
      email: 'maria@ticktocktrucks.com',
      rol: 'ROL_ADMIN'
    });

    const lista = await listarUsuarios(db);
    assert.ok(lista.length >= 2);
    assert.ok(lista.some(u => u.username === 'admin_maria' && u.rol === 'ROL_ADMIN'));

    const maria = lista.find(u => u.username === 'admin_maria');
    const mariaPorId = await obtenerUsuarioPorId(db, maria.id_usuario);
    assert.equal(mariaPorId.username, 'admin_maria');
    assert.equal(mariaPorId.nombre, 'María');
  });

  await t.test('UPDATE: actualizarUsuario modifica perfil, rol y contraseña regenerando salt', async () => {
    const lista = await listarUsuarios(db);
    const maria = lista.find(u => u.username === 'admin_maria');
    const internoAntes = await obtenerUsuarioPorUsername(db, 'admin_maria');

    // Actualizar nombre y contraseña
    const actualizado = await actualizarUsuario(db, maria.id_usuario, {
      nombre: 'María del Carmen',
      password: 'NuevaPassword2026'
    });

    assert.equal(actualizado.nombre, 'María del Carmen');

    // Comprobar que el salt y el hash cambiaron
    const internoDespues = await obtenerUsuarioPorUsername(db, 'admin_maria');
    assert.notEqual(internoAntes.salt, internoDespues.salt);
    assert.notEqual(internoAntes.password_hash, internoDespues.password_hash);

    // La nueva contraseña verifica, la anterior ya no
    const nuevaValida = await verificarPassword('NuevaPassword2026', internoDespues.salt, internoDespues.password_hash);
    const viejaInvalida = await verificarPassword('AdminPassword99', internoDespues.salt, internoDespues.password_hash);
    assert.equal(nuevaValida, true);
    assert.equal(viejaInvalida, false);
  });

  await t.test('DELETE: bajaLogicaUsuario marca activo = 0 preservando histórico', async () => {
    const lista = await listarUsuarios(db);
    const juan = lista.find(u => u.username === 'conductor_juan');

    // Baja lógica
    const resBaja = await bajaLogicaUsuario(db, juan.id_usuario);
    assert.equal(resBaja.activo, 0);
    assert.equal(resBaja.baja_logica, true);

    // El registro sigue existiendo físicamente en la BBDD
    const usuarioEnDB = await obtenerUsuarioPorId(db, juan.id_usuario);
    assert.ok(usuarioEnDB != null);
    assert.equal(usuarioEnDB.activo, 0);

    // Filtro de solo activos lo excluye
    const soloActivos = await listarUsuarios(db, { soloActivos: true });
    assert.equal(soloActivos.some(u => u.username === 'conductor_juan'), false);

    // Reactivación
    const resReact = await reactivarUsuario(db, juan.id_usuario);
    assert.equal(resReact.activo, 1);
    const reactivado = await obtenerUsuarioPorId(db, juan.id_usuario);
    assert.equal(reactivado.activo, 1);
  });
});
