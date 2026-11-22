// Worker dedicado para SQLite sobre WebAssembly y OPFS (3T-04 Subtarea 1)
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { OriginPrivateFileSystemVFS } from 'wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js';
import { MemoryAsyncVFS } from 'wa-sqlite/src/examples/MemoryAsyncVFS.js';

let sqlite3 = null;
let db = null;
let storageType = 'unknown';
let dbName = 'tick_tock_trucks.db';

// Inicializa el módulo WebAssembly y el sistema de archivos OPFS
async function inicializar(nombreBBDD = dbName) {
  if (sqlite3 && db) {
    return { ok: true, storageType, dbName };
  }

  dbName = nombreBBDD;
  const wasmModule = await SQLiteAsyncESMFactory();
  sqlite3 = SQLite.Factory(wasmModule);

  // Comprueba compatibilidad con OPFS en el worker
  if (typeof navigator !== 'undefined' && navigator.storage?.getDirectory) {
    try {
      const vfsOpfs = new OriginPrivateFileSystemVFS();
      sqlite3.vfs_register(vfsOpfs, true);
      storageType = 'OPFS';
    } catch {
      const vfsMem = new MemoryAsyncVFS();
      sqlite3.vfs_register(vfsMem, true);
      storageType = 'MemoryFallback';
    }
  } else {
    const vfsMem = new MemoryAsyncVFS();
    sqlite3.vfs_register(vfsMem, true);
    storageType = 'MemoryFallback';
  }

  db = await sqlite3.open_v2(dbName);
  await sqlite3.exec(db, 'PRAGMA foreign_keys = ON;');

  return { ok: true, storageType, dbName };
}

// Ejecuta scripts SQL sin retorno de filas
async function ejecutar(sql) {
  if (!db) throw new Error('Base de datos no inicializada');
  await sqlite3.exec(db, sql);
  return { ok: true };
}

// Ejecuta consultas SELECT y mapea columnas con sus valores
async function consultar(sql, params = []) {
  if (!db) throw new Error('Base de datos no inicializada');
  const filas = [];
  
  for await (const stmt of sqlite3.statements(db, sql)) {
    if (params.length > 0) {
      sqlite3.bind_collection(stmt, params);
    }
    const cols = sqlite3.column_names(stmt);
    while (await sqlite3.step(stmt) === SQLite.SQLITE_ROW) {
      const fila = {};
      for (let i = 0; i < cols.length; i++) {
        fila[cols[i]] = sqlite3.column(stmt, i);
      }
      filas.push(fila);
    }
  }
  return filas;
}

// Receptor de mensajes del hilo principal
self.onmessage = async (evento) => {
  const { id, tipo, payload } = evento.data;
  try {
    let resultado;
    switch (tipo) {
      case 'INIT':
        resultado = await inicializar(payload?.dbName);
        break;
      case 'EXEC':
        resultado = await ejecutar(payload.sql);
        break;
      case 'QUERY':
        resultado = await consultar(payload.sql, payload.params);
        break;
      case 'STATUS':
        resultado = { ok: true, inicializado: !!db, storageType, dbName };
        break;
      default:
        throw new Error(`Acción desconocida: ${tipo}`);
    }
    self.postMessage({ id, ok: true, resultado });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error.message });
  }
};
