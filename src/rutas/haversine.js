/**
 * Módulo de Cálculo Geodésico Ortodrómico (Fórmula de Haversine)
 * Componente: M01-Rutas | Tarea: TTTRUCKS-39 (Subtarea 1 de TTTRUCKS-38)
 *
 * Implementa la fórmula ortodrómica de Haversine para cálculo de distancia geodésica
 * en una esfera terrestre con precisión métrica y sub-milisegundo (< 1 ms).
 */

/** Radio medio de la Tierra en metros según estándar IUGG / WGS-84 aproximado */
export const RADIO_TIERRA_METROS = 6371000;

/** Radio medio de la Tierra en kilómetros */
export const RADIO_TIERRA_KM = 6371;

/**
 * Convierte un ángulo en grados sexagesimales a radianes
 * @param {number} grados - Ángulo en grados
 * @returns {number} Ángulo equivalente en radianes
 */
export function gradosARadianes(grados) {
  if (typeof grados !== 'number' || Number.isNaN(grados)) {
    throw new TypeError('El valor de grados debe ser un número finito válido.');
  }
  return (grados * Math.PI) / 180;
}

/**
 * Convierte un ángulo en radianes a grados sexagesimales
 * @param {number} radianes - Ángulo en radianes
 * @returns {number} Ángulo equivalente en grados
 */
export function radianesAGrados(radianes) {
  if (typeof radianes !== 'number' || Number.isNaN(radianes)) {
    throw new TypeError('El valor de radianes debe ser un número finito válido.');
  }
  return (radianes * 180) / Math.PI;
}

/**
 * Normaliza y valida una coordenada geográfica asegurando que sea un punto válido en WGS-84
 * Admite formatos:
 * - Objeto: { lat, lon } o { lat, lng } o { latitude, longitude }
 * - Array: [lat, lon]
 *
 * @param {object|Array} coord - Coordenada de entrada
 * @param {string} [nombre='Coordenada'] - Nombre para mensajes de error
 * @returns {{ lat: number, lon: number }} Coordenada normalizada
 */
export function validarCoordenada(coord, nombre = 'Coordenada') {
  if (!coord || typeof coord !== 'object') {
    throw new TypeError(`${nombre} debe ser un objeto o array con coordenadas geográficas.`);
  }

  let lat;
  let lon;

  if (Array.isArray(coord)) {
    if (coord.length < 2) {
      throw new TypeError(`${nombre} en formato array debe contener al menos dos elementos [lat, lon].`);
    }
    lat = coord[0];
    lon = coord[1];
  } else {
    lat = coord.lat !== undefined ? coord.lat : (coord.latitude !== undefined ? coord.latitude : undefined);
    lon = coord.lon !== undefined ? coord.lon : (coord.lng !== undefined ? coord.lng : (coord.longitude !== undefined ? coord.longitude : undefined));
  }

  if (typeof lat !== 'number' || Number.isNaN(lat) || !Number.isFinite(lat)) {
    throw new TypeError(`Latitud de ${nombre} debe ser un número finito válido.`);
  }
  if (typeof lon !== 'number' || Number.isNaN(lon) || !Number.isFinite(lon)) {
    throw new TypeError(`Longitud de ${nombre} debe ser un número finito válido.`);
  }

  if (lat < -90 || lat > 90) {
    throw new RangeError(`Latitud de ${nombre} fuera de rango [-90, 90]: ${lat}`);
  }
  if (lon < -180 || lon > 180) {
    throw new RangeError(`Longitud de ${nombre} fuera de rango [-180, 180]: ${lon}`);
  }

  return { lat, lon };
}

/**
 * Determina si dos coordenadas geográficas son equivalentes dentro de una tolerancia angular
 * @param {object|Array} c1 - Primera coordenada
 * @param {object|Array} c2 - Segunda coordenada
 * @param {number} [tolerancia=1e-7] - Margen de tolerancia (~1 cm)
 * @returns {boolean} true si representan el mismo punto geodésico
 */
export function sonCoordenadasIdenticas(c1, c2, tolerancia = 1e-7) {
  const p1 = validarCoordenada(c1, 'Coordenada 1');
  const p2 = validarCoordenada(c2, 'Coordenada 2');
  return Math.abs(p1.lat - p2.lat) <= tolerancia && Math.abs(p1.lon - p2.lon) <= tolerancia;
}

/**
 * Calcula la distancia ortodrómica (geodésica sobre la gran circunferencia) entre dos coordenadas
 * utilizando la fórmula de Haversine:
 *
 *   a = sin²(Δφ/2) + cos(φ₁) · cos(φ₂) · sin²(Δλ/2)
 *   c = 2 · atan2( √a, √(1−a) )
 *   d = R · c
 *
 * @param {object|Array} origen - Punto de origen { lat, lon }
 * @param {object|Array} destino - Punto de destino { lat, lon }
 * @param {object} [opciones={}] - Opciones de cálculo
 * @param {'km'|'m'} [opciones.unidad='km'] - Unidad del resultado ('km' por defecto, o 'm')
 * @param {number} [opciones.decimales] - Número de decimales para redondeo opcional
 * @returns {number} Distancia geodésica en la unidad seleccionada
 */
export function calcularDistanciaHaversine(origen, destino, opciones = {}) {
  const o = validarCoordenada(origen, 'Origen');
  const d = validarCoordenada(destino, 'Destino');

  // Optimización de identidad rápida: si origen y destino coinciden, distancia 0
  if (o.lat === d.lat && o.lon === d.lon) {
    return 0;
  }

  const phi1 = gradosARadianes(o.lat);
  const phi2 = gradosARadianes(d.lat);
  const deltaPhi = gradosARadianes(d.lat - o.lat);
  const deltaLambda = gradosARadianes(d.lon - o.lon);

  const sinDeltaPhi2 = Math.sin(deltaPhi / 2);
  const sinDeltaLambda2 = Math.sin(deltaLambda / 2);

  const a =
    sinDeltaPhi2 * sinDeltaPhi2 +
    Math.cos(phi1) * Math.cos(phi2) * sinDeltaLambda2 * sinDeltaLambda2;

  // Fijar límite [0, 1] ante desviaciones mínimas de redondeo IEEE 754
  const aLimitado = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(aLimitado), Math.sqrt(1 - aLimitado));

  const radio = opciones.unidad === 'm' ? RADIO_TIERRA_METROS : RADIO_TIERRA_KM;
  const distancia = radio * c;

  if (typeof opciones.decimales === 'number' && opciones.decimales >= 0) {
    const factor = Math.pow(10, Math.floor(opciones.decimales));
    return Math.round(distancia * factor) / factor;
  }

  return distancia;
}

/**
 * Sobrecarga de conveniencia para calcular la distancia ortodrómica directamente con cuatro números
 * @param {number} lat1 - Latitud de origen
 * @param {number} lon1 - Longitud de origen
 * @param {number} lat2 - Latitud de destino
 * @param {number} lon2 - Longitud de destino
 * @param {object} [opciones={}] - Opciones de cálculo
 * @returns {number} Distancia geodésica
 */
export function calcularDistanciaOrtodromica(lat1, lon1, lat2, lon2, opciones = {}) {
  return calcularDistanciaHaversine({ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 }, opciones);
}
