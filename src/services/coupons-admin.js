export async function getAdminCoupons() {
  const res = await fetch('/api/coupons?admin=true');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al obtener cupones de administración');
  return body.data ?? [];
}

export async function getCompaniesForSelect() {
  const res = await fetch('/api/companies?select=true');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al obtener empresas');
  return body.data ?? [];
}

export async function getSectors() {
  const res = await fetch('/api/sectors');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al obtener sectores');
  return body.data ?? [];
}

export async function createCoupon(couponData) {
  const res = await fetch('/api/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(couponData)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al crear cupón');
  return body.data;
}

export async function updateCoupon(id, couponData) {
  const res = await fetch(`/api/coupons?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...couponData })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al actualizar cupón');
  return body.data;
}

export async function deleteCoupon(id) {
  const res = await fetch(`/api/coupons?id=${id}`, {
    method: 'DELETE'
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al eliminar cupón');
  return true;
}

export async function toggleCouponActive(id, active) {
  const res = await fetch('/api/coupons/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, active })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al alternar estado del cupón');
  return body.data;
}

// ── Empresas ─────────────────────────────────────────────────

export async function uploadCompanyLogo(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/companies/logo', {
    method: 'POST',
    body: formData
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al subir logo de la empresa');
  return body.publicUrl;
}

export async function getCompanies() {
  const res = await fetch('/api/companies');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al obtener empresas');
  
  // El backend ya devuelve el formato correcto con el sector mapeado
  // c.sectors?.name y c.coupons?.[0]?.count
  return (body.data ?? []).map(c => ({
    ...c,
    sector_name: c.sectors?.name ?? null,
    coupon_count: c.coupons?.[0]?.count ?? 0,
  }));
}

export async function createCompany(payload) {
  const res = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al crear empresa');
  return body.data;
}

export async function updateCompany(id, payload) {
  const res = await fetch('/api/companies', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...payload })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al actualizar empresa');
  return body.data;
}

export async function deleteCompany(id) {
  const res = await fetch(`/api/companies?id=${id}`, {
    method: 'DELETE'
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al eliminar empresa');
  return true;
}
