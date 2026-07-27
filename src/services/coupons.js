/**
 * Obtiene todos los cupones activos junto con los datos de su empresa,
 * ordenados por sort_order.
 * @returns {Promise<any[]>}
 */
export async function getCoupons() {
  const res = await fetch('/api/coupons');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al obtener cupones');
  return body.data ?? [];
}
