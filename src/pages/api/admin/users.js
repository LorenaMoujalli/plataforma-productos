import { query } from '../../../lib/db.js';
import bcrypt from 'bcryptjs';

async function isAdmin(cookies) {
  const sessionToken = cookies.get('session_token')?.value;
  if (!sessionToken) return false;
  const session = await query.get('SELECT user_id FROM sessions WHERE id = ?', [sessionToken]);
  if (!session) return false;
  const user = await query.get('SELECT role FROM users WHERE id = ?', [session.user_id]);
  return user?.role === 'admin';
}

export async function GET({ cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    // Retornar perfiles ordenados por fecha de creación desc
    const users = await query.all(`
      SELECT p.id, p.email, p.name, p.role, p.created_at, p.company_id, p.expiration_date
      FROM profiles p
      ORDER BY p.created_at DESC
    `);

    return new Response(JSON.stringify({ data: users }), { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/admin/users:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
}

export async function POST({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const { email, password, name, role } = await request.json();
    const cleanEmail = email.trim().toLowerCase();

    // Validar dominio y obtener empresa asignada
    const domain = cleanEmail.split('@')[1];
    const allowed = await query.get('SELECT id, company_id FROM allowed_domains WHERE LOWER(domain) = ?', [domain]);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Solo se permiten correos electrónicos de dominios autorizados.' }), { status: 400 });
    }

    // Verificar existente
    const existing = await query.get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      return new Response(JSON.stringify({ error: 'El usuario ya existe.' }), { status: 400 });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = bcrypt.hashSync(password, 10);

    await query.run('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)', [userId, cleanEmail, hashedPassword, role || 'user']);
    await query.run('INSERT INTO profiles (id, email, name, role, company_id) VALUES (?, ?, ?, ?, ?)', [userId, cleanEmail, name || '', role || 'user', allowed.company_id || null]);

    const newUser = await query.get('SELECT * FROM profiles WHERE id = ?', [userId]);
    return new Response(JSON.stringify({ data: newUser }), { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/admin/users:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}

export async function PUT({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const { userId, name, role, email, password, companyId, expirationDate } = await request.json();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // Obtener empresa asociada al dominio automáticamente si el email está presente
    let targetCompanyId = companyId ? parseInt(companyId) : null;
    if (cleanEmail) {
      const domain = cleanEmail.split('@')[1];
      if (domain) {
        const allowed = await query.get('SELECT id, company_id FROM allowed_domains WHERE LOWER(domain) = ?', [domain]);
        if (allowed && allowed.company_id) {
          targetCompanyId = allowed.company_id;
        }
      }
    }

    // 1. Actualizar tabla users
    if (password && password.trim() !== '') {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await query.run('UPDATE users SET email = ?, password = ?, role = ? WHERE id = ?', [cleanEmail || email, hashedPassword, role, userId]);
    } else {
      await query.run('UPDATE users SET email = ?, role = ? WHERE id = ?', [cleanEmail || email, role, userId]);
    }

    // 2. Actualizar tabla profiles
    await query.run(
      'UPDATE profiles SET name = ?, role = ?, email = ?, company_id = ?, expiration_date = ? WHERE id = ?',
      [name, role, cleanEmail || email, targetCompanyId, expirationDate || null, userId]
    );

    return new Response(JSON.stringify({ data: true }), { status: 200 });
  } catch (error) {
    console.error('Error en PUT /api/admin/users:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}

export async function DELETE({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'ID es requerido' }), { status: 400 });
    }

    // Borrado de users detonará borrado en profiles en cascada en SQLite si configuramos foreign keys,
    // pero por si acaso los borramos explícitamente en el orden correcto
    await query.run('DELETE FROM profiles WHERE id = ?', [userId]);
    await query.run('DELETE FROM users WHERE id = ?', [userId]);

    return new Response(JSON.stringify({ data: true }), { status: 200 });
  } catch (error) {
    console.error('Error en DELETE /api/admin/users:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
