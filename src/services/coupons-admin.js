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
