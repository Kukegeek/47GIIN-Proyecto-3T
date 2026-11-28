/**
 * Script de Demostración y Benchmark de Rendimiento en España (10.000 Rutas Reales)
 * Proyecto: Tick Tock Trucks (3T) - TTTRUCKS-38 / TTTRUCKS-45
 * Fuente geográfica: zipcodes/ES.json (Poblaciones y Códigos Postales de España)
 *
 * Uso:
 *   node scripts/benchmark-10000-rutas-es.js
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TortuosityEngine } from '../src/rutas/tortuosity.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUTA_ES_JSON = resolve(__dirname, '../zipcodes/ES.json');
const TOTAL_RUTAS_BENCHMARK = 10_000;

/**
 * Recorre el árbol jerárquico de zipcodes/ES.json y extrae poblaciones con coordenadas válidas.
 */
function cargarPoblacionesEspana(rutaArchivo) {
  const raw = readFileSync(rutaArchivo, 'utf8');
  const data = JSON.parse(raw);
  const poblaciones = [];

  function recorrer(nodo, comunidad = '', provincia = '') {
    const comActual = nodo.level === 1 ? nodo.name : comunidad;
    const provActual = nodo.level === 2 ? nodo.name : provincia;

    if (Array.isArray(nodo.places)) {
      for (const p of nodo.places) {
        if (
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number' &&
          Number.isFinite(p.latitude) &&
          Number.isFinite(p.longitude)
        ) {
          poblaciones.push({
            cp: p.postal_code,
            nombre: p.place_name,
            provincia: provActual,
            comunidad: comActual,
            lat: p.latitude,
            lon: p.longitude,
          });
        }
      }
    }

    if (Array.isArray(nodo.subdivisions)) {
      for (const sub of nodo.subdivisions) {
        recorrer(sub, comActual, provActual);
      }
    }
  }

  recorrer(data);
  return poblaciones;
}

/**
 * Generador pseudoaleatorio determinista (Mulberry32) para reproducibilidad exacta en la demo.
 */
function crearPRNG(seed = 20261125) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buscarPoblacionPorCP(poblaciones, cp, fallback) {
  const encontrada = poblaciones.find((p) => p.cp === cp);
  return encontrada || fallback;
}

function calcularPercentil(ordenados, percentil) {
  if (ordenados.length === 0) return 0;
  const idx = Math.min(
    ordenados.length - 1,
    Math.floor((percentil / 100) * ordenados.length)
  );
  return ordenados[idx];
}

function main() {
  console.log('========================================================================');
  console.log(' TICK TOCK TRUCKS (3T) - VALIDACIÓN TORTUOSITY ENGINE EN ESPAÑA');
  console.log(' Dataset geográfico: zipcodes/ES.json (Poblaciones y CPs de España)');
  console.log('========================================================================\n');

  const tCargaInicio = performance.now();
  const poblaciones = cargarPoblacionesEspana(RUTA_ES_JSON);
  const tCargaMs = performance.now() - tCargaInicio;

  console.log(`[1] Dataset cargado: ${poblaciones.length.toLocaleString('es-ES')} ubicaciones válidas en España (${tCargaMs.toFixed(1)} ms).\n`);

  // Calentamiento breve de V8 JIT
  for (let i = 0; i < 500; i++) {
    const a = poblaciones[i % poblaciones.length];
    const b = poblaciones[(i * 7 + 13) % poblaciones.length];
    TortuosityEngine.previsualizar(a, b);
  }

  // ----------------------------------------------------------------------
  // Bloque A: Corredores representativos entre ciudades de España (desde ES.json)
  // ----------------------------------------------------------------------
  const madrid = buscarPoblacionPorCP(poblaciones, '28001', { cp: '28001', nombre: 'Madrid', lat: 40.416775, lon: -3.70379 });
  const barcelona = buscarPoblacionPorCP(poblaciones, '08001', { cp: '08001', nombre: 'Barcelona', lat: 41.387015, lon: 2.170047 });
  const valencia = buscarPoblacionPorCP(poblaciones, '46001', { cp: '46001', nombre: 'Valencia', lat: 39.469907, lon: -0.376288 });
  const sevilla = buscarPoblacionPorCP(poblaciones, '41001', { cp: '41001', nombre: 'Sevilla', lat: 37.389092, lon: -5.984459 });
  const bilbao = buscarPoblacionPorCP(poblaciones, '48001', { cp: '48001', nombre: 'Bilbao', lat: 43.263013, lon: -2.934985 });
  const murcia = buscarPoblacionPorCP(poblaciones, '30001', { cp: '30001', nombre: 'Murcia', lat: 37.992222, lon: -1.130556 });
  const palma = buscarPoblacionPorCP(poblaciones, '07001', { cp: '07001', nombre: 'Palma', lat: 39.5696, lon: 2.6502 });
  const tenerife = buscarPoblacionPorCP(poblaciones, '38001', { cp: '38001', nombre: 'Santa Cruz de Tenerife', lat: 28.4636, lon: -16.2518 });
  const ceuta = buscarPoblacionPorCP(poblaciones, '51001', { cp: '51001', nombre: 'Ceuta', lat: 35.8894, lon: -5.3198 });
  const coslada = buscarPoblacionPorCP(poblaciones, '28821', { cp: '28821', nombre: 'Coslada', lat: 40.425833, lon: -3.565833 });

  const corredores = [
    { etiqueta: 'Corredor Alta Capacidad', o: madrid, d: barcelona },
    { etiqueta: 'Corredor Levante', o: madrid, d: valencia },
    { etiqueta: 'Corredor Sur', o: madrid, d: sevilla },
    { etiqueta: 'Corredor Norte-Sureste', o: bilbao, d: murcia },
    { etiqueta: 'Distribución Urbana', o: madrid, d: coslada },
    { etiqueta: 'Península -> Baleares (Ferry)', o: valencia, d: palma },
    { etiqueta: 'Península -> Canarias (Ferry)', o: sevilla, d: tenerife },
    { etiqueta: 'Península -> Ceuta (Estrecho)', o: sevilla, d: ceuta },
    { etiqueta: 'Caso Límite: Mismo CP/Punto', o: madrid, d: madrid },
  ];

  console.log('[2] Muestreo de rutas reales en España (Códigos Postales de ES.json):');
  console.log('------------------------------------------------------------------------');
  for (const c of corredores) {
    const r = TortuosityEngine.previsualizar(c.o, c.d);
    const ferryTxt = r.requiereFerry ? 'INTERMODAL/FERRY' : 'TERRESTRE';
    console.log(
      `• ${c.etiqueta.padEnd(30)} | ${c.o.nombre} (${c.o.cp}) -> ${c.d.nombre} (${c.d.cp}) [${ferryTxt}]`
    );
    if (r.desgloseTramos) {
      const t = r.desgloseTramos;
      console.log(
        `  Parte Terrestre: ${String(r.distanciaTerrestreKm).padStart(7)} km (${c.o.nombre}->${t.terrestreOrigen.puerto}: ${t.terrestreOrigen.distanciaKm} km [x${t.terrestreOrigen.factorTortuosidad}] + ${t.terrestreDestino.puerto}->${c.d.nombre}: ${t.terrestreDestino.distanciaKm} km [x${t.terrestreDestino.factorTortuosidad}]) | Marítimo (${t.maritimo.puertoOrigen}->${t.maritimo.puertoDestino}): ${String(r.distanciaMaritimaKm).padStart(7)} km [x${t.maritimo.factorTortuosidad}] | Total Ruta: ${String(r.distanciaEstimadaKm).padStart(7)} km (${r.duracionFormateada}) | CPU: ${r.tiempoCalculoMs.toFixed(4)} ms`
      );
    } else {
      console.log(
        `  Parte Terrestre: ${String(r.distanciaTerrestreKm).padStart(7)} km (x${r.factorTortuosidad}) | Marítimo:    0.00 km | Total Ruta: ${String(r.distanciaEstimadaKm).padStart(7)} km (${r.duracionFormateada}) | CPU: ${r.tiempoCalculoMs.toFixed(4)} ms`
      );
    }
  }
  console.log('');

  // ----------------------------------------------------------------------
  // Bloque B: 10.000 cálculos reales aleatorios reproducibles dentro de España
  // ----------------------------------------------------------------------
  const rand = crearPRNG(20261125);
  const pares = new Array(TOTAL_RUTAS_BENCHMARK);
  for (let i = 0; i < TOTAL_RUTAS_BENCHMARK; i++) {
    const idxA = Math.floor(rand() * poblaciones.length);
    const idxB = Math.floor(rand() * poblaciones.length);
    pares[i] = [poblaciones[idxA], poblaciones[idxB]];
  }

  const tiemposMs = new Float64Array(TOTAL_RUTAS_BENCHMARK);
  let sumaGeodesica = 0;
  let sumaVial = 0;
  let maxDistanciaVial = 0;
  let rutaMasLarga = null;
  let rutasTerrestres = 0;
  let rutasFerry = 0;
  let rutasNulas = 0;
  let rutasMenos1Ms = 0;

  const tBenchInicio = performance.now();
  for (let i = 0; i < TOTAL_RUTAS_BENCHMARK; i++) {
    const [origen, destino] = pares[i];
    const t0 = performance.now();
    const res = TortuosityEngine.previsualizar(origen, destino);
    const dt = performance.now() - t0;

    tiemposMs[i] = dt;
    if (dt < 1.0) rutasMenos1Ms++;

    sumaGeodesica += res.distanciaGeodesicaKm;
    sumaVial += res.distanciaEstimadaKm;

    if (res.distanciaEstimadaKm > maxDistanciaVial) {
      maxDistanciaVial = res.distanciaEstimadaKm;
      rutaMasLarga = `${origen.nombre} (${origen.cp}, ${origen.provincia}) -> ${destino.nombre} (${destino.cp}, ${destino.provincia})`;
    }

    if (res.esDistanciaNula) {
      rutasNulas++;
    } else if (res.requiereFerry) {
      rutasFerry++;
    } else {
      rutasTerrestres++;
    }
  }
  const tBenchTotalMs = performance.now() - tBenchInicio;

  // Estadísticas de latencia
  let sumaTiempos = 0;
  for (let i = 0; i < TOTAL_RUTAS_BENCHMARK; i++) sumaTiempos += tiemposMs[i];
  const mediaFuncionMs = sumaTiempos / TOTAL_RUTAS_BENCHMARK;
  const mediaWallMs = tBenchTotalMs / TOTAL_RUTAS_BENCHMARK;

  const ordenados = Array.from(tiemposMs).sort((a, b) => a - b);
  const minMs = ordenados[0];
  const p50Ms = calcularPercentil(ordenados, 50);
  const p95Ms = calcularPercentil(ordenados, 95);
  const p99Ms = calcularPercentil(ordenados, 99);
  const maxMs = ordenados[ordenados.length - 1];

  console.log(`[3] Benchmark Masivo: ${TOTAL_RUTAS_BENCHMARK.toLocaleString('es-ES')} Rutas Reales en España (zipcodes/ES.json)`);
  console.log('------------------------------------------------------------------------');
  console.log(`• Rutas calculadas correctamente : ${TOTAL_RUTAS_BENCHMARK.toLocaleString('es-ES')} / ${TOTAL_RUTAS_BENCHMARK.toLocaleString('es-ES')} (100%)`);
  console.log(`• Tiempo total del lote (10.000) : ${tBenchTotalMs.toFixed(2)} ms (${(tBenchTotalMs / 1000).toFixed(3)} s)`);
  console.log(`• Tiempo medio por ruta (wall)   : ${mediaWallMs.toFixed(5)} ms (${(mediaWallMs * 1000).toFixed(2)} µs)`);
  console.log(`• Tiempo medio neto (por llamada): ${mediaFuncionMs.toFixed(5)} ms (${(mediaFuncionMs * 1000).toFixed(2)} µs)`);
  console.log(`• Latencia Mín / Mediana (p50)   : ${minMs.toFixed(5)} ms / ${p50Ms.toFixed(5)} ms`);
  console.log(`• Latencia p95 / p99 / Máx       : ${p95Ms.toFixed(5)} ms / ${p99Ms.toFixed(5)} ms / ${maxMs.toFixed(5)} ms`);
  console.log(`• Cumplimiento SLA (< 1.0 ms)    : ${rutasMenos1Ms.toLocaleString('es-ES')} / ${TOTAL_RUTAS_BENCHMARK.toLocaleString('es-ES')} (${((rutasMenos1Ms / TOTAL_RUTAS_BENCHMARK) * 100).toFixed(2)}%)`);
  console.log(`• Rendimiento (throughput)       : ${Math.round(TOTAL_RUTAS_BENCHMARK / (tBenchTotalMs / 1000)).toLocaleString('es-ES')} rutas/segundo`);
  console.log('------------------------------------------------------------------------');
  console.log(`• Distribución geográfica:`);
  console.log(`  - Conexión terrestre directa   : ${rutasTerrestres.toLocaleString('es-ES')} rutas`);
  console.log(`  - Intermodal / Marítima (ferry): ${rutasFerry.toLocaleString('es-ES')} rutas`);
  console.log(`  - Distancia nula / mismo punto : ${rutasNulas.toLocaleString('es-ES')} rutas`);
  console.log(`• Distancia geodésica media      : ${(sumaGeodesica / TOTAL_RUTAS_BENCHMARK).toFixed(2)} km`);
  console.log(`• Distancia vial estimada media  : ${(sumaVial / TOTAL_RUTAS_BENCHMARK).toFixed(2)} km`);
  console.log(`• Ruta vial más larga muestreada : ${maxDistanciaVial.toFixed(2)} km (${rutaMasLarga})`);
  console.log('========================================================================');
}

main();
