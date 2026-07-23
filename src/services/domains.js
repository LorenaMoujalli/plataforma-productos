/**
 * Obtiene todos los dominios permitidos.
 * @returns {Promise<any[]>}
 */
export async function getDomains() {
  const res = await fetch('/api/domains');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al obtener dominios');
  return body.data;
}

/**
 * Agrega un nuevo dominio permitido.
 * @param {string} domain
 * @returns {Promise<any>}
 */
export async function addDomain(domain) {
  const res = await fetch('/api/domains', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al agregar dominio');
  return body.data;
}

/**
 * Actualiza el valor de un dominio existente.
 * @param {number} id
 * @param {string} domain
 * @returns {Promise<any>}
 */
export async function updateDomain(id, domain) {
  const res = await fetch('/api/domains', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, domain })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al actualizar dominio');
  return body.data;
}

/**
 * Elimina un dominio permitido por su ID, eliminando en cascada los usuarios asociados.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteDomain(id) {
  const res = await fetch(`/api/domains?id=${id}`, {
    method: 'DELETE'
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al eliminar dominio');
  return body.data;
}

/**
 * Devuelve solo los nombres de dominio (array de strings) para validaciones client-side.
 * @returns {Promise<string[]>}
 */
export async function getAllowedDomainNames() {
  const list = await getDomains();
  return (list || []).map(d => d.domain.toLowerCase());
}
