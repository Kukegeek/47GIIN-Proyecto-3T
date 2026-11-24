/**
 * Módulo de Estimación Vial Instantánea y Factores de Tortuosidad Peninsular (TortuosityEngine)
 * Componente: M01-Rutas | Tarea: TTTRUCKS-40 (Subtarea 2 de TTTRUCKS-38)
 *
 * Aplica la matriz de factores de tortuosidad vial (relación entre distancia por carretera y distancia
 * ortodrómica) y perfiles de velocidad comercial para transporte pesado (3T) en la Península Ibérica,
 * resolviendo previsualizaciones de distancia y tiempo en menos de 1 ms (< 1 ms).
 */

import {
  calcularDistanciaHaversine,
  validarCoordenada,
  sonCoordenadasIdenticas,
} from './haversine.js';

/**
 * Matriz de perfiles de tortuosidad y velocidades operativas para camiones (> 3.5t)
 */
export const PERFILES_TORTUOSIDAD = Object.freeze({
  PENINSULAR_ESTANDAR: Object.freeze({
    id: 'PENINSULAR_ESTANDAR',
    nombre: 'Peninsular estándar',
    factor: 1.25,
    velocidadKmh: 80,
    descripcion: 'Tráfico interurbano mixto general en la península ibérica.',
  }),
  CORREDOR_AUTOPISTA: Object.freeze({
    id: 'CORREDOR_AUTOPISTA',
    nombre: 'Corredor de alta capacidad (Autovía / Autopista)',
    factor: 1.21,
    velocidadKmh: 85,
    descripcion: 'Rutas troncales de larga distancia por autovías y autopistas radiales.',
  }),
  NACIONAL_CONVENCIONAL: Object.freeze({
    id: 'NACIONAL_CONVENCIONAL',
    nombre: 'Carretera nacional / convencional',
    factor: 1.30,
    velocidadKmh: 70,
    descripcion: 'Itinerarios con tramos significativos de carretera convencional de calzada única.',
  }),
  OROGRAFIA_MONTANA: Object.freeze({
    id: 'OROGRAFIA_MONTANA',
    nombre: 'Orografía compleja / Puertos de montaña',
    factor: 1.42,
    velocidadKmh: 50,
    descripcion: 'Zonas montañosas (Pirineos, Cantábrica, Sistema Central/Bético) con curvas pronunciadas.',
  }),
  URBANO_ULTIMA_MILLA: Object.freeze({
    id: 'URBANO_ULTIMA_MILLA',
    nombre: 'Urbano / Última milla y accesos',
    factor: 1.40,
    velocidadKmh: 35,
    descripcion: 'Distribución local, circunvalaciones congestionadas y accesos a polígonos logísticos.',
  }),
});

/**
 * Matriz dinámica por tramos de distancia geodésica para estimación automática
 * En rutas más largas, una mayor proporción del viaje transcurre por autovías de trazado recto.
 */
export const RANGOS_DISTANCIA_PENINSULAR = Object.freeze([
  Object.freeze({
    id: 'DISTRIBUCION_URBANA',
    maxKm: 25,
    factor: 1.40,
    velocidadKmh: 40,
    descripcion: 'Entornos metropolitanos y distribución capilar (< 25 km)',
  }),
  Object.freeze({
    id: 'REGIONAL_COMARCAL',
    maxKm: 100,
    factor: 1.32,
    velocidadKmh: 68,
    descripcion: 'Conexiones comarcales y regionales de corta distancia (25 - 100 km)',
  }),
  Object.freeze({
    id: 'INTERPROVINCIAL_MEDIA',
    maxKm: 350,
    factor: 1.26,
    velocidadKmh: 78,
    descripcion: 'Rutas interprovinciales de media distancia (100 - 350 km)',
  }),
  Object.freeze({
    id: 'CORREDOR_LARGA_DISTANCIA',
    maxKm: Infinity,
    factor: 1.22,
    velocidadKmh: 84,
    descripcion: 'Corredores troncales peninsulares de larga distancia (> 350 km)',
  }),
]);

/**
 * Resuelve el factor de tortuosidad y la velocidad media aplicables según distancia y opciones
 * @param {number} distanciaGeodesicaKm - Distancia ortodrómica en kilómetros
 * @param {object} [opciones={}] - Opciones de configuración
 * @param {string} [opciones.perfil] - Identificador de perfil predefinido
 * @param {number} [opciones.factorPersonalizado] - Factor explícito a aplicar
 * @param {number} [opciones.velocidadPersonalizadaKmh] - Velocidad explícita a aplicar
 * @returns {{ factor: number, velocidadKmh: number, tipoPerfil: string }}
 */
export function resolverFactorYVelocidad(distanciaGeodesicaKm, opciones = {}) {
  // 1. Si se define un factor o velocidad explícita manual
  if (typeof opciones.factorPersonalizado === 'number' && opciones.factorPersonalizado >= 1.0) {
    const vel = typeof opciones.velocidadPersonalizadaKmh === 'number' && opciones.velocidadPersonalizadaKmh > 0
      ? opciones.velocidadPersonalizadaKmh
      : 80;
    return {
      factor: opciones.factorPersonalizado,
      velocidadKmh: vel,
      tipoPerfil: 'PERSONALIZADO',
    };
  }

  // 2. Si se solicita un perfil específico por nombre
  if (opciones.perfil && PERFILES_TORTUOSIDAD[opciones.perfil]) {
    const p = PERFILES_TORTUOSIDAD[opciones.perfil];
    return {
      factor: p.factor,
      velocidadKmh: p.velocidadKmh,
      tipoPerfil: p.id,
    };
  }

  // 3. Resolución automática por matriz de rangos de distancia peninsular
  for (const rango of RANGOS_DISTANCIA_PENINSULAR) {
    if (distanciaGeodesicaKm <= rango.maxKm) {
      return {
        factor: rango.factor,
        velocidadKmh: rango.velocidadKmh,
        tipoPerfil: rango.id,
      };
    }
  }

  // Fallback por defecto peninsular estándar
  return {
    factor: PERFILES_TORTUOSIDAD.PENINSULAR_ESTANDAR.factor,
    velocidadKmh: PERFILES_TORTUOSIDAD.PENINSULAR_ESTANDAR.velocidadKmh,
    tipoPerfil: PERFILES_TORTUOSIDAD.PENINSULAR_ESTANDAR.id,
  };
}

/**
 * Formatea una duración en segundos a una cadena legible (ej: "7h 25m", "45m", "0m")
 * @param {number} segundos - Total de segundos
 * @returns {string} Duración formateada
 */
export function formatearDuracion(segundos) {
  if (typeof segundos !== 'number' || Number.isNaN(segundos) || segundos <= 0) {
    return '0m';
  }

  const minutosTotales = Math.round(segundos / 60);
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;

  if (horas === 0) {
    return `${minutos}m`;
  }
  return `${horas}h ${minutos.toString().padStart(2, '0')}m`;
}

/**
 * Realiza la estimación vial instantánea (< 1 ms) entre dos puntos aplicando la matriz de tortuosidad
 *
 * @param {object|Array} origen - Coordenadas de origen
 * @param {object|Array} destino - Coordenadas de destino
 * @param {object} [opciones={}] - Opciones de estimación
 * @param {string} [opciones.perfil] - Perfil opcional de PERFILES_TORTUOSIDAD
 * @param {number} [opciones.factorPersonalizado] - Factor explícito opcional
 * @param {number} [opciones.velocidadPersonalizadaKmh] - Velocidad explícita opcional
 * @returns {object} Resultado estructurado con distancias, duraciones y metadatos
 */
export function estimarRutaVial(origen, destino, opciones = {}) {
  const inicioReloj = performance.now();

  const o = validarCoordenada(origen, 'Origen');
  const d = validarCoordenada(destino, 'Destino');

  // Caso identidad: origen y destino idénticos
  if (sonCoordenadasIdenticas(o, d)) {
    const finReloj = performance.now();
    return {
      distanciaGeodesicaKm: 0,
      distanciaEstimadaKm: 0,
      distanciaEstimadaMetros: 0,
      duracionEstimadaSegundos: 0,
      duracionEstimadaMinutos: 0,
      duracionEstimadaHoras: 0,
      duracionFormateada: '0m',
      factorTortuosidad: 1.0,
      velocidadMediaKmh: 0,
      tipoPerfil: 'IDENTICO',
      tiempoCalculoMs: finReloj - inicioReloj,
    };
  }

  // 1. Distancia geodésica mediante Haversine
  const distanciaGeodesicaKm = calcularDistanciaHaversine(o, d, { unidad: 'km' });

  // 2. Resolver factor de tortuosidad y velocidad media según la matriz peninsular
  const { factor, velocidadKmh, tipoPerfil } = resolverFactorYVelocidad(distanciaGeodesicaKm, opciones);

  // 3. Cálculo de distancia vial estimada
  const distanciaEstimadaKm = Number((distanciaGeodesicaKm * factor).toFixed(2));
  const distanciaEstimadaMetros = Math.round(distanciaEstimadaKm * 1000);

  // 4. Cálculo de tiempos de viaje para transporte de mercancías
  const duracionEstimadaHoras = velocidadKmh > 0 ? distanciaEstimadaKm / velocidadKmh : 0;
  const duracionEstimadaSegundos = Math.round(duracionEstimadaHoras * 3600);
  const duracionEstimadaMinutos = Math.round(duracionEstimadaSegundos / 60);
  const duracionFormateada = formatearDuracion(duracionEstimadaSegundos);

  const finReloj = performance.now();
  const tiempoCalculoMs = finReloj - inicioReloj;

  return {
    distanciaGeodesicaKm: Number(distanciaGeodesicaKm.toFixed(2)),
    distanciaEstimadaKm,
    distanciaEstimadaMetros,
    duracionEstimadaSegundos,
    duracionEstimadaMinutos,
    duracionEstimadaHoras: Number(duracionEstimadaHoras.toFixed(2)),
    duracionFormateada,
    factorTortuosidad: factor,
    velocidadMediaKmh: velocidadKmh,
    tipoPerfil,
    tiempoCalculoMs,
  };
}

/**
 * Fachada principal del motor TortuosityEngine
 */
export const TortuosityEngine = Object.freeze({
  estimar: estimarRutaVial,
  previsualizar: estimarRutaVial,
  resolverFactorYVelocidad,
  formatearDuracion,
  PERFILES: PERFILES_TORTUOSIDAD,
  RANGOS: RANGOS_DISTANCIA_PENINSULAR,
});
