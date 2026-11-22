import test from 'node:test';
import assert from 'node:assert/strict';
import { soportaOPFS, registrarVFS } from '../../src/db/vfs.js';

test('TTTRUCKS-22 - Sistema de archivos virtual (VFS) con OPFS y fallback en memoria', async (t) => {
  // Mock simple de la interfaz sqlite3 para el registro de VFS
  const crearMockSqlite = () => {
    const registrados = [];
    return {
      registrados,
      vfs_register(vfs, esDefault) {
        registrados.push({ vfs, esDefault, nombre: vfs.name });
      }
    };
  };

  await t.test('soportaOPFS detecta ausencia de API OPFS en entorno sin navigator.storage', () => {
    const originalStorage = globalThis.navigator?.storage;
    if (globalThis.navigator) globalThis.navigator.storage = undefined;

    try {
      assert.equal(soportaOPFS(), false);
    } finally {
      if (globalThis.navigator) globalThis.navigator.storage = originalStorage;
    }
  });

  await t.test('registrarVFS activa MemoryFallback cuando OPFS no está disponible', () => {
    const originalStorage = globalThis.navigator?.storage;
    if (globalThis.navigator) globalThis.navigator.storage = undefined;

    try {
      const mockSqlite = crearMockSqlite();
      const resultado = registrarVFS(mockSqlite);

      assert.equal(resultado.storageType, 'MemoryFallback');
      assert.equal(mockSqlite.registrados.length, 1);
      assert.equal(mockSqlite.registrados[0].esDefault, true);
    } finally {
      if (globalThis.navigator) globalThis.navigator.storage = originalStorage;
    }
  });

  await t.test('registrarVFS activa OPFS cuando navigator.storage.getDirectory existe', () => {
    const originalStorage = globalThis.navigator?.storage;
    if (!globalThis.navigator) {
      globalThis.navigator = {};
    }
    // Simulamos la API OPFS del navegador
    globalThis.navigator.storage = {
      getDirectory: async () => ({})
    };

    try {
      assert.equal(soportaOPFS(), true);
      const mockSqlite = crearMockSqlite();
      const resultado = registrarVFS(mockSqlite);

      assert.equal(resultado.storageType, 'OPFS');
      assert.equal(mockSqlite.registrados.length, 1);
      assert.equal(mockSqlite.registrados[0].nombre, 'opfs');
      assert.equal(mockSqlite.registrados[0].esDefault, true);
    } finally {
      if (globalThis.navigator) {
        globalThis.navigator.storage = originalStorage;
      }
    }
  });

  await t.test('registrarVFS recurre a fallback si vfs_register lanza excepción con OPFS', () => {
    const originalStorage = globalThis.navigator?.storage;
    if (!globalThis.navigator) globalThis.navigator = {};
    globalThis.navigator.storage = {
      getDirectory: async () => ({})
    };

    try {
      let intento = 0;
      const mockSqliteFallo = {
        registrados: [],
        vfs_register(vfs, esDefault) {
          intento++;
          if (intento === 1) {
            throw new Error('Fallo simulado al registrar VFS OPFS');
          }
          this.registrados.push({ vfs, esDefault });
        }
      };

      const resultado = registrarVFS(mockSqliteFallo);
      assert.equal(resultado.storageType, 'MemoryFallback');
      assert.equal(mockSqliteFallo.registrados.length, 1);
    } finally {
      if (globalThis.navigator) {
        globalThis.navigator.storage = originalStorage;
      }
    }
  });
});
