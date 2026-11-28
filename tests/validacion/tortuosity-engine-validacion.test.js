/**
 * ============================================================================
 * CASO FORMAL DE CERTIFICACIÓN Y VALIDACIÓN: TortuosityEngine
 * Tarea: TTTRUCKS-45 (Subtarea 3 de TTTRUCKS-42)
 * Historia: TTTRUCKS-42 - [VALIDACIÓN S1] Suite de pruebas unitarias de Seguridad
 *           RBAC, Auditoría y TortuosityEngine (CP-07 y CP-08)
 * Trazabilidad: TTTRUCKS-38, TTTRUCKS-39, TTTRUCKS-40, TTTRUCKS-41, TTTRUCKS-42,
 *               Sección 11 (V&V), M01-Rutas
 *
 * Criterio de Aceptación (Gherkin - BDD):
 *   Dado un runner de pruebas ejecutándose sobre el motor TortuosityEngine
 *   Cuando se evalúan pares de coordenadas peninsulares, metropolitanas y casos límite
 *   Entonces el motor responde en un tiempo inferior a 1 ms (< 1 ms), proporciona
 *          estimaciones viarias precisas según la matriz de tortuosidad peninsular,
 *          gestiona sin excepciones distancias nulas y detecta discontinuidades
 *          insulares/marítimas con alertas de intermodalidad.
 * ============================================================================
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  TortuosityEngine,
  PERFILES_TORTUOSIDAD,
  RANGOS_DISTANCIA_PENINSULAR,
  ZONAS_GEOGRAFICAS,
  resolverFactorYVelocidad,
  formatearDuracion,
  identificarZonaGeografica,
  evaluarConexionTerrestre,
} from '../../src/rutas/tortuosity.js';
import {
  calcularDistanciaHaversine,
  sonCoordenadasIdenticas,
  validarCoordenada,
} from '../../src/rutas/haversine.js';

describe('TTTRUCKS-42 Subtarea TTTRUCKS-45 - Certificación Formal de Precisión y Tiempos de Respuesta de TortuosityEngine', () => {
  // Coordenadas peninsulares de referencia
  const MADRID = { lat: 40.416775, lon: -3.703790 };
  const BARCELONA = { lat: 41.387015, lon: 2.170047 };
  const VALENCIA = { lat: 39.469907, lon: -0.376288 };
  const SEVILLA = { lat: 37.389092, lon: -5.984459 };
  const BILBAO = { lat: 43.263013, lon: -2.934985 };
  const MURCIA = { lat: 37.992222, lon: -1.130556 };
  const ZARAGOZA = { lat: 41.656064, lon: -0.877340 };
  const MALAGA = { lat: 36.721274, lon: -4.421399 };
  const COSLADA = { lat: 40.425833, lon: -3.565833 }; // Corta distancia metropolitana (~12 km)

  // Coordenadas insulares y ciudades autónomas
  const PALMA_MALLORCA = { lat: 39.5696, lon: 2.6502 };
  const ALCUDIA_MALLORCA = { lat: 39.8532, lon: 3.1214 }; // Misma isla (Mallorca)
  const MAHON_MENORCA = { lat: 39.8885, lon: 4.2658 };   // Menorca
  const IBIZA = { lat: 38.9067, lon: 1.4206 };           // Ibiza
  const SANTA_CRUZ_TENERIFE = { lat: 28.4636, lon: -16.2518 };
  const PUERTO_CRUZ_TENERIFE = { lat: 28.4167, lon: -16.5500 }; // Misma isla (Tenerife)
  const CADIZ = { lat: 36.5298, lon: -6.2924 };
  const ALGECIRAS = { lat: 36.1274, lon: -5.4536 };
  const CEUTA = { lat: 35.8894, lon: -5.3198 };
  const MELILLA = { lat: 35.2923, lon: -2.9381 };

  // Calentamiento previo para estabilizar el compilador JIT V8 antes de medir tiempos de alta resolución
  before(() => {
    for (let i = 0; i < 50; i++) {
      TortuosityEngine.previsualizar(MADRID, BARCELONA);
      TortuosityEngine.previsualizar(VALENCIA, PALMA_MALLORCA);
    }
  });

  describe('Fase 1: Certificación formal de latencia sub-milisegundo (< 1.0 ms) y alta concurrencia', () => {
    it('ejecuta estimaciones individuales en menos de 1.0 ms de tiempo de CPU', () => {
      const inicio = performance.now();
      const resultado = TortuosityEngine.previsualizar(MADRID, BARCELONA);
      const duracionMs = performance.now() - inicio;

      assert.ok(duracionMs < 1.0, `El tiempo de cálculo (${duracionMs.toFixed(4)} ms) debe ser inferior a 1.0 ms`);
      assert.ok(resultado.tiempoCalculoMs < 1.0, `tiempoCalculoMs interno (${resultado.tiempoCalculoMs.toFixed(4)} ms) excede 1.0 ms`);
    });

    it('procesa una ráfaga de 1.000 estimaciones consecutivas con media inferior a 0.05 ms por cálculo', () => {
      const iteraciones = 1000;
      const inicio = performance.now();

      for (let i = 0; i < iteraciones; i++) {
        TortuosityEngine.estimar(MADRID, VALENCIA);
      }

      const tiempoTotalMs = performance.now() - inicio;
      const tiempoMedioMs = tiempoTotalMs / iteraciones;

      assert.ok(
        tiempoMedioMs < 0.05,
        `El tiempo medio por cálculo (${tiempoMedioMs.toFixed(5)} ms) supera el umbral objetivo de 0.05 ms`
      );
      assert.ok(
        tiempoTotalMs < 50.0,
        `La ráfaga de 1.000 estimaciones (${tiempoTotalMs.toFixed(2)} ms) tardó más de 50 ms`
      );
    });

    it('la fachada previsualizar y estimar son alias funcionalmente idénticos', () => {
      const res1 = TortuosityEngine.estimar(MADRID, SEVILLA);
      const res2 = TortuosityEngine.previsualizar(MADRID, SEVILLA);

      assert.equal(res1.distanciaGeodesicaKm, res2.distanciaGeodesicaKm);
      assert.equal(res1.distanciaEstimadaKm, res2.distanciaEstimadaKm);
      assert.equal(res1.duracionEstimadaSegundos, res2.duracionEstimadaSegundos);
      assert.equal(res1.factorTortuosidad, res2.factorTortuosidad);
      assert.equal(res1.velocidadMediaKmh, res2.velocidadMediaKmh);
    });
  });

  describe('Fase 2: Certificación de precisión vial en grandes corredores logísticos peninsulares', () => {
    it('corredor radial Madrid - Barcelona: aplica factor de autovía troncal (distancia > 400 km)', () => {
      const res = TortuosityEngine.previsualizar(MADRID, BARCELONA);

      // Distancia ortodrómica real: ~505 km
      assert.ok(res.distanciaGeodesicaKm >= 500 && res.distanciaGeodesicaKm <= 515);

      // Factor de larga distancia: 1.22x, velocidad 84 km/h
      assert.equal(res.factorTortuosidad, 1.22);
      assert.equal(res.velocidadMediaKmh, 84);

      // Distancia vial esperada ~615-625 km (coherente con A-2 / AP-2 real)
      assert.ok(res.distanciaEstimadaKm >= 610 && res.distanciaEstimadaKm <= 625);
      assert.equal(res.conexionTerrestreDirecta, true);
      assert.equal(res.requiereFerry, false);
      assert.ok(res.duracionEstimadaHoras >= 7.0 && res.duracionEstimadaHoras <= 8.0);
    });

    it('corredor radial Madrid - Valencia: aplica factor de distancia interprovincial (distancia > 300 km)', () => {
      const res = TortuosityEngine.previsualizar(MADRID, VALENCIA);

      // Geodésica ~302 km, estimada ~375-385 km
      assert.ok(res.distanciaGeodesicaKm >= 300 && res.distanciaGeodesicaKm <= 310);
      assert.equal(res.factorTortuosidad, 1.26);
      assert.ok(res.distanciaEstimadaKm >= 370 && res.distanciaEstimadaKm <= 385);
      assert.equal(res.conexionTerrestreDirecta, true);
    });

    it('corredor radial Madrid - Sevilla: aplica factor y velocidad de autovía A-4', () => {
      const res = TortuosityEngine.previsualizar(MADRID, SEVILLA);

      // Geodésica ~390 km, estimada ~475 km
      assert.ok(res.distanciaGeodesicaKm >= 385 && res.distanciaGeodesicaKm <= 395);
      assert.equal(res.factorTortuosidad, 1.22);
      assert.ok(res.distanciaEstimadaKm >= 470 && res.distanciaEstimadaKm <= 485);
    });

    it('corredor diagonal Bilbao - Murcia: resuelve trayecto interprovincial mixto', () => {
      const res = TortuosityEngine.previsualizar(BILBAO, MURCIA);

      // Geodésica ~585 km, estimada ~720-740 km
      assert.ok(res.distanciaGeodesicaKm >= 580 && res.distanciaGeodesicaKm <= 610);
      assert.equal(res.factorTortuosidad, 1.22);
      assert.ok(res.distanciaEstimadaKm >= 710 && res.distanciaEstimadaKm <= 750);
    });

    it('corredor transversal Zaragoza - Málaga: modela adecuadamente trayectos de larga distancia', () => {
      const res = TortuosityEngine.previsualizar(ZARAGOZA, MALAGA);

      // Geodésica ~630 km
      assert.ok(res.distanciaGeodesicaKm >= 620 && res.distanciaGeodesicaKm <= 645);
      assert.equal(res.factorTortuosidad, 1.22);
      assert.ok(res.distanciaEstimadaKm > 750);
    });
  });

  describe('Fase 3: Certificación de precisión en distribución urbana y última milla (< 25 km)', () => {
    it('aplica factor urbano 1.40x y velocidad moderada (40 km/h) en trayectos cortos', () => {
      const res = TortuosityEngine.previsualizar(MADRID, COSLADA);

      // Distancia geodésica ~12.2 km
      assert.ok(res.distanciaGeodesicaKm >= 11.0 && res.distanciaGeodesicaKm <= 13.5);
      assert.equal(res.factorTortuosidad, 1.40);
      assert.equal(res.velocidadMediaKmh, 40);

      // Distancia vial esperada ~17 km
      assert.ok(res.distanciaEstimadaKm >= 15.5 && res.distanciaEstimadaKm <= 18.5);
      assert.ok(res.duracionEstimadaMinutos >= 20 && res.duracionEstimadaMinutos <= 35);
      assert.ok(typeof res.duracionFormateada === 'string');
    });

    it('formatearDuracion desglosa correctamente horas y minutos legibles', () => {
      assert.equal(formatearDuracion(0), '0m');
      assert.equal(formatearDuracion(1800), '30m');
      assert.equal(formatearDuracion(3600), '1h 00m');
      assert.equal(formatearDuracion(7380), '2h 03m');
      assert.equal(formatearDuracion(86400), '24h 00m');
    });
  });

  describe('Fase 4: Certificación de gestión de singularidades y casos límite', () => {
    it('coordenadas idénticas devuelven inmediatamente distancia y duración 0 con bandera esDistanciaNula: true', () => {
      const res = TortuosityEngine.previsualizar(MADRID, { ...MADRID });

      assert.equal(res.distanciaGeodesicaKm, 0);
      assert.equal(res.distanciaEstimadaKm, 0);
      assert.equal(res.distanciaEstimadaMetros, 0);
      assert.equal(res.duracionEstimadaSegundos, 0);
      assert.equal(res.duracionEstimadaHoras, 0);
      assert.equal(res.duracionFormateada, '0m');
      assert.equal(res.esDistanciaNula, true);
      assert.equal(res.conexionTerrestreDirecta, true);
      assert.equal(res.requiereFerry, false);
      assert.ok(res.tiempoCalculoMs < 0.5);
    });

    it('micro-desviaciones métricas (< 1 cm) son tratadas de forma robusta como coordenadas idénticas', () => {
      const MADRID_MICRO_OFFSET = {
        lat: MADRID.lat + 0.00000005, // Menos de 1 cm
        lon: MADRID.lon - 0.00000005,
      };

      assert.equal(sonCoordenadasIdenticas(MADRID, MADRID_MICRO_OFFSET), true);
      const res = TortuosityEngine.previsualizar(MADRID, MADRID_MICRO_OFFSET);
      assert.equal(res.esDistanciaNula, true);
      assert.equal(res.distanciaEstimadaKm, 0);
    });

    it('rechaza con error controlado coordenadas inválidas, nulas o con valores fuera de rango', () => {
      // Coordenada nula
      assert.throws(
        () => TortuosityEngine.previsualizar(null, BARCELONA),
        TypeError
      );

      // Latitud fuera de rango [-90, 90]
      assert.throws(
        () => TortuosityEngine.previsualizar({ lat: 95.0, lon: 0.0 }, BARCELONA),
        RangeError
      );

      // Longitud fuera de rango [-180, 180]
      assert.throws(
        () => TortuosityEngine.previsualizar(MADRID, { lat: 40.0, lon: 195.0 }),
        RangeError
      );

      // Coordenadas con valores no numéricos
      assert.throws(
        () => TortuosityEngine.previsualizar({ lat: 'invalido', lon: 0.0 }, BARCELONA),
        TypeError
      );
    });
  });

  describe('Fase 5: Certificación de discontinuidad territorial y transporte marítimo/insular', () => {
    it('detecta ruta península a Baleares (Valencia -> Palma de Mallorca) desglosando parte terrestre, marítima (x1.03) y total', () => {
      const res = TortuosityEngine.previsualizar(VALENCIA, PALMA_MALLORCA);

      assert.equal(res.zonaOrigen, ZONAS_GEOGRAFICAS.PENINSULA);
      assert.equal(res.zonaDestino, ZONAS_GEOGRAFICAS.BALEARES);
      assert.equal(res.conexionTerrestreDirecta, false);
      assert.equal(res.requiereFerry, true);
      assert.ok(res.desgloseTramos);
      assert.equal(res.desgloseTramos.maritimo.factorTortuosidad, 1.03);
      assert.equal(
        Number((res.distanciaTerrestreKm + res.distanciaMaritimaKm).toFixed(2)),
        res.distanciaEstimadaKm
      );
      assert.ok(res.aviso && res.aviso.toLowerCase().includes('ferry'));
      assert.ok(res.tiempoCalculoMs < 1.0);
    });

    it('detecta ruta interinsular (Palma de Mallorca -> Mahón en Menorca) requiriendo ferry entre islas', () => {
      const res = TortuosityEngine.previsualizar(PALMA_MALLORCA, MAHON_MENORCA);

      assert.equal(res.zonaOrigen, ZONAS_GEOGRAFICAS.BALEARES);
      assert.equal(res.zonaDestino, ZONAS_GEOGRAFICAS.BALEARES);
      assert.equal(res.subzonaOrigen, 'MALLORCA');
      assert.equal(res.subzonaDestino, 'MENORCA');
      assert.equal(res.conexionTerrestreDirecta, false);
      assert.equal(res.requiereFerry, true);
    });

    it('detecta ruta intra-isla (Palma -> Alcúdia dentro de Mallorca) confirmando conexión terrestre directa', () => {
      const res = TortuosityEngine.previsualizar(PALMA_MALLORCA, ALCUDIA_MALLORCA);

      assert.equal(res.zonaOrigen, ZONAS_GEOGRAFICAS.BALEARES);
      assert.equal(res.zonaDestino, ZONAS_GEOGRAFICAS.BALEARES);
      assert.equal(res.subzonaOrigen, 'MALLORCA');
      assert.equal(res.subzonaDestino, 'MALLORCA');
      assert.equal(res.conexionTerrestreDirecta, true);
      assert.equal(res.requiereFerry, false);
      assert.equal(res.tipoPerfil, 'INSULAR_LOCAL');
      assert.equal(res.factorTortuosidad, 1.35);
    });

    it('detecta ruta península a Canarias (Cádiz -> Santa Cruz de Tenerife) alertando sobre ferry oceánico', () => {
      const res = TortuosityEngine.previsualizar(CADIZ, SANTA_CRUZ_TENERIFE);

      assert.equal(res.zonaOrigen, ZONAS_GEOGRAFICAS.PENINSULA);
      assert.equal(res.zonaDestino, ZONAS_GEOGRAFICAS.CANARIAS);
      assert.equal(res.conexionTerrestreDirecta, false);
      assert.equal(res.requiereFerry, true);
      assert.ok(res.aviso && res.aviso.toLowerCase().includes('ferry'));
    });

    it('detecta ruta hacia Ciudad Autónoma (Algeciras -> Ceuta) alertando sobre salto del Estrecho de Gibraltar', () => {
      const res = TortuosityEngine.previsualizar(ALGECIRAS, CEUTA);

      assert.equal(res.zonaOrigen, ZONAS_GEOGRAFICAS.PENINSULA);
      assert.equal(res.zonaDestino, ZONAS_GEOGRAFICAS.CEUTA);
      assert.equal(res.conexionTerrestreDirecta, false);
      assert.equal(res.requiereFerry, true);
      assert.ok(res.aviso.includes('Estrecho'));
    });
  });

  describe('Fase 6: Inmutabilidad de configuraciones y seguridad de concurrencia', () => {
    it('la fachada TortuosityEngine y sus catálogos de constantes están estrictamente congelados', () => {
      assert.equal(Object.isFrozen(TortuosityEngine), true);
      assert.equal(Object.isFrozen(PERFILES_TORTUOSIDAD), true);
      assert.equal(Object.isFrozen(RANGOS_DISTANCIA_PENINSULAR), true);
      assert.equal(Object.isFrozen(ZONAS_GEOGRAFICAS), true);
    });

    it('las estimaciones son funciones puras libres de efectos secundarios mutables', () => {
      const origen = { ...MADRID };
      const destino = { ...BARCELONA };

      TortuosityEngine.previsualizar(origen, destino);

      // Comprobar que los objetos pasados no han sido alterados
      assert.deepEqual(origen, MADRID);
      assert.deepEqual(destino, BARCELONA);
    });
  });
});
