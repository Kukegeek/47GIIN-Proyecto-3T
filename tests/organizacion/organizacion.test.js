import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validarCIF,
  crearOrganizacion,
  obtenerOrganizacionPorId,
  obtenerOrganizacionPorCif,
  obtenerOrganizacionActiva,
  obtenerCabeceraInformes,
  listarOrganizaciones,
  actualizarOrganizacion,
  restablecerParametrosOpcionales,
  bajaLogicaOrganizacion,
  reactivarOrganizacion
} from '../../src/organizacion/organizacion.js';

describe('TTTRUCKS-34 Subtarea TTTRUCKS-35 - CRUD 14 Configuración Corporativa de la Organización', () => {
  let db;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    const schemaPath = resolve(process.cwd(), 'sql/schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  });

  describe('Validación de CIF', () => {
    it('Valida CIFs españoles correctos', () => {
      assert.equal(validarCIF('B12345678'), true);
      assert.equal(validarCIF('A28000000'), true);
      assert.equal(validarCIF('B87654321'), true);
    });

    it('Rechaza formatos inválidos o valores vacíos', () => {
      assert.equal(validarCIF(''), false);
      assert.equal(validarCIF(null), false);
      assert.equal(validarCIF('123'), false);
      assert.equal(validarCIF('CIFDEMASIADOLARGO123'), false);
    });
  });

  describe('CREATE: Alta inicial de organización', () => {
    it('crearOrganizacion inserta y retorna la empresa con parámetros fiscales y opcionales', async () => {
      const org = await crearOrganizacion(db, {
        cif: 'B12345678',
        razon_social: 'Transportes TransTrucks SL',
        direccion: 'Polígono Industrial Oeste, Calle 5',
        cp: '30169',
        ciudad: 'San Ginés',
        provincia: 'Murcia',
        telefono: '968000111',
        email: 'contacto@tttrucks.com',
        logo_url: '/assets/logo.png'
      });

      assert.ok(org.id_organizacion > 0);
      assert.equal(org.cif, 'B12345678');
      assert.equal(org.razon_social, 'Transportes TransTrucks SL');
      assert.equal(org.ciudad, 'San Ginés');
      assert.equal(org.activo, 1);
      assert.ok(org.creado_en);
      assert.ok(org.actualizado_en);
    });

    it('Valida obligatoriedad de razón social y formato de CIF', async () => {
      await assert.rejects(
        async () => crearOrganizacion(db, { cif: 'B12345678', razon_social: '' }),
        /La razón social de la empresa es obligatoria/
      );

      await assert.rejects(
        async () => crearOrganizacion(db, { cif: 'invalido', razon_social: 'Empresa Test' }),
        /El formato del CIF\/NIF/
      );
    });

    it('Rechaza inserción de CIF duplicado', async () => {
      await crearOrganizacion(db, { cif: 'B12345678', razon_social: 'Empresa 1' });

      await assert.rejects(
        async () => crearOrganizacion(db, { cif: 'B12345678', razon_social: 'Empresa 2' }),
        /Ya existe una organización registrada con el CIF/
      );
    });
  });

  describe('READ: Consultas y cabeceras de informes', () => {
    beforeEach(async () => {
      await crearOrganizacion(db, {
        cif: 'B12345678',
        razon_social: 'Transportes TransTrucks SL',
        direccion: 'Calle Mayor 1',
        cp: '30001',
        ciudad: 'Murcia',
        provincia: 'Murcia',
        telefono: '968123456',
        email: 'info@tttrucks.com',
        logo_url: '/img/logo.svg'
      });
    });

    it('obtenerOrganizacionPorId y obtenerOrganizacionPorCif recuperan los datos correctamente', async () => {
      const porId = await obtenerOrganizacionPorId(db, 1);
      assert.equal(porId.razon_social, 'Transportes TransTrucks SL');

      const porCif = await obtenerOrganizacionPorCif(db, 'b12345678'); // Insensible a mayúsculas
      assert.equal(porCif.id_organizacion, 1);
    });

    it('obtenerOrganizacionActiva retorna la empresa principal', async () => {
      const activa = await obtenerOrganizacionActiva(db);
      assert.ok(activa);
      assert.equal(activa.cif, 'B12345678');
    });

    it('obtenerCabeceraInformes serializa los datos listos para perfiles y cabeceras de informes', async () => {
      const cabecera = await obtenerCabeceraInformes(db, 1);
      assert.ok(cabecera);
      assert.equal(cabecera.razon_social, 'Transportes TransTrucks SL');
      assert.equal(cabecera.cif, 'B12345678');
      assert.equal(cabecera.direccion_completa, 'Calle Mayor 1 30001 Murcia (Murcia)');
      assert.equal(cabecera.contacto, '968123456 | info@tttrucks.com');
      assert.equal(cabecera.logo_url, '/img/logo.svg');
      assert.equal(cabecera.activo, true);
    });

    it('listarOrganizaciones retorna la lista completa y admite filtro de activas', async () => {
      await crearOrganizacion(db, { cif: 'A28000000', razon_social: 'Empresa Inactiva' });
      await bajaLogicaOrganizacion(db, 2);

      const todas = await listarOrganizaciones(db);
      assert.equal(todas.length, 2);

      const soloActivas = await listarOrganizaciones(db, { soloActivas: true });
      assert.equal(soloActivas.length, 1);
      assert.equal(soloActivas[0].cif, 'B12345678');
    });
  });

  describe('UPDATE: Modificación de perfil fiscal', () => {
    it('actualizarOrganizacion modifica campos fiscales y actualiza timestamp', async () => {
      await crearOrganizacion(db, { cif: 'B12345678', razon_social: 'Nombre Antiguo' });

      const actualizada = await actualizarOrganizacion(db, 1, {
        razon_social: 'Nombre Nuevo SA',
        ciudad: 'Cartagena'
      });

      assert.equal(actualizada.razon_social, 'Nombre Nuevo SA');
      assert.equal(actualizada.ciudad, 'Cartagena');
    });

    it('actualizarOrganizacion rechaza colisión de CIF con otra empresa', async () => {
      await crearOrganizacion(db, { cif: 'B11111111', razon_social: 'Empresa A' });
      await crearOrganizacion(db, { cif: 'B22222222', razon_social: 'Empresa B' });

      await assert.rejects(
        async () => actualizarOrganizacion(db, 2, { cif: 'B11111111' }),
        /ya está registrado en otra organización/
      );
    });
  });

  describe('DELETE: Limpieza de parámetros opcionales y baja lógica', () => {
    it('restablecerParametrosOpcionales limpia contacto, logo y dirección manteniendo CIF y razón social', async () => {
      await crearOrganizacion(db, {
        cif: 'B12345678',
        razon_social: 'Transportes SA',
        direccion: 'Calle 1',
        telefono: '999',
        logo_url: 'logo.png'
      });

      const restablecida = await restablecerParametrosOpcionales(db, 1);
      assert.equal(restablecida.cif, 'B12345678');
      assert.equal(restablecida.razon_social, 'Transportes SA');
      assert.equal(restablecida.direccion, null);
      assert.equal(restablecida.telefono, null);
      assert.equal(restablecida.logo_url, null);
    });

    it('bajaLogicaOrganizacion y reactivarOrganizacion gestionan el estado activo', async () => {
      await crearOrganizacion(db, { cif: 'B12345678', razon_social: 'Transportes SA' });

      const baja = await bajaLogicaOrganizacion(db, 1);
      assert.equal(baja.activo, 0);

      const reactivada = await reactivarOrganizacion(db, 1);
      assert.equal(reactivada.activo, 1);
    });
  });
});
