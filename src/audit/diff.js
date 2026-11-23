// Motor de cálculo de diferencias (diff JSON), marcas temporales UTC y origen de sesión
// TTTRUCKS-30: Subtarea TTTRUCKS-32

export const CAMPOS_SENSIBLES = Object.freeze(['password', 'password_hash', 'salt', 'token']);

export const ORIGENES_SESION_VALIDOS = Object.freeze([
  'local_pwa',
  'movil_conductor',
  'tablet_offline',
  'vps_sync',
  'sistema'
]);

/**
 * Genera una marca temporal UTC en formato estándar ISO-8601 estricto
 * @param {Date|string|number} [fecha]
 * @returns {string} Timestamp en formato YYYY-MM-DDTHH:mm:ss.sssZ
 */
export function generarTimestampUTC(fecha = new Date()) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) {
    throw new Error('Fecha inválida proporcionada para timestamp UTC.');
  }
  return d.toISOString();
}

/**
 * Valida si una cadena cumple con el formato ISO-8601 UTC
 * @param {string} timestamp
 * @returns {boolean}
 */
export function esTimestampUTCValido(timestamp) {
  if (!timestamp || typeof timestamp !== 'string') return false;
  const isoUtcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
  return isoUtcRegex.test(timestamp) && !isNaN(Date.parse(timestamp));
}

/**
 * Determina el origen de la sesión resolviendo fuentes locales o remotas
 * @param {object} [sesion]
 * @param {string} [origenPorDefecto='local_pwa']
 * @returns {string}
 */
export function resolverOrigenSesion(sesion = null, origenPorDefecto = 'local_pwa') {
  const origen = sesion?.origen_sesion || origenPorDefecto;
  return typeof origen === 'string' && origen.trim() ? origen.trim() : 'local_pwa';
}

/**
 * Sanitiza campos sensibles de un objeto antes de persistir el diff de auditoría
 */
function sanitizarObjeto(obj, camposSensibles = CAMPOS_SENSIBLES) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const copia = { ...obj };
  for (const campo of camposSensibles) {
    if (campo in copia) {
      copia[campo] = '[REDACTADO]';
    }
  }
  return copia;
}

/**
 * Calcula la diferencia atómica (diff) entre dos estados (anterior y nuevo)
 * Genera las cadenas JSON normalizadas para valor_anterior y valor_nuevo.
 *
 * @param {object|null} anterior - Estado previo del registro
 * @param {object|null} nuevo - Estado posterior a la mutación
 * @param {object} [opciones]
 * @param {boolean} [opciones.redactarSensibles=true]
 * @returns {{ valor_anterior: string|null, valor_nuevo: string|null, cambiosDetectados: boolean, clavesModificadas: string[] }}
 */
export function calcularDiff(anterior = null, nuevo = null, opciones = {}) {
  const { redactarSensibles = true } = opciones;

  // Caso 1: ALTA / INSERT (no había estado anterior)
  if (anterior == null && nuevo != null) {
    const nvo = redactarSensibles ? sanitizarObjeto(nuevo) : nuevo;
    return {
      valor_anterior: null,
      valor_nuevo: JSON.stringify(nvo),
      cambiosDetectados: true,
      clavesModificadas: Object.keys(nuevo)
    };
  }

  // Caso 2: BORRADO / DELETE (no hay estado posterior)
  if (anterior != null && nuevo == null) {
    const ant = redactarSensibles ? sanitizarObjeto(anterior) : anterior;
    return {
      valor_anterior: JSON.stringify(ant),
      valor_nuevo: null,
      cambiosDetectados: true,
      clavesModificadas: Object.keys(anterior)
    };
  }

  // Caso 3: Ambos nulos o indefinidos
  if (anterior == null && nuevo == null) {
    return {
      valor_anterior: null,
      valor_nuevo: null,
      cambiosDetectados: false,
      clavesModificadas: []
    };
  }

  // Caso 4: MODIFICACIÓN / UPDATE
  // Si no son objetos (ej. valores primitivos directos)
  if (typeof anterior !== 'object' || typeof nuevo !== 'object') {
    const cambio = anterior !== nuevo;
    return {
      valor_anterior: JSON.stringify(anterior),
      valor_nuevo: JSON.stringify(nuevo),
      cambiosDetectados: cambio,
      clavesModificadas: cambio ? ['valor'] : []
    };
  }

  const todasClaves = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);
  const diffAnterior = {};
  const diffNuevo = {};
  const clavesModificadas = [];

  for (const k of todasClaves) {
    const valAnt = anterior[k];
    const valNvo = nuevo[k];

    // Comparación por serialización para objetos/arrays anidados o valor estricto
    const sonIguales = (valAnt === valNvo) ||
      (valAnt != null && valNvo != null && JSON.stringify(valAnt) === JSON.stringify(valNvo));

    if (!sonIguales) {
      const esSensible = redactarSensibles && CAMPOS_SENSIBLES.includes(k);
      if (valAnt !== undefined) diffAnterior[k] = esSensible ? '[REDACTADO]' : valAnt;
      if (valNvo !== undefined) diffNuevo[k] = esSensible ? '[REDACTADO]' : valNvo;
      clavesModificadas.push(k);
    }
  }

  const cambiosDetectados = clavesModificadas.length > 0;

  return {
    valor_anterior: cambiosDetectados ? JSON.stringify(diffAnterior) : null,
    valor_nuevo: cambiosDetectados ? JSON.stringify(diffNuevo) : null,
    cambiosDetectados,
    clavesModificadas
  };
}

/**
 * Prepara el evento de auditoría completo incorporando diff JSON, timestamp UTC y origen de sesión
 *
 * @param {object} params
 * @param {string} params.accion - INSERT, UPDATE, DELETE, LOGIN
 * @param {string} params.entidad - Nombre de la tabla o entidad auditada
 * @param {string|number} [params.id_registro]
 * @param {object|null} [params.anterior] - Estado previo
 * @param {object|null} [params.nuevo] - Estado posterior
 * @param {object|null} [params.sesion] - Sesión del usuario autenticado
 * @param {string} [params.origen_sesion] - Origen explícito opcional
 * @returns {object} Evento listo para persistir en log_auditoria
 */
export function prepararEventoAuditoria(params) {
  const {
    accion,
    entidad,
    id_registro = null,
    anterior = null,
    nuevo = null,
    sesion = null,
    origen_sesion = null
  } = params || {};

  const { valor_anterior, valor_nuevo } = calcularDiff(anterior, nuevo);
  const timestamp_utc = generarTimestampUTC();
  const origen = origen_sesion || resolverOrigenSesion(sesion);

  return {
    id_usuario: sesion?.id_usuario ?? null,
    username: sesion?.username ?? 'sistema',
    rol_ejecutor: sesion?.rol ?? 'ROL_SISTEMA',
    accion: (accion || 'UPDATE').toUpperCase(),
    entidad,
    id_registro: id_registro != null ? String(id_registro) : null,
    valor_anterior,
    valor_nuevo,
    timestamp_utc,
    origen_sesion: origen
  };
}
