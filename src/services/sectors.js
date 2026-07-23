/**
 * Obtiene todos los sectores / industrias.
 * @returns {Promise<any[]>}
 */
export async function getSectors() {
  const res = await fetch('/api/sectors');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al obtener sectores');
  return body.data;
}

/**
 * Agrega un nuevo sector.
 * @param {string} name
 * @returns {Promise<any>}
 */
export async function addSector(name) {
  const res = await fetch('/api/sectors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al agregar sector');
  return body.data;
}

/**
 * Actualiza el nombre de un sector existente.
 * @param {number} id
 * @param {string} name
 * @returns {Promise<any>}
 */
export async function updateSector(id, name) {
  const res = await fetch('/api/sectors', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al actualizar sector');
  return body.data;
}

/**
 * Elimina un sector por su ID.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteSector(id) {
  const res = await fetch(`/api/sectors?id=${id}`, {
    method: 'DELETE'
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al eliminar sector');
  return body.data;
}
