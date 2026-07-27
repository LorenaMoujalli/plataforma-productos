/**
 * Registra un nuevo usuario en la base de datos local.
 * Valida que el correo electrónico pertenezca al dominio autorizado.
 * 
 * @param {string} email 
 * @param {string} password 
 * @param {string} name 
 * @param {number|null} company_id
 * @returns {Promise<any>}
 */
export async function signUpUser(email, password, name, company_id = null) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, company_id })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error en el registro');
  return body;
}

/**
 * Inicia sesión con correo y contraseña.
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<any>}
 */
export async function signInUser(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error de inicio de sesión');
  return body;
}

/**
 * Cierra la sesión activa del usuario.
 * 
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Error al cerrar sesión');
}

export async function getCurrentSession() {
  const res = await fetch('/api/auth/session');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al obtener sesión');
  return body.session;
}

/**
 * Obtiene el perfil del usuario activo de la tabla public.profiles.
 * 
 * @returns {Promise<any>}
 */
export async function getUserProfile() {
  const res = await fetch('/api/auth/profile');
  const body = await res.json();
  if (!res.ok) return null;
  return body.data;
}

/**
 * Fuerza el cambio de contraseña directo
 * 
 * @param {string} email 
 * @param {string} newPassword 
 * @returns {Promise<boolean>}
 */
export async function directResetPassword(email, newPassword) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al restablecer contraseña');
  return body.success;
}

/**
 * Obtiene todos los usuarios registrados (Solo para administradores)
 * 
 * @returns {Promise<any[]>}
 */
export async function getAdminUsers() {
  const res = await fetch('/api/admin/users');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al obtener usuarios');
  return body.data ?? [];
}

/**
 * Elimina a un usuario completamente (Solo para administradores)
 * 
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
export async function deleteAdminUser(userId) {
  const res = await fetch(`/api/admin/users?id=${userId}`, {
    method: 'DELETE'
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al eliminar usuario');
  return body.data;
}

/**
 * Crea un usuario nuevo directamente desde el panel de admin sin cerrar la sesión actual.
 * 
 * @param {string} email 
 * @param {string} password 
 * @param {string} name 
 * @param {string} role 
 * @returns {Promise<any>}
 */
export async function adminCreateUser(email, password, name, role = 'user') {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, role })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al crear usuario');
  return body.data;
}

/**
 * Actualiza el perfil del usuario activo en la tabla public.profiles.
 * 
 * @param {string} userId
 * @param {object} profileData { name, email, company_id }
 * @returns {Promise<any>}
 */
export async function updateUserProfile(userId, profileData) {
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al actualizar perfil');
  return body.data;
}

/**
 * Actualiza el email del usuario en auth.users y public.profiles.
 * 
 * @param {string} newEmail
 * @returns {Promise<any>}
 */
export async function updateAuthEmail(newEmail) {
  const profile = await getUserProfile();
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: profile?.name || '',
      email: newEmail.trim(),
      company_id: profile?.company_id || null
    })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al actualizar correo');
  return body;
}

/**
 * Actualiza los datos de un usuario desde el panel de admin (incluyendo email, password y empresa).
 * 
 * @param {string} userId
 * @param {string} name
 * @param {string} role
 * @param {string} email
 * @param {string} password
 * @param {number|null} companyId
 */
export async function adminUpdateUser(userId, name, role, email, password, companyId = null) {
  const res = await fetch('/api/admin/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      name,
      role,
      email,
      password,
      companyId
    })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al actualizar usuario');
  return body.data;
}
