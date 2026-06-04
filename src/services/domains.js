import { supabase } from "../lib/supabase.js";

/**
 * Obtiene todos los dominios permitidos.
 * @returns {Promise<any[]>}
 */
export async function getDomains() {
  const { data, error } = await supabase
    .from('allowed_domains')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Agrega un nuevo dominio permitido.
 * @param {string} domain
 * @returns {Promise<any>}
 */
export async function addDomain(domain) {
  const clean = domain.trim().toLowerCase();
  const { data, error } = await supabase
    .from('allowed_domains')
    .insert({ domain: clean })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualiza el valor de un dominio existente.
 * @param {number} id
 * @param {string} domain
 * @returns {Promise<any>}
 */
export async function updateDomain(id, domain) {
  const clean = domain.trim().toLowerCase();
  const { data, error } = await supabase
    .from('allowed_domains')
    .update({ domain: clean })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina un dominio permitido por su ID, eliminando en cascada los usuarios asociados.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteDomain(id) {
  const { data, error } = await supabase.rpc('delete_users_and_domain_by_id', {
    p_domain_id: id
  });

  if (error) throw error;
  return data;
}

/**
 * Devuelve solo los nombres de dominio (array de strings) para validaciones client-side.
 * @returns {Promise<string[]>}
 */
export async function getAllowedDomainNames() {
  const { data, error } = await supabase
    .from('allowed_domains')
    .select('domain');

  if (error) throw error;
  return (data || []).map(d => d.domain.toLowerCase());
}
