// Tick Tock Trucks (3T) - Entrada principal
// Arquitectura modular Vanilla JS (ES2024)
import { SqliteClient } from './db/sqlite-client.js';

const dbClient = new SqliteClient();

export async function initApp() {
  const container = document.getElementById('main-content');
  if (!container) return;

  try {
    container.innerHTML = '<p>Iniciando Web Worker SQLite sobre OPFS...</p>';
    const estado = await dbClient.inicializar();
    container.innerHTML = `
      <div class="card">
        <h2>Motor de Base de Datos Local-First</h2>
        <p><strong>Estado:</strong> Conectado y listo</p>
        <p><strong>Almacenamiento:</strong> ${estado.storageType}</p>
        <p><strong>Base de datos:</strong> ${estado.dbName}</p>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<p class="error">Error al iniciar motor local: ${error.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', initApp);
