// Cliente principal para interactuar con el Web Worker de wa-sqlite (TTTRUCKS-23)

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
      const mensaje = err?.message || 'Error en Web Worker SQLite';
      for (const [, resolver] of this.peticionesPendientes.entries()) {
        resolver.reject(new Error(mensaje));
      }
      this.peticionesPendientes.clear();
    };
  }

  // Arranca el worker y solicita la apertura de la base de datos (acción INIT)
  async inicializar(dbName = 'tick_tock_trucks.db') {
    if (this.worker && this.estado === 'listo') {
      return this.obtenerEstado();
    }

    const worker = new Worker(this.workerPath, { type: 'module' });
    this._conectarWorker(worker);

    const res = await this._enviar('INIT', { dbName });
    this.estado = 'listo';
    return res;
  }

  // Ejecuta una sentencia DDL o DML sin esperar filas (acción EXEC)
  async ejecutar(sql) {
    return this._enviar('EXEC', { sql });
  }

  // Ejecuta una consulta SELECT y devuelve array de filas (acción QUERY)
  async consultar(sql, params = []) {
    return this._enviar('QUERY', { sql, params });
  }

  // Devuelve el estado actual de la conexión y tipo de almacenamiento (acción STATUS)
  async obtenerEstado() {
    return this._enviar('STATUS');
  }

  // Cierra el worker y limpia recursos rechazando peticiones pendientes
  cerrar() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.estado = 'cerrado';
      for (const [, resolver] of this.peticionesPendientes.entries()) {
        resolver.reject(new Error('Cliente cerrado antes de completar la operación.'));
      }
      this.peticionesPendientes.clear();
    }
  }

  // Envía un mensaje con ID único y devuelve una Promesa asociada
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
