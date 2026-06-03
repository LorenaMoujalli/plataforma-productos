import { supabase } from "../lib/supabase.js";

/**
 * Obtiene todos los cupones activos junto con los datos de su empresa,
 * ordenados por sort_order.
 * @returns {Promise<any[]>}
 */
export async function getCoupons() {
  const { data, error } = await supabase
    .from("coupons")
    .select(`
      *,
      companies (
        id,
        name,
        logo_url,
        sector_id,
        sectors (
          id,
          name
        )
      )
    `)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
