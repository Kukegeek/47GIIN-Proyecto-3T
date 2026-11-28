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
    factor: 1.03,
    velocidadKmh: 35,
    descripcion: 'Tránsito marítimo intermodal casi rectilíneo en buque Ro-Ro / ferry (~19 nudos, +3% aproximación portuaria).',
  }),
});

export const FACTOR_TORTUOSIDAD_MARITIMO = 1.03;

/**
 * Catálogo congelado de puertos comerciales españoles con tráfico Ro-Ro / Ferry
 */
export const PUERTOS_FERRY_ESPANA = Object.freeze({
  // Península
  BARCELONA: Object.freeze({ id: 'BARCELONA', nombre: 'Puerto de Barcelona', lat: 41.3536, lon: 2.1674, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  VALENCIA: Object.freeze({ id: 'VALENCIA', nombre: 'Puerto de Valencia', lat: 39.4465, lon: -0.3204, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  DENIA: Object.freeze({ id: 'DENIA', nombre: 'Puerto de Dénia', lat: 38.8427, lon: 0.1147, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  ALGECIRAS: Object.freeze({ id: 'ALGECIRAS', nombre: 'Puerto de Algeciras', lat: 36.1260, lon: -5.4366, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  TARIFA: Object.freeze({ id: 'TARIFA', nombre: 'Puerto de Tarifa', lat: 36.0117, lon: -5.6033, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  MALAGA: Object.freeze({ id: 'MALAGA', nombre: 'Puerto de Málaga', lat: 36.7118, lon: -4.4170, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  MOTRIL: Object.freeze({ id: 'MOTRIL', nombre: 'Puerto de Motril', lat: 36.7219, lon: -3.5256, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  ALMERIA: Object.freeze({ id: 'ALMERIA', nombre: 'Puerto de Almería', lat: 36.8323, lon: -2.4638, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  CADIZ: Object.freeze({ id: 'CADIZ', nombre: 'Puerto de Cádiz', lat: 36.5350, lon: -6.2830, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  HUELVA: Object.freeze({ id: 'HUELVA', nombre: 'Puerto de Huelva', lat: 37.1636, lon: -6.9061, zona: 'PENINSULA', subzona: 'PENINSULA' }),
  // Baleares
  PALMA: Object.freeze({ id: 'PALMA', nombre: 'Puerto de Palma', lat: 39.5535, lon: 2.6258, zona: 'BALEARES', subzona: 'MALLORCA' }),
  ALCUDIA: Object.freeze({ id: 'ALCUDIA', nombre: 'Puerto de Alcúdia', lat: 39.8358, lon: 3.1333, zona: 'BALEARES', subzona: 'MALLORCA' }),
  MAHON: Object.freeze({ id: 'MAHON', nombre: 'Puerto de Mahón', lat: 39.8861, lon: 4.2673, zona: 'BALEARES', subzona: 'MENORCA' }),
  CIUTADELLA: Object.freeze({ id: 'CIUTADELLA', nombre: 'Puerto de Ciutadella', lat: 39.9972, lon: 3.8294, zona: 'BALEARES', subzona: 'MENORCA' }),
  IBIZA: Object.freeze({ id: 'IBIZA', nombre: 'Puerto de Ibiza', lat: 38.9094, lon: 1.4417, zona: 'BALEARES', subzona: 'IBIZA_FORMENTERA' }),
  // Canarias
  SC_TENERIFE: Object.freeze({ id: 'SC_TENERIFE', nombre: 'Puerto de S/C de Tenerife', lat: 28.4728, lon: -16.2414, zona: 'CANARIAS', subzona: 'TENERIFE' }),
  LOS_CRISTIANOS: Object.freeze({ id: 'LOS_CRISTIANOS', nombre: 'Puerto de Los Cristianos', lat: 28.0493, lon: -16.7186, zona: 'CANARIAS', subzona: 'TENERIFE' }),
  LAS_PALMAS: Object.freeze({ id: 'LAS_PALMAS', nombre: 'Puerto de La Luz (Las Palmas)', lat: 28.1445, lon: -15.4150, zona: 'CANARIAS', subzona: 'GRAN_CANARIA' }),
  AGAETE: Object.freeze({ id: 'AGAETE', nombre: 'Puerto de Las Nieves (Agaete)', lat: 28.1003, lon: -15.7107, zona: 'CANARIAS', subzona: 'GRAN_CANARIA' }),
  ARRECIFE: Object.freeze({ id: 'ARRECIFE', nombre: 'Puerto de Arrecife', lat: 28.9675, lon: -13.5322, zona: 'CANARIAS', subzona: 'LANZAROTE' }),
  PLAYA_BLANCA: Object.freeze({ id: 'PLAYA_BLANCA', nombre: 'Puerto de Playa Blanca', lat: 28.8591, lon: -13.8290, zona: 'CANARIAS', subzona: 'LANZAROTE' }),
  PUERTO_ROSARIO: Object.freeze({ id: 'PUERTO_ROSARIO', nombre: 'Puerto del Rosario', lat: 28.4975, lon: -13.8548, zona: 'CANARIAS', subzona: 'FUERTEVENTURA' }),
  CORRALEJO: Object.freeze({ id: 'CORRALEJO', nombre: 'Puerto de Corralejo', lat: 28.7385, lon: -13.8669, zona: 'CANARIAS', subzona: 'FUERTEVENTURA' }),
  SC_LA_PALMA: Object.freeze({ id: 'SC_LA_PALMA', nombre: 'Puerto de S/C de La Palma', lat: 28.6808, lon: -17.7628, zona: 'CANARIAS', subzona: 'LA_PALMA' }),
  SAN_SEBASTIAN_GOMERA: Object.freeze({ id: 'SAN_SEBASTIAN_GOMERA', nombre: 'Puerto de S. Sebastián (La Gomera)', lat: 28.0894, lon: -17.1088, zona: 'CANARIAS', subzona: 'LA_GOMERA' }),
  LA_ESTACA: Object.freeze({ id: 'LA_ESTACA', nombre: 'Puerto de La Estaca (El Hierro)', lat: 27.7836, lon: -17.9012, zona: 'CANARIAS', subzona: 'EL_HIERRO' }),
  // Ciudades Autónomas
  CEUTA: Object.freeze({ id: 'CEUTA', nombre: 'Puerto de Ceuta', lat: 35.8919, lon: -5.3114, zona: 'CEUTA', subzona: 'CEUTA' }),
  MELILLA: Object.freeze({ id: 'MELILLA', nombre: 'Puerto de Melilla', lat: 35.2913, lon: -2.9310, zona: 'MELILLA', subzona: 'MELILLA' }),
});

const PUERTOS_POR_SUBZONA = Object.freeze({
  MALLORCA: [PUERTOS_FERRY_ESPANA.PALMA, PUERTOS_FERRY_ESPANA.ALCUDIA],
  MENORCA: [PUERTOS_FERRY_ESPANA.MAHON, PUERTOS_FERRY_ESPANA.CIUTADELLA],
  IBIZA_FORMENTERA: [PUERTOS_FERRY_ESPANA.IBIZA],
  BALEARES_GENERAL: [PUERTOS_FERRY_ESPANA.PALMA, PUERTOS_FERRY_ESPANA.IBIZA, PUERTOS_FERRY_ESPANA.MAHON],
  TENERIFE: [PUERTOS_FERRY_ESPANA.SC_TENERIFE, PUERTOS_FERRY_ESPANA.LOS_CRISTIANOS],
  GRAN_CANARIA: [PUERTOS_FERRY_ESPANA.LAS_PALMAS, PUERTOS_FERRY_ESPANA.AGAETE],
  LANZAROTE: [PUERTOS_FERRY_ESPANA.ARRECIFE, PUERTOS_FERRY_ESPANA.PLAYA_BLANCA],
  FUERTEVENTURA: [PUERTOS_FERRY_ESPANA.PUERTO_ROSARIO, PUERTOS_FERRY_ESPANA.CORRALEJO],
  LA_PALMA: [PUERTOS_FERRY_ESPANA.SC_LA_PALMA],
  LA_GOMERA: [PUERTOS_FERRY_ESPANA.SAN_SEBASTIAN_GOMERA],
  EL_HIERRO: [PUERTOS_FERRY_ESPANA.LA_ESTACA],
  CANARIAS_GENERAL: [PUERTOS_FERRY_ESPANA.SC_TENERIFE, PUERTOS_FERRY_ESPANA.LAS_PALMAS],
  CEUTA: [PUERTOS_FERRY_ESPANA.CEUTA],
  MELILLA: [PUERTOS_FERRY_ESPANA.MELILLA],
});

const PUERTOS_PENINSULA_POR_DESTINO = Object.freeze({
  BALEARES: [PUERTOS_FERRY_ESPANA.BARCELONA, PUERTOS_FERRY_ESPANA.VALENCIA, PUERTOS_FERRY_ESPANA.DENIA],
  CANARIAS: [PUERTOS_FERRY_ESPANA.CADIZ, PUERTOS_FERRY_ESPANA.HUELVA],
  CEUTA: [PUERTOS_FERRY_ESPANA.ALGECIRAS],
  MELILLA: [PUERTOS_FERRY_ESPANA.MALAGA, PUERTOS_FERRY_ESPANA.MOTRIL, PUERTOS_FERRY_ESPANA.ALMERIA],
});

/**
 * Líneas marítimas Ro-Ro reales en España (bidireccionales) para validar qué puerto de salida
 * conecta realmente con cada puerto de destino según el corredor marítimo.
 */
const CONEXIONES_MARITIMAS_RO_RO = Object.freeze({
  // Península -> Baleares
  BARCELONA: new Set(['PALMA', 'ALCUDIA', 'MAHON', 'CIUTADELLA', 'IBIZA']),
  VALENCIA: new Set(['PALMA', 'IBIZA', 'MAHON']),
  DENIA: new Set(['IBIZA', 'PALMA']),
  // Península -> Ceuta / Melilla
  ALGECIRAS: new Set(['CEUTA']),
  MALAGA: new Set(['MELILLA']),
  MOTRIL: new Set(['MELILLA']),
  ALMERIA: new Set(['MELILLA']),
  // Península -> Canarias (solo puertos capitalinos de interés general)
  CADIZ: new Set(['SC_TENERIFE', 'LAS_PALMAS', 'ARRECIFE', 'PUERTO_ROSARIO', 'SC_LA_PALMA']),
  HUELVA: new Set(['SC_TENERIFE', 'LAS_PALMAS', 'ARRECIFE']),
  // Baleares (Retorno a Península e interinsular)
  PALMA: new Set(['BARCELONA', 'VALENCIA', 'DENIA', 'IBIZA', 'MAHON']),
  ALCUDIA: new Set(['BARCELONA', 'CIUTADELLA']),
  MAHON: new Set(['BARCELONA', 'VALENCIA', 'PALMA']),
  CIUTADELLA: new Set(['BARCELONA', 'ALCUDIA']),
  IBIZA: new Set(['BARCELONA', 'VALENCIA', 'DENIA', 'PALMA']),
  // Canarias (Retorno a Península e interinsular)
  SC_TENERIFE: new Set(['CADIZ', 'HUELVA', 'LAS_PALMAS', 'AGAETE', 'SC_LA_PALMA', 'ARRECIFE', 'PUERTO_ROSARIO']),
  LOS_CRISTIANOS: new Set(['SAN_SEBASTIAN_GOMERA', 'LA_ESTACA', 'SC_LA_PALMA']),
  LAS_PALMAS: new Set(['CADIZ', 'HUELVA', 'SC_TENERIFE', 'ARRECIFE', 'PUERTO_ROSARIO', 'SC_LA_PALMA']),
  AGAETE: new Set(['SC_TENERIFE']),
  ARRECIFE: new Set(['CADIZ', 'HUELVA', 'LAS_PALMAS', 'SC_TENERIFE', 'PUERTO_ROSARIO']),
  PLAYA_BLANCA: new Set(['CORRALEJO']),
  PUERTO_ROSARIO: new Set(['CADIZ', 'LAS_PALMAS', 'SC_TENERIFE', 'ARRECIFE']),
  CORRALEJO: new Set(['PLAYA_BLANCA']),
  SC_LA_PALMA: new Set(['CADIZ', 'SC_TENERIFE', 'LOS_CRISTIANOS', 'LAS_PALMAS', 'SAN_SEBASTIAN_GOMERA']),
  SAN_SEBASTIAN_GOMERA: new Set(['LOS_CRISTIANOS', 'SC_LA_PALMA', 'LA_ESTACA']),
  LA_ESTACA: new Set(['LOS_CRISTIANOS', 'SAN_SEBASTIAN_GOMERA']),
  // Ciudades Autónomas retorno
  CEUTA: new Set(['ALGECIRAS']),
  MELILLA: new Set(['MALAGA', 'MOTRIL', 'ALMERIA']),
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
 * Calcula un tramo terrestre independiente aplicando la matriz de tortuosidad desde cero (reiniciando el ratio).
 * @param {number} geodesicaKm - Distancia ortodrómica del tramo
 * @returns {{ geodesicaKm: number, factorTortuosidad: number, velocidadMediaKmh: number, tipoPerfil: string, distanciaKm: number, duracionSegundos: number, duracionFormateada: string }}
 */
function calcularTramoTerrestreIndependiente(geodesicaKm) {
  if (geodesicaKm <= 0.05) {
    return {
      geodesicaKm: 0,
      factorTortuosidad: 1.0,
      velocidadMediaKmh: 0,
      tipoPerfil: 'EN_PUERTO',
      distanciaKm: 0,
      duracionSegundos: 0,
      duracionFormateada: '0m',
    };
  }

  const { factor, velocidadKmh, tipoPerfil } = resolverFactorYVelocidad(geodesicaKm);
  const distanciaKm = Number((geodesicaKm * factor).toFixed(2));
  const duracionSegundos = Math.round((distanciaKm / velocidadKmh) * 3600);

  return {
    geodesicaKm: Number(geodesicaKm.toFixed(2)),
    factorTortuosidad: factor,
    velocidadMediaKmh: velocidadKmh,
    tipoPerfil,
    distanciaKm,
    duracionSegundos,
    duracionFormateada: formatearDuracion(duracionSegundos),
  };
}

/**
 * Devuelve las listas de puertos de origen y destino candidatos para una ruta intermodal española
 */
function obtenerPuertosCandidatos(zo, zd) {
  if (zo.zona === ZONAS_GEOGRAFICAS.PENINSULA) {
    const puertosOrigen = PUERTOS_PENINSULA_POR_DESTINO[zd.zona];
    const puertosDestino = PUERTOS_POR_SUBZONA[zd.subzona] || PUERTOS_POR_SUBZONA[`${zd.zona}_GENERAL`];
    if (puertosOrigen && puertosDestino) return [puertosOrigen, puertosDestino];
  }

  if (zd.zona === ZONAS_GEOGRAFICAS.PENINSULA) {
    const puertosOrigen = PUERTOS_POR_SUBZONA[zo.subzona] || PUERTOS_POR_SUBZONA[`${zo.zona}_GENERAL`];
    const puertosDestino = PUERTOS_PENINSULA_POR_DESTINO[zo.zona];
    if (puertosOrigen && puertosDestino) return [puertosOrigen, puertosDestino];
  }

  const puertosOrigen = PUERTOS_POR_SUBZONA[zo.subzona] || PUERTOS_POR_SUBZONA[`${zo.zona}_GENERAL`];
  const puertosDestino = PUERTOS_POR_SUBZONA[zd.subzona] || PUERTOS_POR_SUBZONA[`${zd.zona}_GENERAL`];
  if (puertosOrigen && puertosDestino) {
    return [puertosOrigen, puertosDestino];
  }

  return null;
}

/**
 * Resuelve el cálculo intermodal en 3 tramos independientes:
 *   1) Terrestre en origen (origen -> puerto de embarque) con su propio ratio por distancia
 *   2) Marítimo en ferry (puerto origen -> puerto destino) con factor casi rectilíneo (1.03)
 *   3) Terrestre en destino (puerto desembarque -> destino) reiniciando el ratio desde cero
 */
function calcularRutaIntermodal(o, d, evaluacionConexion, inicioReloj) {
  const { zonaOrigen, subzonaOrigen, zonaDestino, subzonaDestino } = evaluacionConexion;
  const distanciaGeodesicaTotalKm = calcularDistanciaHaversine(o, d, { unidad: 'km' });
  const candidatos = obtenerPuertosCandidatos(
    { zona: zonaOrigen, subzona: subzonaOrigen },
    { zona: zonaDestino, subzona: subzonaDestino }
  );

  // Fallback si alguno de los puntos pertenece a EXTERIOR fuera de puertos españoles catalogados
  if (!candidatos) {
    const factorMar = PERFILES_TORTUOSIDAD.INSULAR_INTERMODAL.factor;
    const velMar = PERFILES_TORTUOSIDAD.INSULAR_INTERMODAL.velocidadKmh;
    const distanciaMaritimaKm = Number((distanciaGeodesicaTotalKm * factorMar).toFixed(2));
    const duracionMaritimaSegundos = Math.round((distanciaMaritimaKm / velMar) * 3600);
    const finReloj = performance.now();

    return {
      distanciaGeodesicaKm: Number(distanciaGeodesicaTotalKm.toFixed(2)),
      distanciaTerrestreKm: 0,
      distanciaMaritimaKm,
      distanciaEstimadaKm: distanciaMaritimaKm,
      distanciaEstimadaMetros: Math.round(distanciaMaritimaKm * 1000),
      duracionTerrestreSegundos: 0,
      duracionMaritimaSegundos,
      duracionEstimadaSegundos: duracionMaritimaSegundos,
      duracionEstimadaMinutos: Math.round(duracionMaritimaSegundos / 60),
      duracionEstimadaHoras: Number((duracionMaritimaSegundos / 3600).toFixed(2)),
      duracionFormateada: formatearDuracion(duracionMaritimaSegundos),
      factorTortuosidad: factorMar,
      velocidadMediaKmh: velMar,
      tipoPerfil: PERFILES_TORTUOSIDAD.INSULAR_INTERMODAL.id,
      conexionTerrestreDirecta: false,
      requiereFerry: true,
      zonaOrigen,
      subzonaOrigen,
      zonaDestino,
      subzonaDestino,
      esDistanciaNula: false,
      aviso: evaluacionConexion.aviso,
      desgloseTramos: null,
      tiempoCalculoMs: finReloj - inicioReloj,
    };
  }

  const [puertosOrigen, puertosDestino] = candidatos;
  const factorMar = FACTOR_TORTUOSIDAD_MARITIMO;
  const velMar = PERFILES_TORTUOSIDAD.INSULAR_INTERMODAL.velocidadKmh;

  // Seleccionar el par de puertos conectado por línea Ro-Ro real que minimiza el tiempo total del viaje
  let mejorPar = null;
  let mejorScoreSeg = Infinity;

  // Paso 1: Evaluar exclusivamente líneas marítimas reales conectadas entre sí
  for (let i = 0; i < puertosOrigen.length; i++) {
    const p1 = puertosOrigen[i];
    const destinosPermitidos = CONEXIONES_MARITIMAS_RO_RO[p1.id];
    const d1 = calcularDistanciaHaversine(o, p1, { unidad: 'km' });
    const t1Est = d1 <= 0.05 ? 0 : (d1 * 1.25) / 75;

    for (let j = 0; j < puertosDestino.length; j++) {
      const p2 = puertosDestino[j];
      if (destinosPermitidos && !destinosPermitidos.has(p2.id)) continue;

      const dMar = calcularDistanciaHaversine(p1, p2, { unidad: 'km' });
      const d2 = calcularDistanciaHaversine(p2, d, { unidad: 'km' });
      const tMarEst = (dMar * factorMar) / velMar;
      const t2Est = d2 <= 0.05 ? 0 : (d2 * 1.25) / 75;
      const score = t1Est + tMarEst + t2Est;

      if (score < mejorScoreSeg) {
        mejorScoreSeg = score;
        mejorPar = { p1, p2, d1, dMar, d2 };
      }
    }
  }

  // Paso 2 (fallback para pares transversales sin línea directa, ej. Baleares <-> Canarias o Península <-> La Gomera)
  if (!mejorPar) {
    for (let i = 0; i < puertosOrigen.length; i++) {
      const p1 = puertosOrigen[i];
      const d1 = calcularDistanciaHaversine(o, p1, { unidad: 'km' });
      const t1Est = d1 <= 0.05 ? 0 : (d1 * 1.25) / 75;

      for (let j = 0; j < puertosDestino.length; j++) {
        const p2 = puertosDestino[j];
        const dMar = calcularDistanciaHaversine(p1, p2, { unidad: 'km' });
        const d2 = calcularDistanciaHaversine(p2, d, { unidad: 'km' });
        const score = t1Est + (dMar * factorMar) / velMar + (d2 <= 0.05 ? 0 : (d2 * 1.25) / 75);

        if (score < mejorScoreSeg) {
          mejorScoreSeg = score;
          mejorPar = { p1, p2, d1, dMar, d2 };
        }
      }
    }
  }

  // Tramo 1: Terrestre en origen (con su propio ratio según d1)
  const tramo1 = calcularTramoTerrestreIndependiente(mejorPar.d1);

  // Tramo 2: Marítimo en ferry (ratio casi recto 1.03)
  const distanciaMaritimaKm = Number((mejorPar.dMar * factorMar).toFixed(2));
  const duracionMaritimaSegundos = Math.round((distanciaMaritimaKm / velMar) * 3600);
  const tramo2 = {
    puertoOrigen: mejorPar.p1.nombre,
    puertoDestino: mejorPar.p2.nombre,
    geodesicaKm: Number(mejorPar.dMar.toFixed(2)),
    factorTortuosidad: factorMar,
    velocidadMediaKmh: velMar,
    tipoPerfil: PERFILES_TORTUOSIDAD.INSULAR_INTERMODAL.id,
    distanciaKm: distanciaMaritimaKm,
    duracionSegundos: duracionMaritimaSegundos,
    duracionFormateada: formatearDuracion(duracionMaritimaSegundos),
  };

  // Tramo 3: Terrestre en destino (reiniciando el ratio de tortuosidad desde cero según d2)
  const tramo3 = calcularTramoTerrestreIndependiente(mejorPar.d2);

  // Totales agregados: Parte Terrestre + Parte Marítima = Total Ruta
  const distanciaTerrestreKm = Number((tramo1.distanciaKm + tramo3.distanciaKm).toFixed(2));
  const distanciaEstimadaKm = Number((distanciaTerrestreKm + distanciaMaritimaKm).toFixed(2));
  const duracionTerrestreSegundos = tramo1.duracionSegundos + tramo3.duracionSegundos;
  const duracionEstimadaSegundos = duracionTerrestreSegundos + duracionMaritimaSegundos;
  const duracionEstimadaHoras = duracionEstimadaSegundos / 3600;
  const factorEfectivo = distanciaGeodesicaTotalKm > 0
    ? Number((distanciaEstimadaKm / distanciaGeodesicaTotalKm).toFixed(2))
    : factorMar;
  const velocidadEfectivaKmh = duracionEstimadaHoras > 0
    ? Math.round(distanciaEstimadaKm / duracionEstimadaHoras)
    : velMar;

  const finReloj = performance.now();

  return {
    distanciaGeodesicaKm: Number(distanciaGeodesicaTotalKm.toFixed(2)),
    distanciaTerrestreKm,
    distanciaMaritimaKm,
    distanciaEstimadaKm,
    distanciaEstimadaMetros: Math.round(distanciaEstimadaKm * 1000),
    duracionTerrestreSegundos,
    duracionMaritimaSegundos,
    duracionEstimadaSegundos,
    duracionEstimadaMinutos: Math.round(duracionEstimadaSegundos / 60),
    duracionEstimadaHoras: Number(duracionEstimadaHoras.toFixed(2)),
    duracionFormateada: formatearDuracion(duracionEstimadaSegundos),
    factorTortuosidad: factorEfectivo,
    velocidadMediaKmh: velocidadEfectivaKmh,
    tipoPerfil: PERFILES_TORTUOSIDAD.INSULAR_INTERMODAL.id,
    conexionTerrestreDirecta: false,
    requiereFerry: true,
    zonaOrigen,
    subzonaOrigen,
    zonaDestino,
    subzonaDestino,
    esDistanciaNula: false,
    aviso: evaluacionConexion.aviso,
    desgloseTramos: {
      terrestreOrigen: {
        puerto: mejorPar.p1.nombre,
        ...tramo1,
      },
      maritimo: tramo2,
      terrestreDestino: {
        puerto: mejorPar.p2.nombre,
        ...tramo3,
      },
      resumen: {
        terrestreKm: distanciaTerrestreKm,
        maritimaKm: distanciaMaritimaKm,
        totalKm: distanciaEstimadaKm,
        duracionTerrestre: formatearDuracion(duracionTerrestreSegundos),
        duracionMaritima: formatearDuracion(duracionMaritimaSegundos),
        duracionTotal: formatearDuracion(duracionEstimadaSegundos),
      },
    },
    tiempoCalculoMs: finReloj - inicioReloj,
  };
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
      distanciaTerrestreKm: 0,
      distanciaMaritimaKm: 0,
      distanciaEstimadaKm: 0,
      distanciaEstimadaMetros: 0,
      duracionTerrestreSegundos: 0,
      duracionMaritimaSegundos: 0,
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
      desgloseTramos: null,
      tiempoCalculoMs: finReloj - inicioReloj,
    };
  }

  // Ruta intermodal sin conexión terrestre directa (3 tramos: terrestre origen + ferry marítimo + terrestre destino)
  const tieneOverrideManual = Boolean(
    (opciones.perfil && PERFILES_TORTUOSIDAD[opciones.perfil]) ||
    (typeof opciones.factorPersonalizado === 'number' && opciones.factorPersonalizado >= 1.0)
  );
  if (!evaluacionConexion.conexionTerrestreDirecta && !tieneOverrideManual) {
    return calcularRutaIntermodal(o, d, evaluacionConexion, inicioReloj);
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
    // Caso límite con override manual sobre ruta marítima
    const res = resolverFactorYVelocidad(distanciaGeodesicaKm, opciones);
    factor = res.factor;
    velocidadKmh = res.velocidadKmh;
    tipoPerfil = res.tipoPerfil;
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

  const esSoloMaritimo = !evaluacionConexion.conexionTerrestreDirecta;

  return {
    distanciaGeodesicaKm: Number(distanciaGeodesicaKm.toFixed(2)),
    distanciaTerrestreKm: esSoloMaritimo ? 0 : distanciaEstimadaKm,
    distanciaMaritimaKm: esSoloMaritimo ? distanciaEstimadaKm : 0,
    distanciaEstimadaKm,
    distanciaEstimadaMetros,
    duracionTerrestreSegundos: esSoloMaritimo ? 0 : duracionEstimadaSegundos,
    duracionMaritimaSegundos: esSoloMaritimo ? duracionEstimadaSegundos : 0,
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
    desgloseTramos: null,
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
  PUERTOS: PUERTOS_FERRY_ESPANA,
});
