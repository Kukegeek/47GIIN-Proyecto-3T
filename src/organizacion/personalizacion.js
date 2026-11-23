// Gestión del logotipo corporativo y serialización de personalización para cabeceras de informes
// TTTRUCKS-34: Subtarea TTTRUCKS-36

import { obtenerOrganizacionPorId, actualizarOrganizacion } from './organizacion.js';

export const MIMES_LOGO_PERMITIDOS = Object.freeze([
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp'
]);

export const EXTENSIONES_LOGO_PERMITIDAS = Object.freeze([
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.webp'
]);

export const MAX_BYTES_LOGO = 512 * 1024; // 512 KB para evitar sobrecarga en base de datos local

export const CONFIG_CABECERA_DEFECTO = Object.freeze({
  color_primario: '#1E3A8A', // Azul corporativo
  color_secundario: '#64748B', // Pizarra
  mostrar_logo: true,
  mostrar_contacto: true,
  layout: 'estandar', // 'estandar' | 'compacto' | 'extendido'
  texto_pie_legal: 'Documento oficial generado por la plataforma TransTrucks Fleet Local-First.',
  incluir_fecha_emision: true
});

/**
 * Valida la estructura, formato y tamaño de un logotipo corporativo
 * Admite tanto rutas/URLs relativas como Data URLs Base64.
 *
 * @param {string} logo - Ruta URL o Data URL Base64
 * @returns {{ valido: boolean, tipo: 'data_url'|'url'|'svg', tamanoBytes?: number }}
 */
export function validarLogotipo(logo) {
  if (!logo || typeof logo !== 'string' || !logo.trim()) {
    throw new Error('El logotipo no puede estar vacío.');
  }

  const limpio = logo.trim();

  // Caso 1: Data URL en Base64 (data:image/...;base64,...)
  if (limpio.startsWith('data:image/')) {
    const match = limpio.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Formato de Data URL inválido. Debe ser "data:image/<tipo>;base64,<datos>".');
    }

    const mime = match[1].toLowerCase();
    if (!MIMES_LOGO_PERMITIDOS.includes(mime)) {
      throw new Error(`Tipo MIME "${mime}" no permitido. Permitidos: ${MIMES_LOGO_PERMITIDOS.join(', ')}`);
    }

    const base64Data = match[2];
    // Estimación de tamaño en bytes: (longitud base64 * 3 / 4)
    const tamanoBytes = Math.floor((base64Data.length * 3) / 4);
    if (tamanoBytes > MAX_BYTES_LOGO) {
      throw new Error(`El logotipo excede el tamaño máximo permitido de ${MAX_BYTES_LOGO / 1024} KB (recibido: ${Math.round(tamanoBytes / 1024)} KB).`);
    }

    return { valido: true, tipo: 'data_url', tamanoBytes, mime };
  }

  // Caso 2: Ruta de archivo o URL relativa/absoluta
  const extensionMatch = limpio.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  if (!extensionMatch) {
    throw new Error('La ruta del logotipo debe incluir una extensión de imagen válida (.png, .jpg, .svg, .webp).');
  }

  const ext = `.${extensionMatch[1].toLowerCase()}`;
  if (!EXTENSIONES_LOGO_PERMITIDAS.includes(ext)) {
    throw new Error(`Extensión "${ext}" no permitida para el logotipo. Permitidas: ${EXTENSIONES_LOGO_PERMITIDAS.join(', ')}`);
  }

  return { valido: true, tipo: ext === '.svg' ? 'svg' : 'url', extension: ext };
}

/**
 * Asigna y persiste el logotipo corporativo en la organización indicada
 * @param {object} db - Cliente SQLite o DatabaseSync
 * @param {number} id_organizacion - ID de la organización
 * @param {string} logo - Ruta o Data URL validada
 * @returns {Promise<object>} Organización actualizada
 */
export async function asignarLogotipo(db, id_organizacion, logo) {
  validarLogotipo(logo);
  return actualizarOrganizacion(db, id_organizacion, { logo_url: logo.trim() });
}

/**
 * Elimina el logotipo corporativo restableciéndolo a NULL
 * @param {object} db - Cliente SQLite o DatabaseSync
 * @param {number} id_organizacion - ID de la organización
 * @returns {Promise<object>} Organización actualizada
 */
export async function eliminarLogotipo(db, id_organizacion) {
  return actualizarOrganizacion(db, id_organizacion, { logo_url: null });
}

/**
 * Serializa los parámetros de personalización institucional para cabeceras de informes en JSON
 * @param {object} [opciones={}]
 * @returns {string} JSON normalizado
 */
export function serializarParametrosCabecera(opciones = {}) {
  const combinada = {
    ...CONFIG_CABECERA_DEFECTO,
    ...opciones
  };

  // Validaciones de layout
  const layoutsValidos = ['estandar', 'compacto', 'extendido'];
  if (!layoutsValidos.includes(combinada.layout)) {
    combinada.layout = 'estandar';
  }

  return JSON.stringify(combinada);
}

/**
 * Deserializa y normaliza parámetros de personalización desde un JSON
 * @param {string|null} jsonStr
 * @returns {object} Parámetros normalizados con valores por defecto
 */
export function deserializarParametrosCabecera(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') {
    return { ...CONFIG_CABECERA_DEFECTO };
  }

  try {
    const parseado = JSON.parse(jsonStr);
    return {
      ...CONFIG_CABECERA_DEFECTO,
      ...parseado
    };
  } catch {
    return { ...CONFIG_CABECERA_DEFECTO };
  }
}

/**
 * Construye el modelo canónico estructurado de cabecera institucional para informes operativos
 * Combina los datos fiscales de la organización con la personalización visual y el logotipo.
 *
 * @param {object} organizacion - Registro de organizacion
 * @param {object|string} [personalizacion={}] - Opciones de personalización u objeto JSON serializado
 * @returns {object} Modelo institucional listo para ser renderizado en informes PDF o vistas
 */
export function construirCabeceraInforme(organizacion, personalizacion = {}) {
  if (!organizacion || typeof organizacion !== 'object') {
    throw new Error('Los datos de la organización son obligatorios para construir la cabecera.');
  }

  const config = typeof personalizacion === 'string'
    ? deserializarParametrosCabecera(personalizacion)
    : { ...CONFIG_CABECERA_DEFECTO, ...personalizacion };

  const partesDireccion = [
    organizacion.direccion,
    organizacion.cp,
    organizacion.ciudad,
    organizacion.provincia ? `(${organizacion.provincia})` : null
  ].filter(Boolean).join(' ');

  const contactoPartes = [organizacion.telefono, organizacion.email].filter(Boolean);

  const fechaEmisionUtc = config.incluir_fecha_emision ? new Date().toISOString() : null;

  return {
    empresa: {
      id_organizacion: organizacion.id_organizacion,
      razon_social: organizacion.razon_social,
      cif: organizacion.cif,
      direccion_completa: partesDireccion || 'Dirección fiscal no especificada',
      contacto: contactoPartes.join(' | ') || 'Contacto no disponible',
      telefono: organizacion.telefono || null,
      email: organizacion.email || null
    },
    branding: {
      logo_url: config.mostrar_logo ? (organizacion.logo_url || null) : null,
      tiene_logo: Boolean(config.mostrar_logo && organizacion.logo_url),
      color_primario: config.color_primario,
      color_secundario: config.color_secundario
    },
    presentacion: {
      layout: config.layout,
      pie_legal: config.texto_pie_legal,
      fecha_emision_utc: fechaEmisionUtc
    },
    /**
     * Renderiza un fragmento HTML semántico listo para cabeceras de informes
     */
    renderHtml() {
      const logoHtml = this.branding.tiene_logo
        ? `<img src="${this.branding.logo_url}" alt="${this.empresa.razon_social}" class="report-logo" style="max-height: 48px; max-width: 160px; object-fit: contain;" />`
        : `<div class="report-logo-fallback" style="font-weight: bold; font-size: 1.1rem; color: ${this.branding.color_primario};">${this.empresa.razon_social}</div>`;

      return `
<header class="informe-cabecera informe-${this.presentacion.layout}" style="border-bottom: 2px solid ${this.branding.color_primario}; padding-bottom: 8px; margin-bottom: 16px;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div class="informe-marca">${logoHtml}</div>
    <div class="informe-fiscal" style="text-align: right; font-size: 0.85rem; color: ${this.branding.color_secundario};">
      <div style="font-weight: bold; color: #111;">${this.empresa.razon_social}</div>
      <div>CIF: ${this.empresa.cif}</div>
      <div>${this.empresa.direccion_completa}</div>
      <div>${this.empresa.contacto}</div>
    </div>
  </div>
</header>
      `.trim();
    }
  };
}
