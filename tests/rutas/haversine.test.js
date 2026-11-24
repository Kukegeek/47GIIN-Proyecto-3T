import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RADIO_TIERRA_KM,
  RADIO_TIERRA_METROS,
  gradosARadianes,
  radianesAGrados,
  validarCoordenada,
  sonCoordenadasIdenticas,
  calcularDistanciaHaversine,
  calcularDistanciaOrtodromica,
} from '../../src/rutas/haversine.js';

describe('TTTRUCKS-38 Subtarea TTTRUCKS-39 - Fórmula ortodrómica de Haversine', () => {
  // Coordenadas de prueba en la península ibérica
  const MADRID = { lat: 40.416775, lon: -3.703790 }; // Puerta del Sol
  const BARCELONA = { lat: 41.387015, lon: 2.170047 }; // Plaça de Catalunya
  const SEVILLA = { lat: 37.389092, lon: -5.984459 }; // Plaza de España
  const VALENCIA = { lat: 39.469907, lon: -0.376288 }; // Plaça de l'Ajuntament
  const BILBAO = { lat: 43.263013, lon: -2.934985 }; // Bilbao centro

  describe('Conversión angular y validaciones', () => {
    it('gradosARadianes convierte correctamente ángulos clave', () => {
      assert.equal(gradosARadianes(0), 0);
      assert.equal(gradosARadianes(180), Math.PI);
      assert.equal(gradosARadianes(90), Math.PI / 2);
      assert.equal(gradosARadianes(360), 2 * Math.PI);
    });

    it('radianesAGrados convierte correctamente a grados', () => {
      assert.equal(radianesAGrados(0), 0);
      assert.equal(radianesAGrados(Math.PI), 180);
      assert.equal(radianesAGrados(Math.PI / 2), 90);
    });

    it('conversión bidireccional es simétrica y conserva valor', () => {
      const angulo = 45.678;
      const rad = gradosARadianes(angulo);
      assert.ok(Math.abs(radianesAGrados(rad) - angulo) < 1e-10);
    });

    it('gradosARadianes y radianesAGrados rechazan tipos no numéricos', () => {
      assert.throws(() => gradosARadianes('40'), TypeError);
      assert.throws(() => gradosARadianes(NaN), TypeError);
      assert.throws(() => radianesAGrados(null), TypeError);
    });

    it('validarCoordenada soporta formatos {lat, lon}, {lat, lng}, {latitude, longitude} y array', () => {
      const c1 = validarCoordenada({ lat: 40.41, lon: -3.70 });
      assert.deepEqual(c1, { lat: 40.41, lon: -3.70 });

      const c2 = validarCoordenada({ lat: 40.41, lng: -3.70 });
      assert.deepEqual(c2, { lat: 40.41, lon: -3.70 });

      const c3 = validarCoordenada({ latitude: 40.41, longitude: -3.70 });
      assert.deepEqual(c3, { lat: 40.41, lon: -3.70 });

      const c4 = validarCoordenada([40.41, -3.70]);
      assert.deepEqual(c4, { lat: 40.41, lon: -3.70 });
    });

    it('validarCoordenada rechaza coordenadas inválidas o fuera de rango', () => {
      assert.throws(() => validarCoordenada(null), TypeError);
      assert.throws(() => validarCoordenada({ lat: '40', lon: -3 }), TypeError);
      assert.throws(() => validarCoordenada({ lat: 91, lon: 0 }), RangeError);
      assert.throws(() => validarCoordenada({ lat: -91, lon: 0 }), RangeError);
      assert.throws(() => validarCoordenada({ lat: 0, lon: 181 }), RangeError);
      assert.throws(() => validarCoordenada({ lat: 0, lon: -181 }), RangeError);
      assert.throws(() => validarCoordenada([40]), TypeError);
    });

    it('sonCoordenadasIdenticas detecta puntos coincidentes con margen de tolerancia', () => {
      assert.equal(sonCoordenadasIdenticas(MADRID, MADRID), true);
      assert.equal(sonCoordenadasIdenticas(MADRID, { lat: 40.41677501, lon: -3.70379001 }), true);
      assert.equal(sonCoordenadasIdenticas(MADRID, BARCELONA), false);
    });
  });

  describe('Cálculo de Distancia Ortodrómica de Haversine', () => {
    it('distancia entre coordenadas idénticas es exactamente 0', () => {
      const dKm = calcularDistanciaHaversine(MADRID, MADRID);
      assert.equal(dKm, 0);

      const dMetros = calcularDistanciaHaversine(SEVILLA, SEVILLA, { unidad: 'm' });
      assert.equal(dMetros, 0);
    });

    it('calcula con precisión geodésica la distancia Madrid - Barcelona (~505 km)', () => {
      const dKm = calcularDistanciaHaversine(MADRID, BARCELONA);
      // La distancia geodésica ortodrómica Madrid-Barcelona está entre 504 km y 506 km
      assert.ok(dKm >= 504 && dKm <= 506, `Distancia calculada: ${dKm} km`);

      // Con redondeo a 2 decimales
      const dRedondeada = calcularDistanciaHaversine(MADRID, BARCELONA, { decimales: 2 });
      assert.equal(typeof dRedondeada, 'number');
      assert.ok(Math.abs(dRedondeada - 505.0) < 2);
    });

    it('calcula con precisión la distancia Madrid - Sevilla (~390 km)', () => {
      const dKm = calcularDistanciaHaversine(MADRID, SEVILLA);
      assert.ok(dKm >= 389 && dKm <= 392, `Distancia calculada: ${dKm} km`);
    });

    it('calcula con precisión la distancia Madrid - Valencia (~302 km)', () => {
      const dKm = calcularDistanciaHaversine(MADRID, VALENCIA);
      assert.ok(dKm >= 301 && dKm <= 304, `Distancia calculada: ${dKm} km`);
    });

    it('soporta cálculo en metros con unidad: "m"', () => {
      const dKm = calcularDistanciaHaversine(MADRID, VALENCIA, { unidad: 'km' });
      const dMetros = calcularDistanciaHaversine(MADRID, VALENCIA, { unidad: 'm' });

      // dMetros debe ser aproximadamente dKm * 1000
      assert.ok(Math.abs(dMetros - dKm * 1000) < 100);
      assert.ok(dMetros >= 301000 && dMetros <= 304000);
    });

    it('propiedad de simetría: d(A, B) === d(B, A)', () => {
      const d1 = calcularDistanciaHaversine(MADRID, BILBAO);
      const d2 = calcularDistanciaHaversine(BILBAO, MADRID);
      assert.equal(d1, d2);
    });

    it('desigualdad triangular: d(A, C) <= d(A, B) + d(B, C)', () => {
      // Madrid a Barcelona pasando por Valencia
      const dDirecta = calcularDistanciaHaversine(MADRID, BARCELONA);
      const dPorValencia =
        calcularDistanciaHaversine(MADRID, VALENCIA) +
        calcularDistanciaHaversine(VALENCIA, BARCELONA);

      assert.ok(dDirecta <= dPorValencia, 'La distancia ortodrómica directa debe ser la mínima');
    });

    it('calcularDistanciaOrtodromica funciona como sobrecarga numérica', () => {
      const dDirecta = calcularDistanciaHaversine(MADRID, BARCELONA);
      const dSobrecarga = calcularDistanciaOrtodromica(
        MADRID.lat,
        MADRID.lon,
        BARCELONA.lat,
        BARCELONA.lon
      );
      assert.equal(dDirecta, dSobrecarga);
    });

    it('calcula 1 grado de latitud en el ecuador (~111.19 km)', () => {
      const p1 = { lat: 0, lon: 0 };
      const p2 = { lat: 1, lon: 0 };
      const d = calcularDistanciaHaversine(p1, p2);
      assert.ok(Math.abs(d - 111.19) < 0.2, `1 grado de latitud: ${d} km`);
    });

    it('puntos antípodas calculan la mitad de la circunferencia terrestre (~20015 km)', () => {
      const poloNorte = { lat: 90, lon: 0 };
      const poloSur = { lat: -90, lon: 0 };
      const d = calcularDistanciaHaversine(poloNorte, poloSur);
      const semiCircunferencia = Math.PI * RADIO_TIERRA_KM;
      assert.ok(Math.abs(d - semiCircunferencia) < 1, `Antípodas: ${d} km vs ${semiCircunferencia} km`);
    });
  });

  describe('Rendimiento sub-milisegundo (< 1 ms)', () => {
    it('ejecución de 10.000 cálculos de Haversine en menos de 20 ms (< 0.002 ms por cálculo)', () => {
      const inicio = performance.now();
      const ITERACIONES = 10000;

      for (let i = 0; i < ITERACIONES; i++) {
        calcularDistanciaHaversine(MADRID, BARCELONA);
      }

      const tiempoTotalMs = performance.now() - inicio;
      const tiempoPorCalculoMs = tiempoTotalMs / ITERACIONES;

      // Un cálculo individual debe ser infinitamente inferior al requisito de 1 ms
      assert.ok(
        tiempoPorCalculoMs < 0.05,
        `Tiempo medio por cálculo: ${tiempoPorCalculoMs.toFixed(6)} ms (debe ser << 1 ms)`
      );
      assert.ok(
        tiempoTotalMs < 100,
        `Tiempo total para 10.000 cálculos: ${tiempoTotalMs.toFixed(2)} ms`
      );
    });
  });
});
