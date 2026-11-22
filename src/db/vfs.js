// Gestor de Virtual File System (VFS) para wa-sqlite (TTTRUCKS-22)
// Soporta persistencia real en navegador mediante OPFS y fallback en memoria.

import { OriginPrivateFileSystemVFS } from 'wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js';
import { MemoryAsyncVFS } from 'wa-sqlite/src/examples/MemoryAsyncVFS.js';

/**
 * Comprueba si el entorno actual soporta el sistema de archivos privado OPFS.
 * Requiere soporte de navigator.storage y su método getDirectory.
 * @returns {boolean}
 */
export function soportaOPFS() {
  return typeof navigator !== 'undefined' &&
    typeof navigator.storage?.getDirectory === 'function';
}

/**
 * Registra el VFS adecuado en la instancia de SQLite.
 * Si OPFS está disponible en el entorno y no falla su inicialización, se registra OriginPrivateFileSystemVFS.
 * En caso contrario (Node.js, contexto HTTP no seguro o navegadores sin soporte),
 * se recurre a MemoryAsyncVFS como alternativa no persistente y funcional.
 *
 * @param {object} sqlite3 - Instancia de wa-sqlite
 * @returns {{ storageType: 'OPFS' | 'MemoryFallback', vfs: object }}
 */
export function registrarVFS(sqlite3) {
  if (soportaOPFS()) {
    try {
      const vfsOpfs = new OriginPrivateFileSystemVFS();
      sqlite3.vfs_register(vfsOpfs, true);
      return { storageType: 'OPFS', vfs: vfsOpfs };
    } catch {
      // Si falla la inicialización de OPFS (p. ej. contexto no seguro), fallback a memoria
      const vfsMem = new MemoryAsyncVFS();
      sqlite3.vfs_register(vfsMem, true);
      return { storageType: 'MemoryFallback', vfs: vfsMem };
    }
  }

  // Fallback directo para entornos sin soporte de OPFS (Node.js, etc.)
  const vfsMem = new MemoryAsyncVFS();
  sqlite3.vfs_register(vfsMem, true);
  return { storageType: 'MemoryFallback', vfs: vfsMem };
}
