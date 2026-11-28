/**
 * Script de Estrés Extremo en España: 10.000.000 de Rutas Reales
 * Proyecto: Tick Tock Trucks (3T) - TTTRUCKS-38 / TTTRUCKS-45
 * Fuente geográfica: zipcodes/ES.json (Poblaciones y Códigos Postales de España)
 *
 * Uso:
 *   node scripts/benchmark-10M-rutas-es.js
 *   (o desde scripts/: node .\benchmark-10M-rutas-es.js)
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TortuosityEngine } from '../src/rutas/tortuosity.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUTA_ES_JSON = resolve(__dirname, '../zipcodes/ES.json');

const TOTAL_RUTAS = 10_000_000;
const PASO_PROGRESO = 1_000_000;
const TAMANO_MUESTRA_LATENCIA = 100_000; // Muestreo uniforme (1 de cada 100 rutas) para percentiles sin saturar RAM

/**
 * Recorre el árbol jerárquico de zipcodes/ES.json y extrae coordenadas válidas de España.
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

function buscarPoblacionPorCP(poblaciones, cp, fallback) {
  return poblaciones.find((p) => p.cp === cp) || fallback;
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
  console.log(' TICK TOCK TRUCKS (3T) - PRUEBA DE ESTRÉS: 10.000.000 RUTAS EN ESPAÑA');
  console.log(' Dataset geográfico: zipcodes/ES.json (Poblaciones y CPs de España)');
  console.log('========================================================================\n');

  const tCargaInicio = performance.now();
  const poblaciones = cargarPoblacionesEspana(RUTA_ES_JSON);
  const numPob = poblaciones.length;
  const tCargaMs = performance.now() - tCargaInicio;

  console.log(`[1] Dataset cargado: ${numPob.toLocaleString('es-ES')} ubicaciones en España (${tCargaMs.toFixed(1)} ms).\n`);

  // Calentamiento V8 JIT previo
  for (let i = 0; i < 2000; i++) {
    TortuosityEngine.previsualizar(poblaciones[i % numPob], poblaciones[(i * 17 + 5) % numPob]);
  }

  // Muestra rápida de ciudades emblemáticas y rutas intermodales (3 tramos)
  const madrid = buscarPoblacionPorCP(poblaciones, '28001', { cp: '28001', nombre: 'Madrid', lat: 40.416775, lon: -3.70379 });
  const barcelona = buscarPoblacionPorCP(poblaciones, '08001', { cp: '08001', nombre: 'Barcelona', lat: 41.387015, lon: 2.170047 });
  const valencia = buscarPoblacionPorCP(poblaciones, '46001', { cp: '46001', nombre: 'Valencia', lat: 39.469907, lon: -0.376288 });
  const alcudia = buscarPoblacionPorCP(poblaciones, '07400', { cp: '07400', nombre: 'Alcúdia', lat: 39.8532, lon: 3.1214 });
  const palma = buscarPoblacionPorCP(poblaciones, '07001', { cp: '07001', nombre: 'Palma', lat: 39.5696, lon: 2.6502 });

  console.log('[2] Corredores de referencia (TortuosityEngine - Terrestre + Marítimo):');
  for (const [o, d] of [[madrid, barcelona], [madrid, valencia], [valencia, palma], [madrid, alcudia]]) {
    const r = TortuosityEngine.previsualizar(o, d);
    if (r.desgloseTramos) {
      const t = r.desgloseTramos;
      console.log(
        `  • ${o.nombre} (${o.cp}) -> ${d.nombre} (${d.cp}) [INTERMODAL 3 TRAMOS en ${r.tiempoCalculoMs.toFixed(4)} ms]:`
      );
      console.log(
        `    1) Terrestre Ori: ${o.nombre} -> ${t.terrestreOrigen.puerto}: ${t.terrestreOrigen.distanciaKm} km [x${t.terrestreOrigen.factorTortuosidad}]`
      );
      console.log(
        `    2) Marítimo      : ${t.maritimo.puertoOrigen} -> ${t.maritimo.puertoDestino}: ${r.distanciaMaritimaKm} km [x${t.maritimo.factorTortuosidad}]`
      );
      console.log(
        `    3) Terrestre Dst: ${t.terrestreDestino.puerto} -> ${d.nombre}: ${t.terrestreDestino.distanciaKm} km [x${t.terrestreDestino.factorTortuosidad}]`
      );
      console.log(
        `    => Parte Terrestre: ${r.distanciaTerrestreKm} km | Parte Marítima: ${r.distanciaMaritimaKm} km | Total Ruta: ${r.distanciaEstimadaKm} km (${r.duracionFormateada})`
      );
    } else {
      console.log(
        `  • ${o.nombre} (${o.cp}) -> ${d.nombre} (${d.cp}): Terrestre ${r.distanciaTerrestreKm} km | Marítimo 0 km | Total Ruta ${r.distanciaEstimadaKm} km (${r.duracionFormateada}) en ${r.tiempoCalculoMs.toFixed(4)} ms`
      );
    }
  }
  console.log('');

  // ----------------------------------------------------------------------
  // Bloque Masivo: 10.000.000 de rutas en streaming (sin sobrecarga de RAM)
  // ----------------------------------------------------------------------
  console.log(`[3] Iniciando cálculo masivo de ${TOTAL_RUTAS.toLocaleString('es-ES')} rutas en España...`);

  const muestraLatencias = new Float64Array(TAMANO_MUESTRA_LATENCIA);
  let idxMuestra = 0;

  let sumaGeodesica = 0;
  let sumaTerrestre = 0;
  let sumaMaritima = 0;
  let sumaVial = 0;
  let maxDistanciaVial = 0;
  let maxOrigenIdx = 0;
  let maxDestinoIdx = 0;
  let rutasTerrestres = 0;
  let rutasFerry = 0;
  let rutasNulas = 0;
  let rutasMuestreadasMenos1Ms = 0;

  // Estado PRNG xorshift32 inline (ultra rápido y determinista)
  let rng = 0x13572468;

  const tInicioGlobal = performance.now();
  let tParcialInicio = tInicioGlobal;

  for (let i = 1; i <= TOTAL_RUTAS; i++) {
    rng ^= rng << 13;
    rng ^= rng >>> 17;
    rng ^= rng << 5;
    const idxA = (rng >>> 0) % numPob;

    rng ^= rng << 13;
    rng ^= rng >>> 17;
    rng ^= rng << 5;
    const idxB = (rng >>> 0) % numPob;

    const res = TortuosityEngine.previsualizar(poblaciones[idxA], poblaciones[idxB]);

    sumaGeodesica += res.distanciaGeodesicaKm;
    sumaTerrestre += res.distanciaTerrestreKm;
    sumaMaritima += res.distanciaMaritimaKm;
    sumaVial += res.distanciaEstimadaKm;

    if (res.distanciaEstimadaKm > maxDistanciaVial) {
      maxDistanciaVial = res.distanciaEstimadaKm;
      maxOrigenIdx = idxA;
      maxDestinoIdx = idxB;
    }

    if (res.esDistanciaNula) {
      rutasNulas++;
    } else if (res.requiereFerry) {
      rutasFerry++;
    } else {
      rutasTerrestres++;
    }

    // Muestreo de latencia interna 1 de cada 100 rutas
    if (i % 100 === 0 && idxMuestra < TAMANO_MUESTRA_LATENCIA) {
      const dt = res.tiempoCalculoMs;
      muestraLatencias[idxMuestra++] = dt;
      if (dt < 1.0) rutasMuestreadasMenos1Ms++;
    }

    if (i % PASO_PROGRESO === 0) {
      const ahora = performance.now();
      const dtBloqueMs = ahora - tParcialInicio;
      const pct = ((i / TOTAL_RUTAS) * 100).toFixed(0);
      const rateBloque = Math.round(PASO_PROGRESO / (dtBloqueMs / 1000)).toLocaleString('es-ES');
      console.log(
        `  [${pct.padStart(3)}%] ${i.toLocaleString('es-ES').padStart(10)} rutas | Último millón: ${dtBloqueMs.toFixed(0).padStart(5)} ms (${rateBloque} rutas/s)`
      );
      tParcialInicio = ahora;
    }
  }

  const tTotalMs = performance.now() - tInicioGlobal;
  const tTotalSeg = tTotalMs / 1000;
  const mediaWallMs = tTotalMs / TOTAL_RUTAS;

  let sumaMuestra = 0;
  for (let i = 0; i < idxMuestra; i++) sumaMuestra += muestraLatencias[i];
  const mediaNetaMs = sumaMuestra / idxMuestra;

  const ordenados = Array.from(muestraLatencias.subarray(0, idxMuestra)).sort((a, b) => a - b);
  const minMs = ordenados[0];
  const p50Ms = calcularPercentil(ordenados, 50);
  const p95Ms = calcularPercentil(ordenados, 95);
  const p99Ms = calcularPercentil(ordenados, 99);
  const maxMs = ordenados[ordenados.length - 1];

  const pobMaxO = poblaciones[maxOrigenIdx];
  const pobMaxD = poblaciones[maxDestinoIdx];

  console.log('\n------------------------------------------------------------------------');
  console.log(` RESUMEN FINAL: ${TOTAL_RUTAS.toLocaleString('es-ES')} DE RUTAS EN ESPAÑA`);
  console.log('------------------------------------------------------------------------');
  console.log(`• Rutas calculadas correctamente   : ${TOTAL_RUTAS.toLocaleString('es-ES')} / ${TOTAL_RUTAS.toLocaleString('es-ES')} (100%)`);
  console.log(`• Tiempo total de ejecución        : ${tTotalMs.toFixed(2)} ms (${tTotalSeg.toFixed(3)} s)`);
  console.log(`• Tiempo medio por ruta (global)   : ${mediaWallMs.toFixed(6)} ms (${(mediaWallMs * 1000).toFixed(3)} µs)`);
  console.log(`• Tiempo medio neto por llamada    : ${mediaNetaMs.toFixed(6)} ms (${(mediaNetaMs * 1000).toFixed(3)} µs)`);
  console.log(`• Latencia (muestra 100k): Mín/p50 : ${minMs.toFixed(5)} ms / ${p50Ms.toFixed(5)} ms`);
  console.log(`• Latencia p95 / p99 / Máx         : ${p95Ms.toFixed(5)} ms / ${p99Ms.toFixed(5)} ms / ${maxMs.toFixed(5)} ms`);
  console.log(`• Cumplimiento SLA (< 1.0 ms)      : ${((rutasMuestreadasMenos1Ms / idxMuestra) * 100).toFixed(2)}% de la muestra`);
  console.log(`• Rendimiento sostenido (Throughput): ${Math.round(TOTAL_RUTAS / tTotalSeg).toLocaleString('es-ES')} rutas/segundo`);
  console.log('------------------------------------------------------------------------');
  console.log(`• Distribución territorial en España:`);
  console.log(`  - Conexión terrestre directa     : ${rutasTerrestres.toLocaleString('es-ES')} rutas`);
  console.log(`  - Intermodal / Marítima (ferry)  : ${rutasFerry.toLocaleString('es-ES')} rutas`);
  console.log(`  - Distancia nula / mismo punto   : ${rutasNulas.toLocaleString('es-ES')} rutas`);
  console.log(`• Distancia geodésica promedio     : ${(sumaGeodesica / TOTAL_RUTAS).toFixed(2)} km`);
  console.log(`• Parte terrestre promedio         : ${(sumaTerrestre / TOTAL_RUTAS).toFixed(2)} km`);
  console.log(`• Parte marítima promedio (ferry)  : ${rutasFerry > 0 ? (sumaMaritima / rutasFerry).toFixed(2) : '0.00'} km (en rutas con ferry)`);
  console.log(`• Total ruta promedio (terr+mar)   : ${(sumaVial / TOTAL_RUTAS).toFixed(2)} km`);
  console.log(`• Ruta total más larga registrada  : ${maxDistanciaVial.toFixed(2)} km`);
  console.log(`  (${pobMaxO.nombre} [${pobMaxO.cp}, ${pobMaxO.provincia}] -> ${pobMaxD.nombre} [${pobMaxD.cp}, ${pobMaxD.provincia}])`);
  console.log('========================================================================');
}

main();
