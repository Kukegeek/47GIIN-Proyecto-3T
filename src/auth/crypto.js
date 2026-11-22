// Utilidades criptográficas nativas Web Crypto API (TTTRUCKS-25 / TTTRUCKS-26)
// Implementación estándar sin dependencias externas para SHA-256 y generación de salt.

/**
 * Genera una sal criptográfica pseudoaleatoria en formato hexadecimal
 * @param {number} longitudBytes - Longitud en bytes (por defecto 16 bytes = 32 caracteres hex)
 * @returns {string} Salt en formato hexadecimal
 */
export function generarSalt(longitudBytes = 16) {
  const bytes = new Uint8Array(longitudBytes);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calcula el hash SHA-256 de una contraseña concatenada con su sal
 * @param {string} password - Contraseña en texto plano
 * @param {string} salt - Sal criptográfica en hexadecimal
 * @returns {Promise<string>} Hash SHA-256 en formato hexadecimal
 */
export async function hashearPassword(password, salt) {
  if (!password || typeof password !== 'string') {
    throw new Error('La contraseña es obligatoria.');
  }
  if (!salt || typeof salt !== 'string') {
    throw new Error('La sal criptográfica es obligatoria.');
  }

  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica si una contraseña candidata coincide con el hash almacenado
 * @param {string} passwordCandidata 
 * @param {string} salt 
 * @param {string} hashAlmacenado 
 * @returns {Promise<boolean>}
 */
export async function verificarPassword(passwordCandidata, salt, hashAlmacenado) {
  if (!passwordCandidata || !salt || !hashAlmacenado) return false;
  const hashCalculado = await hashearPassword(passwordCandidata, salt);
  return hashCalculado === hashAlmacenado;
}
