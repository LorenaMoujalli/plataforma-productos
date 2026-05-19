import { supabase } from "../lib/supabase.js";

/**
 * Registra un nuevo usuario en la base de datos de autenticación de Supabase.
 * Valida que el correo electrónico pertenezca al dominio autorizado.
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<any>}
 */
export async function signUpUser(email, password, name) {
  const cleanEmail = email.trim();
  const domain = cleanEmail.split("@")[1];
  
  if (!domain || domain.toLowerCase() !== "oberstaff.com") {
    throw new Error("Solo se permiten registros con correos electrónicos de dominios autorizados.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        name: name || "",
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Inicia sesión con correo y contraseña.
 * Valida el dominio antes de realizar la petición.
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<any>}
 */
export async function signInUser(email, password) {
  const cleanEmail = email.trim(); 
  const domain = cleanEmail.split("@")[1];

  if (!domain || domain.toLowerCase() !== "oberstaff.com") {
    throw new Error("Solo se permiten registros con correos electrónicos de dominios autorizados.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    
    if (error.message.includes("Invalid login credentials")) {
      throw new Error("Credenciales incorrectas. Verifica tu correo y contraseña.");
    } else if (error.message.includes("Email not confirmed")) {
      throw new Error("Debes confirmar tu correo antes de iniciar sesión.");
    }
    throw error;
  }
  
  return data;
}

/**
 * Cierra la sesión activa del usuario.
 * 
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Obtiene el perfil del usuario activo de la tabla public.profiles.
 * Útil para obtener el rol (admin o user).
 * 
 * @returns {Promise<any>}
 */
export async function getUserProfile() {
  const session = await getCurrentSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error("Error al obtener el perfil:", error.message);
    return null;
  }
  return data;
}

/**
 * Fuerza el cambio de contraseña directo mediante RPC (Solo usar si es estrictamente necesario)
 * 
 * @param {string} email 
 * @param {string} newPassword 
 * @returns {Promise<boolean>}
 */
export async function directResetPassword(email, newPassword) {
  const cleanEmail = email.trim();
  
  // Llamamos a la función RPC que crearemos en la base de datos
  const { data, error } = await supabase.rpc('direct_reset_password', {
    p_email: cleanEmail,
    p_new_password: newPassword
  });

  if (error) throw error;
  
  // data retornará true si el correo existía y se actualizó, false si no existe
  return data;
}

/**
 * Obtiene todos los usuarios registrados (Solo para administradores)
 * 
 * @returns {Promise<any[]>}
 */
export async function getAdminUsers() {
  const { data, error } = await supabase.rpc('admin_get_users');
  if (error) throw error;
  return data;
}

/**
 * Elimina a un usuario completamente (Solo para administradores)
 * 
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
export async function deleteAdminUser(userId) {
  const { data, error } = await supabase.rpc('admin_delete_user', {
    user_id: userId
  });
  if (error) throw error;
  return data;
}
