// Cliente principal para interactuar con el Web Worker de wa-sqlite (3T-04 Subtarea 1)

export class SqliteClient {
  constructor(workerPath = new URL('./worker.js', import.meta.url)) {
    this.workerPath = workerPath;
    this.worker = null;
    this.peticionesPendientes = new Map();
    this.contadorIds = 0;
    this.estado = 'no_iniciado';
  }

  // Conecta el manejador de eventos del worker
  _conectarWorker(workerInstance) {
    this.worker = workerInstance;
    this.worker.onmessage = (evento) => {
      const { id, ok, resultado, error } = evento.data;
      const resolver = this.peticionesPendientes.get(id);
      if (resolver) {
        this.peticionesPendientes.delete(id);
        if (ok) {
          resolver.resolve(resultado);
        } else {
          resolver.reject(new Error(error));
        }
      }
    };

    this.worker.onerror = (err) => {
      console.error('Error en Web Worker SQLite:', err);
    };
  }

  // Arranca el worker y solicita la apertura de la base de datos
  async inicializar(dbName = 'tick_tock_trucks.db') {
    if (this.worker) return this.obtenerEstado();

    const worker = new Worker(this.workerPath, { type: 'module' });
    this._conectarWorker(worker);

    const res = await this._enviar('INIT', { dbName });
    this.estado = 'listo';
    return res;
  }

  // Ejecuta una sentencia DDL o DML sin esperar resultados tabulares
  async ejecutar(sql) {
    return this._enviar('EXEC', { sql });
  }

  // Ejecuta una consulta SELECT y devuelve array de filas como objetos
  async consultar(sql, params = []) {
    return this._enviar('QUERY', { sql, params });
  }

  // Devuelve información del almacenamiento activo (OPFS o fallback)
  async obtenerEstado() {
    return this._enviar('STATUS');
  }

  // Cierra el worker y limpia recursos
  cerrar() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.estado = 'cerrado';
      this.peticionesPendientes.clear();
    }
  }

  // Gestiona la mensajería asíncrona mediante promesas
  _enviar(tipo, payload = {}) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        return reject(new Error('El worker no ha sido iniciado.'));
      }
      const id = ++this.contadorIds;
      this.peticionesPendientes.set(id, { resolve, reject });
      this.worker.postMessage({ id, tipo, payload });
    });
  }
}
