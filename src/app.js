// Tick Tock Trucks (3T) - Entrada principal
// Arquitectura modular Vanilla JS (ES2024)

console.log('Tick Tock Trucks inicializado.');

export function initApp() {
  const container = document.getElementById('main-content');
  if (container) {
    container.innerHTML = '<p>Tick Tock Trucks preparado. Arquitectura Local-First activa.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initApp);
