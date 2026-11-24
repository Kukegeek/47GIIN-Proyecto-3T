import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TortuosityEngine,
  identificarZonaGeografica,
  evaluarConexionTerrestre,
  estimarRutaVial,
  ZONAS_GEOGRAFICAS,
} from '../../src/rutas/tortuosity.js';

describe('TTTRUCKS-38 Subtarea TTTRUCKS-41 - Casos Límite: Distancias Nulas, Coordenadas Idénticas y Territorio Insular', () => {
  // Puntos geográficos peninsulares
  const MADRID = { lat: 40.416775, lon: -3.703790 };
  const BARCELONA = { lat: 41.387015, lon: 2.170047 };
  const VALENCIA = { lat: 39.469907, lon: -0.376288 };
  const ALGECIRAS = { lat: 36.1274, lon: -5.4536 };
  const CADIZ = { lat: 36.5298, lon: -6.2924 };

  // Puntos insulares Baleares
  const PALMA_MALLORCA = { lat: 39.5696, lon: 2.6502 };
  const ALCUDIA_MALLORCA = { lat: 39.8532, lon: 3.1214 }; // Misma isla (Mallorca)
  const MAHON_MENORCA = { lat: 39.8885, lon: 4.2658 }; // Menorca
  const IBIZA = { lat: 38.9067, lon: 1.4206 }; // Ibiza

  // Puntos insulares Canarias
  const SANTA_CRUZ_TENERIFE = { lat: 28.4636, lon: -16.2518 };
  const PUERTO_CRUZ_TENERIFE = { lat: 28.4167, lon: -16.5500 }; // Misma isla (Tenerife)
  const LAS_PALMAS_GRAN_CANARIA = { lat: 28.1235, lon: -15.4363 }; // Gran Canaria
  const ARRECIFE_LANZAROTE = { lat: 28.9630, lon: -13.5477 }; // Lanzarote

  // Ciudades Autónomas
  const CEUTA = { lat: 35.8894, lon: -5.3198 };
  const MELILLA = { lat: 35.2923, lon: -2.9381 };

  // Exterior
  const PARIS = { lat: 48.8566, lon: 2.3522 };

  describe('Identificación de Zonas Geográficas (identificarZonaGeografica)', () => {
    it('detecta correctamente coordenadas en la Península Ibérica', () => {
      const zMadrid = identificarZonaGeografica(MADRID);
      assert.equal(zMadrid.zona, ZONAS_GEOGRAFICAS.PENINSULA);
      assert.equal(zMadrid.subzona, 'PENINSULA');

      const zBarcelona = identificarZonaGeografica(BARCELONA);
      assert.equal(zBarcelona.zona, ZONAS_GEOGRAFICAS.PENINSULA);
    });

    it('detecta correctamente archipiélagos y subzonas insulares', () => {
      const zPalma = identificarZonaGeografica(PALMA_MALLORCA);
      assert.equal(zPalma.zona, ZONAS_GEOGRAFICAS.BALEARES);
      assert.equal(zPalma.subzona, 'MALLORCA');

      const zMahon = identificarZonaGeografica(MAHON_MENORCA);
      assert.equal(zMahon.zona, ZONAS_GEOGRAFICAS.BALEARES);
      assert.equal(zMahon.subzona, 'MENORCA');

      const zIbiza = identificarZonaGeografica(IBIZA);
      assert.equal(zIbiza.zona, ZONAS_GEOGRAFICAS.BALEARES);
      assert.equal(zIbiza.subzona, 'IBIZA_FORMENTERA');

      const zTenerife = identificarZonaGeografica(SANTA_CRUZ_TENERIFE);
      assert.equal(zTenerife.zona, ZONAS_GEOGRAFICAS.CANARIAS);
      assert.equal(zTenerife.subzona, 'TENERIFE');

      const zGranCanaria = identificarZonaGeografica(LAS_PALMAS_GRAN_CANARIA);
      assert.equal(zGranCanaria.zona, ZONAS_GEOGRAFICAS.CANARIAS);
      assert.equal(zGranCanaria.subzona, 'GRAN_CANARIA');

      const zLanzarote = identificarZonaGeografica(ARRECIFE_LANZAROTE);
      assert.equal(zLanzarote.zona, ZONAS_GEOGRAFICAS.CANARIAS);
      assert.equal(zLanzarote.subzona, 'LANZAROTE');
    });

    it('detecta Ceuta, Melilla y exterior', () => {
      const zCeuta = identificarZonaGeografica(CEUTA);
      assert.equal(zCeuta.zona, ZONAS_GEOGRAFICAS.CEUTA);

      const zMelilla = identificarZonaGeografica(MELILLA);
      assert.equal(zMelilla.zona, ZONAS_GEOGRAFICAS.MELILLA);

      const zParis = identificarZonaGeografica(PARIS);
      assert.equal(zParis.zona, ZONAS_GEOGRAFICAS.EXTERIOR);
    });
  });

  describe('Evaluación de Conectividad Terrestre (evaluarConexionTerrestre)', () => {
    it('rutas peninsulares continuas tienen conexionTerrestreDirecta: true', () => {
      const con = evaluarConexionTerrestre(MADRID, BARCELONA);
      assert.equal(con.conexionTerrestreDirecta, true);
      assert.equal(con.requiereFerry, false);
      assert.equal(con.aviso, null);
    });

    it('trayectos internos en la misma isla tienen conexionTerrestreDirecta: true', () => {
      // Palma a Alcúdia (dentro de Mallorca)
      const conMallorca = evaluarConexionTerrestre(PALMA_MALLORCA, ALCUDIA_MALLORCA);
      assert.equal(conMallorca.conexionTerrestreDirecta, true);
      assert.equal(conMallorca.requiereFerry, false);

      // Santa Cruz a Puerto de la Cruz (dentro de Tenerife)
      const conTenerife = evaluarConexionTerrestre(SANTA_CRUZ_TENERIFE, PUERTO_CRUZ_TENERIFE);
      assert.equal(conTenerife.conexionTerrestreDirecta, true);
      assert.equal(conTenerife.requiereFerry, false);
    });

    it('rutas entre península e islas detectan ausencia de conexión terrestre y necesidad de ferry', () => {
      // Valencia a Palma de Mallorca
      const conBaleares = evaluarConexionTerrestre(VALENCIA, PALMA_MALLORCA);
      assert.equal(conBaleares.conexionTerrestreDirecta, false);
      assert.equal(conBaleares.requiereFerry, true);
      assert.ok(/ferry/i.test(conBaleares.aviso));

      // Cádiz a Tenerife
      const conCanarias = evaluarConexionTerrestre(CADIZ, SANTA_CRUZ_TENERIFE);
      assert.equal(conCanarias.conexionTerrestreDirecta, false);
      assert.equal(conCanarias.requiereFerry, true);

      // Algeciras a Ceuta
      const conCeuta = evaluarConexionTerrestre(ALGECIRAS, CEUTA);
      assert.equal(conCeuta.conexionTerrestreDirecta, false);
      assert.equal(conCeuta.requiereFerry, true);
    });

    it('rutas interinsulares entre islas diferentes requieren ferry', () => {
      // Mallorca a Menorca
      const conInterinsular = evaluarConexionTerrestre(PALMA_MALLORCA, MAHON_MENORCA);
      assert.equal(conInterinsular.conexionTerrestreDirecta, false);
      assert.equal(conInterinsular.requiereFerry, true);
      assert.ok(/interinsular/i.test(conInterinsular.aviso));

      // Tenerife a Gran Canaria
      const conCanariasInter = evaluarConexionTerrestre(SANTA_CRUZ_TENERIFE, LAS_PALMAS_GRAN_CANARIA);
      assert.equal(conCanariasInter.conexionTerrestreDirecta, false);
      assert.equal(conCanariasInter.requiereFerry, true);
    });
  });

  describe('Criterio BDD Gherkin: Estimación sin errores de Coordenadas Idénticas e Insulares', () => {
    it('coordenadas idénticas devuelven distancia 0 y duración 0 sin error en < 1 ms', () => {
      const res = TortuosityEngine.estimar(MADRID, MADRID);

      assert.equal(res.distanciaGeodesicaKm, 0);
      assert.equal(res.distanciaEstimadaKm, 0);
      assert.equal(res.distanciaEstimadaMetros, 0);
      assert.equal(res.duracionEstimadaSegundos, 0);
      assert.equal(res.duracionEstimadaHoras, 0);
      assert.equal(res.duracionFormateada, '0m');
      assert.equal(res.esDistanciaNula, true);
      assert.equal(res.conexionTerrestreDirecta, true);
      assert.equal(res.requiereFerry, false);
      assert.equal(res.tipoPerfil, 'IDENTICO');
      assert.ok(res.tiempoCalculoMs < 1.0, `Tiempo: ${res.tiempoCalculoMs} ms`);
    });

    it('coordenadas con micro-desviación (< 1 cm) son tratadas como idénticas', () => {
      const microPunto = {
        lat: MADRID.lat + 1e-8,
        lon: MADRID.lon - 1e-8,
      };
      const res = estimarRutaVial(MADRID, microPunto);
      assert.equal(res.esDistanciaNula, true);
      assert.equal(res.distanciaEstimadaKm, 0);
    });

    it('rutas marítimas/insulares devuelven métricas intermodales y aviso de ferry sin lanzar excepciones', () => {
      // Valencia -> Palma de Mallorca (~260 km marítimos)
      const res = TortuosityEngine.previsualizar(VALENCIA, PALMA_MALLORCA);

      assert.ok(res.distanciaGeodesicaKm >= 250 && res.distanciaGeodesicaKm <= 270);
      assert.ok(res.distanciaEstimadaKm > 0);
      assert.ok(res.duracionEstimadaSegundos > 0);
      assert.equal(res.conexionTerrestreDirecta, false);
      assert.equal(res.requiereFerry, true);
      assert.equal(res.tipoPerfil, 'INSULAR_INTERMODAL');
      assert.ok(typeof res.aviso === 'string' && res.aviso.length > 0);
      assert.ok(res.tiempoCalculoMs < 1.0, `Tiempo: ${res.tiempoCalculoMs} ms`);
    });

    it('rutas dentro de la misma isla aplican perfil insular terrestre local sin requerir ferry', () => {
      // Palma a Alcúdia (~50 km)
      const res = TortuosityEngine.estimar(PALMA_MALLORCA, ALCUDIA_MALLORCA);

      assert.ok(res.distanciaGeodesicaKm >= 45 && res.distanciaGeodesicaKm <= 55);
      assert.equal(res.conexionTerrestreDirecta, true);
      assert.equal(res.requiereFerry, false);
      assert.equal(res.tipoPerfil, 'INSULAR_LOCAL');
      assert.equal(res.factorTortuosidad, 1.35);
      assert.equal(res.velocidadMediaKmh, 60);
      assert.ok(res.tiempoCalculoMs < 1.0);
    });
  });

  describe('Validación de Tipos y Casos Límite Geodésicos', () => {
    it('soporta coordenadas en extremos globales [-90, 90] y [-180, 180]', () => {
      const poloNorte = { lat: 90, lon: 0 };
      const puntoLimite = { lat: -90, lon: 180 };
      const res = estimarRutaVial(poloNorte, puntoLimite);

      assert.ok(Number.isFinite(res.distanciaGeodesicaKm));
      assert.ok(Number.isFinite(res.distanciaEstimadaKm));
    });

    it('rechaza entradas nulas, incompletas o no numéricas con errores canónicos', () => {
      assert.throws(() => estimarRutaVial(null, MADRID), TypeError);
      assert.throws(() => estimarRutaVial(MADRID, undefined), TypeError);
      assert.throws(() => estimarRutaVial({ lat: 'invalido', lon: 0 }, MADRID), TypeError);
      assert.throws(() => estimarRutaVial({ lat: 95, lon: 0 }, MADRID), RangeError);
      assert.throws(() => estimarRutaVial(MADRID, { lat: 0, lon: 200 }), RangeError);
    });

    it('rendimiento sub-milisegundo (< 1 ms) garantizado en todos los casos límite evaluados', () => {
      const casos = [
        [MADRID, MADRID],
        [VALENCIA, PALMA_MALLORCA],
        [CADIZ, SANTA_CRUZ_TENERIFE],
        [PALMA_MALLORCA, ALCUDIA_MALLORCA],
        [ALGECIRAS, CEUTA],
      ];

      for (const [o, d] of casos) {
        const res = TortuosityEngine.estimar(o, d);
        assert.ok(res.tiempoCalculoMs < 1.0, `Caso superó 1 ms: ${res.tiempoCalculoMs} ms`);
      }
    });
  });
});
