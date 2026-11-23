import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { crearOrganizacion, obtenerOrganizacionPorId } from '../../src/organizacion/organizacion.js';
import {
  validarLogotipo,
  asignarLogotipo,
  eliminarLogotipo,
  serializarParametrosCabecera,
  deserializarParametrosCabecera,
  construirCabeceraInforme,
  MAX_BYTES_LOGO,
  CONFIG_CABECERA_DEFECTO
} from '../../src/organizacion/personalizacion.js';

describe('TTTRUCKS-34 Subtarea TTTRUCKS-36 - Gestión de Logotipo y Personalización de Cabeceras', () => {
  describe('Validación de logotipos corporativos', () => {
    it('Valida rutas relativas y absolutas con extensiones permitidas (.png, .jpg, .svg, .webp)', () => {
      assert.equal(validarLogotipo('/assets/branding/logo.svg').valido, true);
      assert.equal(validarLogotipo('https://cdn.tttrucks.com/logo.png').valido, true);
      assert.equal(validarLogotipo('img/empresa.webp').valido, true);
    });

    it('Valida Data URLs en Base64 con tipos MIME permitidos', () => {
      const dataUrlPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = validarLogotipo(dataUrlPng);
      assert.equal(res.valido, true);
      assert.equal(res.tipo, 'data_url');
      assert.ok(res.tamanoBytes > 0);
    });

    it('Rechaza formatos no permitidos, extensiones no soportadas o rutas sin extensión', () => {
      assert.throws(() => validarLogotipo('logo.bmp'), /Extensión "\.bmp" no permitida/);
      assert.throws(() => validarLogotipo('logo.exe'), /Extensión "\.exe" no permitida/);
      assert.throws(() => validarLogotipo('ruta_sin_extension'), /debe incluir una extensión/);
      assert.throws(() => validarLogotipo(''), /no puede estar vacío/);
    });

    it('Rechaza Data URLs con tipos MIME no permitidos', () => {
      assert.throws(
        () => validarLogotipo('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
        /Tipo MIME "image\/gif" no permitido/
      );
    });

    it('Rechaza Data URLs que sobrepasen el tamaño máximo permitido (512 KB)', () => {
      // Generar base64 grande (~600 KB)
      const base64Excesivo = 'A'.repeat(800 * 1024);
      assert.throws(
        () => validarLogotipo(`data:image/png;base64,${base64Excesivo}`),
        /El logotipo excede el tamaño máximo permitido/
      );
    });
  });

  describe('Persistencia de logotipo en base de datos SQLite', () => {
    let db;

    beforeEach(async () => {
      db = new DatabaseSync(':memory:');
      const schemaPath = resolve(process.cwd(), 'sql/schema.sql');
      const schemaSql = readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql);

      await crearOrganizacion(db, {
        cif: 'B12345678',
        razon_social: 'TransTrucks SL'
      });
    });

    it('asignarLogotipo actualiza el campo logo_url de la organización', async () => {
      const actualizada = await asignarLogotipo(db, 1, '/img/logo_oficial.svg');
      assert.equal(actualizada.logo_url, '/img/logo_oficial.svg');

      const enBd = await obtenerOrganizacionPorId(db, 1);
      assert.equal(enBd.logo_url, '/img/logo_oficial.svg');
    });

    it('eliminarLogotipo restablece el campo logo_url a null', async () => {
      await asignarLogotipo(db, 1, '/img/logo_oficial.svg');
      const sinLogo = await eliminarLogotipo(db, 1);
      assert.equal(sinLogo.logo_url, null);

      const enBd = await obtenerOrganizacionPorId(db, 1);
      assert.equal(enBd.logo_url, null);
    });
  });

  describe('Serialización de parámetros de personalización institucional', () => {
    it('serializarParametrosCabecera genera JSON con valores por defecto combinados', () => {
      const json = serializarParametrosCabecera({ color_primario: '#D97706', layout: 'compacto' });
      const obj = JSON.parse(json);

      assert.equal(obj.color_primario, '#D97706');
      assert.equal(obj.layout, 'compacto');
      assert.equal(obj.color_secundario, CONFIG_CABECERA_DEFECTO.color_secundario);
      assert.equal(obj.mostrar_logo, true);
    });

    it('deserializarParametrosCabecera recupera la configuración de forma tolerante a errores', () => {
      const conf = deserializarParametrosCabecera('{"color_primario":"#000000"}');
      assert.equal(conf.color_primario, '#000000');
      assert.equal(conf.layout, 'estandar');

      // Ante JSON roto o nulo retorna los defaults
      assert.deepEqual(deserializarParametrosCabecera('json-invalido'), CONFIG_CABECERA_DEFECTO);
      assert.deepEqual(deserializarParametrosCabecera(null), CONFIG_CABECERA_DEFECTO);
    });
  });

  describe('Construcción y renderizado de cabeceras de informes operativos', () => {
    const org = {
      id_organizacion: 1,
      cif: 'B12345678',
      razon_social: 'TransTrucks Logistics SL',
      direccion: 'Autovía del Mediterráneo Km 200',
      cp: '30840',
      ciudad: 'Alhama de Murcia',
      provincia: 'Murcia',
      telefono: '968555666',
      email: 'logistica@tttrucks.com',
      logo_url: '/img/logo.png'
    };

    it('construirCabeceraInforme genera el modelo completo con datos fiscales y branding', () => {
      const cabecera = construirCabeceraInforme(org, {
        color_primario: '#0F172A',
        layout: 'extendido'
      });

      assert.equal(cabecera.empresa.razon_social, 'TransTrucks Logistics SL');
      assert.equal(cabecera.empresa.cif, 'B12345678');
      assert.equal(cabecera.branding.logo_url, '/img/logo.png');
      assert.equal(cabecera.branding.tiene_logo, true);
      assert.equal(cabecera.branding.color_primario, '#0F172A');
      assert.equal(cabecera.presentacion.layout, 'extendido');
      assert.ok(cabecera.presentacion.fecha_emision_utc.endsWith('Z'));
    });

    it('Oculta el logo si la personalización lo deshabilita', () => {
      const cabecera = construirCabeceraInforme(org, { mostrar_logo: false });
      assert.equal(cabecera.branding.tiene_logo, false);
      assert.equal(cabecera.branding.logo_url, null);
    });

    it('renderHtml produce código HTML semántico con los datos fiscales de cabecera', () => {
      const cabecera = construirCabeceraInforme(org);
      const html = cabecera.renderHtml();

      assert.ok(html.includes('TransTrucks Logistics SL'));
      assert.ok(html.includes('CIF: B12345678'));
      assert.ok(html.includes('<img src="/img/logo.png"'));
      assert.ok(html.includes('Autovía del Mediterráneo Km 200 30840 Alhama de Murcia (Murcia)'));
    });
  });
});
