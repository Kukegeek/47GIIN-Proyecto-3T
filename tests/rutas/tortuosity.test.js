import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PERFILES_TORTUOSIDAD,
  RANGOS_DISTANCIA_PENINSULAR,
  resolverFactorYVelocidad,
  formatearDuracion,
  estimarRutaVial,
  TortuosityEngine,
} from '../../src/rutas/tortuosity.js';

describe('TTTRUCKS-38 Subtarea TTTRUCKS-40 - Matriz de Tortuosidad y Estimación Vial Instantánea', () => {
  // Coordenadas peninsulares de referencia
  const MADRID = { lat: 40.416775, lon: -3.703790 };
  const BARCELONA = { lat: 41.387015, lon: 2.170047 };
  const VALENCIA = { lat: 39.469907, lon: -0.376288 };
  const SEVILLA = { lat: 37.389092, lon: -5.984459 };
  const BILBAO = { lat: 43.263013, lon: -2.934985 };
  const MURCIA = { lat: 37.992222, lon: -1.130556 };
  const COSLADA = { lat: 40.425833, lon: -3.565833 }; // Corta distancia desde Madrid (~12 km)

  describe('Definición e inmutabilidad de la matriz peninsular', () => {
    it('PERFILES_TORTUOSIDAD contiene perfiles canónicos congelados', () => {
      assert.ok(PERFILES_TORTUOSIDAD.PENINSULAR_ESTANDAR);
      assert.ok(PERFILES_TORTUOSIDAD.CORREDOR_AUTOPISTA);
      assert.ok(PERFILES_TORTUOSIDAD.NACIONAL_CONVENCIONAL);
      assert.ok(PERFILES_TORTUOSIDAD.OROGRAFIA_MONTANA);
      assert.ok(PERFILES_TORTUOSIDAD.URBANO_ULTIMA_MILLA);

      assert.equal(Object.isFrozen(PERFILES_TORTUOSIDAD), true);
      assert.equal(Object.isFrozen(PERFILES_TORTUOSIDAD.PENINSULAR_ESTANDAR), true);
    });

    it('RANGOS_DISTANCIA_PENINSULAR define escalones de distancia coherentes', () => {
      assert.ok(Array.isArray(RANGOS_DISTANCIA_PENINSULAR));
      assert.equal(RANGOS_DISTANCIA_PENINSULAR.length, 4);

      // Los factores deben ser decrecientes a mayor distancia (rutas largas usan más autovías rectas)
      for (let i = 0; i < RANGOS_DISTANCIA_PENINSULAR.length - 1; i++) {
        assert.ok(
          RANGOS_DISTANCIA_PENINSULAR[i].factor >= RANGOS_DISTANCIA_PENINSULAR[i + 1].factor,
          `El factor del rango ${i} debe ser mayor o igual al rango ${i + 1}`
        );
      }
    });
  });

  describe('Resolución de factores de tortuosidad y velocidades comerciales', () => {
    it('aplica tramo urbano para distancias menores de 25 km', () => {
      const res = resolverFactorYVelocidad(12);
      assert.equal(res.tipoPerfil, 'DISTRIBUCION_URBANA');
      assert.equal(res.factor, 1.40);
      assert.equal(res.velocidadKmh, 40);
    });

    it('aplica tramo regional para distancias entre 25 y 100 km', () => {
      const res = resolverFactorYVelocidad(75);
      assert.equal(res.tipoPerfil, 'REGIONAL_COMARCAL');
      assert.equal(res.factor, 1.32);
      assert.equal(res.velocidadKmh, 68);
    });

    it('aplica tramo interprovincial para distancias entre 100 y 350 km', () => {
      const res = resolverFactorYVelocidad(280);
      assert.equal(res.tipoPerfil, 'INTERPROVINCIAL_MEDIA');
      assert.equal(res.factor, 1.26);
      assert.equal(res.velocidadKmh, 78);
    });

    it('aplica tramo corredor de larga distancia para distancias mayores de 350 km', () => {
      const res = resolverFactorYVelocidad(500);
      assert.equal(res.tipoPerfil, 'CORREDOR_LARGA_DISTANCIA');
      assert.equal(res.factor, 1.22);
      assert.equal(res.velocidadKmh, 84);
    });

    it('permite seleccionar un perfil predefinido explícito', () => {
      const res = resolverFactorYVelocidad(500, { perfil: 'OROGRAFIA_MONTANA' });
      assert.equal(res.tipoPerfil, 'OROGRAFIA_MONTANA');
      assert.equal(res.factor, 1.42);
      assert.equal(res.velocidadKmh, 50);
    });

    it('soporta factor y velocidad personalizados', () => {
      const res = resolverFactorYVelocidad(200, {
        factorPersonalizado: 1.35,
        velocidadPersonalizadaKmh: 75,
      });
      assert.equal(res.tipoPerfil, 'PERSONALIZADO');
      assert.equal(res.factor, 1.35);
      assert.equal(res.velocidadKmh, 75);
    });
  });

  describe('Función formatearDuracion', () => {
    it('formatea correctamente tiempos en minutos y horas', () => {
      assert.equal(formatearDuracion(0), '0m');
      assert.equal(formatearDuracion(-100), '0m');
      assert.equal(formatearDuracion(45 * 60), '45m');
      assert.equal(formatearDuracion(3600), '1h 00m');
      assert.equal(formatearDuracion(7320), '2h 02m');
      assert.equal(formatearDuracion(50400), '14h 00m');
    });
  });

  describe('Estimación vial en rutas peninsulares clave (3T)', () => {
    it('Madrid - Barcelona (~505 km geodésicos -> ~616 km estimados, ~7h 20m)', () => {
      const ruta = estimarRutaVial(MADRID, BARCELONA);

      assert.ok(ruta.distanciaGeodesicaKm >= 504 && ruta.distanciaGeodesicaKm <= 506);
      assert.ok(ruta.distanciaEstimadaKm >= 610 && ruta.distanciaEstimadaKm <= 620);
      assert.equal(ruta.tipoPerfil, 'CORREDOR_LARGA_DISTANCIA');
      assert.equal(ruta.factorTortuosidad, 1.22);
      assert.equal(ruta.velocidadMediaKmh, 84);
      assert.ok(ruta.duracionEstimadaHoras >= 7.2 && ruta.duracionEstimadaHoras <= 7.4);
      assert.match(ruta.duracionFormateada, /^7h \d{2}m$/);
    });

    it('Madrid - Valencia (~302 km geodésicos -> ~380 km estimados, ~4h 52m)', () => {
      const ruta = estimarRutaVial(MADRID, VALENCIA);

      assert.ok(ruta.distanciaGeodesicaKm >= 301 && ruta.distanciaGeodesicaKm <= 304);
      assert.ok(ruta.distanciaEstimadaKm >= 375 && ruta.distanciaEstimadaKm <= 385);
      assert.equal(ruta.tipoPerfil, 'INTERPROVINCIAL_MEDIA');
      assert.equal(ruta.factorTortuosidad, 1.26);
      assert.ok(ruta.duracionEstimadaHoras >= 4.8 && ruta.duracionEstimadaHoras <= 5.0);
    });

    it('Madrid - Sevilla (~390 km geodésicos -> ~475 km estimados)', () => {
      const ruta = estimarRutaVial(MADRID, SEVILLA);

      assert.ok(ruta.distanciaGeodesicaKm >= 389 && ruta.distanciaGeodesicaKm <= 392);
      assert.ok(ruta.distanciaEstimadaKm >= 470 && ruta.distanciaEstimadaKm <= 480);
      assert.equal(ruta.tipoPerfil, 'CORREDOR_LARGA_DISTANCIA');
    });

    it('Murcia - Bilbao (> 500 km, corredor norte-sureste)', () => {
      const ruta = estimarRutaVial(MURCIA, BILBAO);

      assert.ok(ruta.distanciaGeodesicaKm >= 590 && ruta.distanciaGeodesicaKm <= 610);
      assert.ok(ruta.distanciaEstimadaKm >= 720 && ruta.distanciaEstimadaKm <= 750);
      assert.equal(ruta.tipoPerfil, 'CORREDOR_LARGA_DISTANCIA');
    });

    it('Corta distancia urbana (Madrid centro - Coslada ~12 km)', () => {
      const ruta = estimarRutaVial(MADRID, COSLADA);

      assert.ok(ruta.distanciaGeodesicaKm >= 10 && ruta.distanciaGeodesicaKm <= 15);
      assert.equal(ruta.tipoPerfil, 'DISTRIBUCION_URBANA');
      assert.equal(ruta.factorTortuosidad, 1.40);
      assert.equal(ruta.velocidadMediaKmh, 40);
    });

    it('distancia por carretera es estrictamente mayor que la ortodrómica (factor >= 1.0)', () => {
      const ruta = estimarRutaVial(MADRID, BILBAO);
      assert.ok(ruta.distanciaEstimadaKm > ruta.distanciaGeodesicaKm);
      assert.equal(ruta.distanciaEstimadaMetros, Math.round(ruta.distanciaEstimadaKm * 1000));
    });

    it('coordenadas idénticas devuelven ceros inmediatamente', () => {
      const ruta = estimarRutaVial(MADRID, MADRID);
      assert.equal(ruta.distanciaGeodesicaKm, 0);
      assert.equal(ruta.distanciaEstimadaKm, 0);
      assert.equal(ruta.duracionEstimadaSegundos, 0);
      assert.equal(ruta.duracionFormateada, '0m');
      assert.equal(ruta.tipoPerfil, 'IDENTICO');
    });
  });

  describe('Fachada TortuosityEngine y Rendimiento Sub-Milisegundo (< 1 ms)', () => {
    it('TortuosityEngine.estimar y previsualizar operan como métodos equivalentes', () => {
      const r1 = TortuosityEngine.estimar(MADRID, BARCELONA);
      const r2 = TortuosityEngine.previsualizar(MADRID, BARCELONA);

      assert.equal(r1.distanciaEstimadaKm, r2.distanciaEstimadaKm);
      assert.equal(r1.duracionEstimadaSegundos, r2.duracionEstimadaSegundos);
      assert.equal(r1.tipoPerfil, r2.tipoPerfil);
    });

    it('cada cálculo individual registra tiempoCalculoMs inferior a 1 ms', () => {
      const ruta = TortuosityEngine.estimar(MADRID, BARCELONA);
      assert.ok(
        ruta.tiempoCalculoMs < 1.0,
        `Tiempo de cálculo individual: ${ruta.tiempoCalculoMs.toFixed(4)} ms (debe ser < 1 ms)`
      );
    });

    it('10.000 estimaciones completas en menos de 50 ms (< 0.005 ms por estimación)', () => {
      const inicio = performance.now();
      const ITERACIONES = 10000;

      for (let i = 0; i < ITERACIONES; i++) {
        estimarRutaVial(MADRID, VALENCIA);
      }

      const tiempoTotalMs = performance.now() - inicio;
      const tiempoMedioMs = tiempoTotalMs / ITERACIONES;

      assert.ok(
        tiempoMedioMs < 0.05,
        `Tiempo medio por estimación: ${tiempoMedioMs.toFixed(6)} ms (debe ser << 1 ms)`
      );
      assert.ok(
        tiempoTotalMs < 100,
        `Tiempo total para 10.000 estimaciones: ${tiempoTotalMs.toFixed(2)} ms`
      );
    });
  });
});
