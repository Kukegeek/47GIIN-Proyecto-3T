import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA_PATH = path.resolve(process.cwd(), 'sql/schema.sql');

test('Sprint 0 - Validación de esquema DDL (15 tablas 3FN e integridad)', async (t) => {
  await t.test('El archivo schema.sql existe y tiene contenido', () => {
    assert.ok(fs.existsSync(SCHEMA_PATH), 'schema.sql debe existir en /sql');
    const content = fs.readFileSync(SCHEMA_PATH, 'utf8');
    assert.ok(content.length > 500, 'schema.sql no puede estar vacío');
  });

  await t.test('Creación sin errores de las 15 tablas relacionales con PRAGMA foreign_keys = ON', () => {
    const db = new DatabaseSync(':memory:');
    const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');

    // Ejecución íntegra del DDL
    db.exec(sql);

    // Consulta de tablas creadas (excluyendo sqlite_sequence)
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name != 'sqlite_sequence' ORDER BY name")
      .all()
      .map(row => row.name);

    const tablasEsperadas = [
      'clima_hito',
      'documento',
      'estacion_serv',
      'hito_ruta',
      'log_auditoria',
      'mantenimiento',
      'organizacion',
      'reg_tacografo',
      'remolque',
      'reporte',
      'repostaje',
      'rol_permiso',
      'ruta',
      'usuario',
      'vehiculo'
    ];

    assert.equal(tables.length, 15, `Se esperaban 15 tablas, se crearon ${tables.length}: ${tables.join(', ')}`);
    assert.deepEqual(tables.sort(), tablasEsperadas.sort());
  });

  await t.test('Verificación de restricciones de clave foránea activas', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));

    // Intento de inserción en tabla hija con clave foránea inexistente
    assert.throws(
      () => {
        db.exec("INSERT INTO vehiculo (matricula, marca, modelo, mma, id_conductor) VALUES ('1234-XYZ', 'Volvo', 'FH', 40.0, 9999);");
      },
      /FOREIGN KEY constraint failed/,
      'Debe fallar al referenciar un id_conductor que no existe en usuario'
    );
  });

  await t.test('Verificación de borrado en cascada (ON DELETE CASCADE)', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));

    // 1. Crear usuario
    db.exec("INSERT INTO usuario (username, password_hash, salt, nombre) VALUES ('chofer1', 'hash', 'salt', 'Carlos');");
    
    // 2. Crear ruta
    db.exec("INSERT INTO ruta (id_usuario, nombre_ruta, origen_texto, origen_lat, origen_lon, destino_texto, destino_lat, destino_lon, distancia_km, duracion_segundos, fecha_salida) VALUES (1, 'Murcia - Madrid', 'Murcia', 37.99, -1.13, 'Madrid', 40.41, -3.70, 400.0, 14400, '2026-11-20T08:00:00Z');");

    // 3. Crear hito_ruta
    db.exec("INSERT INTO hito_ruta (id_ruta, orden, tipo_hito, lat, lon, eta_estimada) VALUES (1, 1, 'PARADA', 39.0, -2.0, '2026-11-20T10:00:00Z');");

    // Comprobar inserción
    const hitosAntes = db.prepare("SELECT COUNT(*) AS total FROM hito_ruta WHERE id_ruta = 1").get();
    assert.equal(hitosAntes.total, 1);

    // 4. Borrar la ruta -> debe borrar en cascada el hito_ruta
    db.exec("DELETE FROM ruta WHERE id_ruta = 1;");
    const hitosDespues = db.prepare("SELECT COUNT(*) AS total FROM hito_ruta WHERE id_ruta = 1").get();
    assert.equal(hitosDespues.total, 0, 'El hito_ruta debe eliminarse automáticamente al borrar la ruta');
  });
});
