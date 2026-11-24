/**
 * Módulo de Estimación Vial Instantánea y Factores de Tortuosidad Peninsular (TortuosityEngine)
 * Componente: M01-Rutas | Tarea: TTTRUCKS-41 (Subtarea 3 de TTTRUCKS-38)
 *
 * Aplica la matriz de factores de tortuosidad vial (relación entre distancia por carretera y distancia
 * ortodrómica) y perfiles de velocidad comercial para transporte pesado (3T) en la Península Ibérica,
 * resolviendo previsualizaciones de distancia y tiempo en menos de 1 ms (< 1 ms), con soporte robusto
 * para casos límite: coordenadas idénticas, distancias nulas, y puntos insulares o sin conexión terrestre.
 */

import {
  calcularDistanciaHaversine,
  validarCoordenada,
  sonCoordenadasIdenticas,
} from './haversine.js';

/**
 * Catálogo de Zonas Geográficas para control territorial y detección insular
 */
export const ZONAS_GEOGRAFICAS = Object.freeze({
  PENINSULA: 'PENINSULA',
  BALEARES: 'BALEARES',
  CANARIAS: 'CANARIAS',
  CEUTA: 'CEUTA',
  MELILLA: 'MELILLA',
  EXTERIOR: 'EXTERIOR',
});

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
  INSULAR_LOCAL: Object.freeze({
    id: 'INSULAR_LOCAL',
    nombre: 'Red insular local (misma isla)',
    factor: 1.35,
    velocidadKmh: 60,
    descripcion: 'Itinerarios terrestres internos dentro de una misma isla por carreteras secundarias.',
  }),
  INSULAR_INTERMODAL: Object.freeze({
    id: 'INSULAR_INTERMODAL',
    nombre: 'Conexión marítima / intermodal (Ferry / Ro-Ro)',
    factor: 1.15,
    velocidadKmh: 35,
    descripcion: 'Tránsito marítimo intermodal en buque de carga rodada / ferry (~19 nudos).',
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
 * Identifica la zona geográfica española de una coordenada dada para detección insular
 * @param {object|Array} coord - Coordenada { lat, lon }
 * @returns {{ zona: string, subzona: string|null }} Zona y subzona identificada
 */
export function identificarZonaGeografica(coord) {
  const c = validarCoordenada(coord, 'Coordenada de zona');
  const { lat, lon } = c;

  // 1. Islas Canarias (Archipiélago atlántico)
  if (lat >= 27.5 && lat <= 29.5 && lon >= -18.3 && lon <= -13.3) {
    let subzona = 'CANARIAS_GENERAL';
    if (lat >= 27.9 && lat <= 28.6 && lon >= -16.95 && lon <= -16.1) subzona = 'TENERIFE';
    else if (lat >= 27.7 && lat <= 28.25 && lon >= -15.9 && lon <= -15.35) subzona = 'GRAN_CANARIA';
    else if (lat >= 28.8 && lat <= 29.35 && lon >= -13.9 && lon <= -13.35) subzona = 'LANZAROTE';
    else if (lat >= 28.0 && lat <= 28.78 && lon >= -14.6 && lon <= -13.8) subzona = 'FUERTEVENTURA';
    else if (lat >= 28.45 && lat <= 28.88 && lon >= -18.02 && lon <= -17.7) subzona = 'LA_PALMA';
    else if (lat >= 28.0 && lat <= 28.25 && lon >= -17.38 && lon <= -17.08) subzona = 'LA_GOMERA';
    else if (lat >= 27.62 && lat <= 27.87 && lon >= -18.18 && lon <= -17.88) subzona = 'EL_HIERRO';

    return { zona: ZONAS_GEOGRAFICAS.CANARIAS, subzona };
  }

  // 2. Islas Baleares (Archipiélago mediterráneo)
  if (lat >= 38.5 && lat <= 40.2 && lon >= 1.1 && lon <= 4.5) {
    let subzona = 'BALEARES_GENERAL';
    if (lat >= 39.25 && lat <= 40.0 && lon >= 2.3 && lon <= 3.55) subzona = 'MALLORCA';
    else if (lat >= 39.8 && lat <= 40.12 && lon >= 3.75 && lon <= 4.35) subzona = 'MENORCA';
    else if (lat >= 38.6 && lat <= 39.15 && lon >= 1.2 && lon <= 1.65) subzona = 'IBIZA_FORMENTERA';

    return { zona: ZONAS_GEOGRAFICAS.BALEARES, subzona };
  }

  // 3. Ciudades Autónomas en el norte de África
  if (lat >= 35.86 && lat <= 35.92 && lon >= -5.36 && lon <= -5.27) {
    return { zona: ZONAS_GEOGRAFICAS.CEUTA, subzona: 'CEUTA' };
  }
  if (lat >= 35.26 && lat <= 35.32 && lon >= -2.97 && lon <= -2.91) {
    return { zona: ZONAS_GEOGRAFICAS.MELILLA, subzona: 'MELILLA' };
  }

  // 4. Península Ibérica (España y Portugal continental)
  if (lat >= 35.9 && lat <= 43.85 && lon >= -9.35 && lon <= 3.35) {
    return { zona: ZONAS_GEOGRAFICAS.PENINSULA, subzona: 'PENINSULA' };
  }

  return { zona: ZONAS_GEOGRAFICAS.EXTERIOR, subzona: null };
}

/**
 * Evalúa si existe conexión terrestre directa entre dos coordenadas o si requiere transporte marítimo (Ferry)
 * @param {object|Array} origen - Punto de origen
 * @param {object|Array} destino - Punto de destino
 * @returns {{ conexionTerrestreDirecta: boolean, requiereFerry: boolean, zonaOrigen: string, subzonaOrigen: string|null, zonaDestino: string, subzonaDestino: string|null, aviso: string|null }}
 */
export function evaluarConexionTerrestre(origen, destino) {
  const zo = identificarZonaGeografica(origen);
  const zd = identificarZonaGeografica(destino);

  // Mismo territorio continental peninsular: conexión terrestre continua
  if (zo.zona === ZONAS_GEOGRAFICAS.PENINSULA && zd.zona === ZONAS_GEOGRAFICAS.PENINSULA) {
    return {
      conexionTerrestreDirecta: true,
      requiereFerry: false,
      zonaOrigen: zo.zona,
      subzonaOrigen: zo.subzona,
      zonaDestino: zd.zona,
      subzonaDestino: zd.subzona,
      aviso: null,
    };
  }

  // Trayecto interno en la misma isla (ej: dentro de Mallorca o dentro de Tenerife)
  if (
    zo.zona === zd.zona &&
    zo.subzona &&
    zd.subzona &&
    zo.subzona === zd.subzona &&
    (zo.zona === ZONAS_GEOGRAFICAS.BALEARES || zo.zona === ZONAS_GEOGRAFICAS.CANARIAS)
  ) {
    return {
      conexionTerrestreDirecta: true,
      requiereFerry: false,
      zonaOrigen: zo.zona,
      subzonaOrigen: zo.subzona,
      zonaDestino: zd.zona,
      subzonaDestino: zd.subzona,
      aviso: null,
    };
  }

  // Rutas internas en Ceuta o Melilla
  if ((zo.zona === ZONAS_GEOGRAFICAS.CEUTA && zd.zona === ZONAS_GEOGRAFICAS.CEUTA) ||
      (zo.zona === ZONAS_GEOGRAFICAS.MELILLA && zd.zona === ZONAS_GEOGRAFICAS.MELILLA)) {
    return {
      conexionTerrestreDirecta: true,
      requiereFerry: false,
      zonaOrigen: zo.zona,
      subzonaOrigen: zo.subzona,
      zonaDestino: zd.zona,
      subzonaDestino: zd.subzona,
      aviso: null,
    };
  }

  // Trayecto interinsular o península-isla/África: requiere ferry
  let aviso = 'Ruta con origen o destino insular/marítimo: requiere transporte marítimo (ferry / Ro-Ro).';
  if (zo.zona === ZONAS_GEOGRAFICAS.BALEARES && zd.zona === ZONAS_GEOGRAFICAS.BALEARES) {
    aviso = 'Conexión interinsular en Baleares: requiere transporte marítimo en ferry.';
  } else if (zo.zona === ZONAS_GEOGRAFICAS.CANARIAS && zd.zona === ZONAS_GEOGRAFICAS.CANARIAS) {
    aviso = 'Conexión interinsular en Canarias: requiere transporte marítimo en ferry.';
  } else if (zd.zona === ZONAS_GEOGRAFICAS.CEUTA || zd.zona === ZONAS_GEOGRAFICAS.MELILLA ||
             zo.zona === ZONAS_GEOGRAFICAS.CEUTA || zo.zona === ZONAS_GEOGRAFICAS.MELILLA) {
    aviso = 'Conexión con Ciudad Autónoma en norte de África: cruce del Estrecho en ferry.';
  }

  return {
    conexionTerrestreDirecta: false,
    requiereFerry: true,
    zonaOrigen: zo.zona,
    subzonaOrigen: zo.subzona,
    zonaDestino: zd.zona,
    subzonaDestino: zd.subzona,
    aviso,
  };
}

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
 * y controlando de forma exhaustiva casos límite: coordenadas idénticas, distancias nulas y territorio insular.
 *
 * @param {object|Array} origen - Coordenadas de origen
 * @param {object|Array} destino - Coordenadas de destino
 * @param {object} [opciones={}] - Opciones de estimación
 * @param {string} [opciones.perfil] - Perfil opcional de PERFILES_TORTUOSIDAD
 * @param {number} [opciones.factorPersonalizado] - Factor explícito opcional
 * @param {number} [opciones.velocidadPersonalizadaKmh] - Velocidad explícita opcional
 * @returns {object} Resultado estructurado con distancias, duraciones, indicadores insulares y metadatos
 */
export function estimarRutaVial(origen, destino, opciones = {}) {
  const inicioReloj = performance.now();

  const o = validarCoordenada(origen, 'Origen');
  const d = validarCoordenada(destino, 'Destino');

  // Evaluación territorial y conectividad terrestre
  const evaluacionConexion = evaluarConexionTerrestre(o, d);

  // Caso identidad: origen y destino idénticos (distancia nula)
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
      conexionTerrestreDirecta: true,
      requiereFerry: false,
      zonaOrigen: evaluacionConexion.zonaOrigen,
      subzonaOrigen: evaluacionConexion.subzonaOrigen,
      zonaDestino: evaluacionConexion.zonaDestino,
      subzonaDestino: evaluacionConexion.subzonaDestino,
      esDistanciaNula: true,
      aviso: null,
      tiempoCalculoMs: finReloj - inicioReloj,
    };
  }

  // 1. Distancia geodésica mediante Haversine
  const distanciaGeodesicaKm = calcularDistanciaHaversine(o, d, { unidad: 'km' });

  // 2. Determinar perfil, factor de tortuosidad y velocidad según territorio y opciones
  let factor;
  let velocidadKmh;
  let tipoPerfil;

  if (opciones.perfil && PERFILES_TORTUOSIDAD[opciones.perfil]) {
    // Si se especifica un perfil manual explícito
    const p = PERFILES_TORTUOSIDAD[opciones.perfil];
    factor = p.factor;
    velocidadKmh = p.velocidadKmh;
    tipoPerfil = p.id;
  } else if (!evaluacionConexion.conexionTerrestreDirecta) {
    // Caso límite insular / marítimo sin conexión terrestre directa
    const p = PERFILES_TORTUOSIDAD.INSULAR_INTERMODAL;
    factor = p.factor;
    velocidadKmh = p.velocidadKmh;
    tipoPerfil = p.id;
  } else if (
    evaluacionConexion.zonaOrigen === ZONAS_GEOGRAFICAS.BALEARES ||
    evaluacionConexion.zonaOrigen === ZONAS_GEOGRAFICAS.CANARIAS
  ) {
    // Trayecto terrestre dentro de la misma isla
    const p = PERFILES_TORTUOSIDAD.INSULAR_LOCAL;
    factor = p.factor;
    velocidadKmh = p.velocidadKmh;
    tipoPerfil = p.id;
  } else {
    // Trayecto peninsular estándar o corredor
    const res = resolverFactorYVelocidad(distanciaGeodesicaKm, opciones);
    factor = res.factor;
    velocidadKmh = res.velocidadKmh;
    tipoPerfil = res.tipoPerfil;
  }

  // 3. Cálculo de distancia vial estimada
  const distanciaEstimadaKm = Number((distanciaGeodesicaKm * factor).toFixed(2));
  const distanciaEstimadaMetros = Math.round(distanciaEstimadaKm * 1000);

  // 4. Cálculo de tiempos de viaje
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
    conexionTerrestreDirecta: evaluacionConexion.conexionTerrestreDirecta,
    requiereFerry: evaluacionConexion.requiereFerry,
    zonaOrigen: evaluacionConexion.zonaOrigen,
    subzonaOrigen: evaluacionConexion.subzonaOrigen,
    zonaDestino: evaluacionConexion.zonaDestino,
    subzonaDestino: evaluacionConexion.subzonaDestino,
    esDistanciaNula: false,
    aviso: evaluacionConexion.aviso,
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
  identificarZonaGeografica,
  evaluarConexionTerrestre,
  ZONAS: ZONAS_GEOGRAFICAS,
  PERFILES: PERFILES_TORTUOSIDAD,
  RANGOS: RANGOS_DISTANCIA_PENINSULAR,
});
