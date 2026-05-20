import { supabase } from "../lib/supabase.js";

export async function getAdminCoupons() {
  const { data, error } = await supabase
    .from("coupons")
    .select("*, companies(id, name, logo_url)")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCompaniesForSelect() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, logo_url")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createCoupon(couponData) {
  const { data, error } = await supabase
    .from("coupons")
    .insert(couponData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCoupon(id, couponData) {
  const { data, error } = await supabase
    .from("coupons")
    .update(couponData)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCoupon(id) {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function toggleCouponActive(id, active) {
  const { data, error } = await supabase
    .from("coupons")
    .update({ active })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Empresas ─────────────────────────────────────────────────

export async function uploadCompanyLogo(file) {
  const ext = file.name.split('.').pop();
  const path = `companies/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('logos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('logos').getPublicUrl(path);
  return data.publicUrl;
}

export async function getCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, logo_url, created_at, coupons(count)")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(c => ({
    ...c,
    coupon_count: c.coupons?.[0]?.count ?? 0,
  }));
}

export async function createCompany(payload) {
  const { data, error } = await supabase
    .from("companies")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id, payload) {
  const { data, error } = await supabase
    .from("companies")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCompany(id) {
  // Primero eliminar todos los cupones de esta empresa
  const { error: couponError } = await supabase
    .from("coupons")
    .delete()
    .eq("company_id", id);
  if (couponError) throw couponError;

  // Luego eliminar la empresa
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
  return true;
}
