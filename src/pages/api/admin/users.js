import { query } from '../../../lib/db.js';
import { dbErrorResponse } from '../../../lib/api-errors.js';
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
      SELECT p.id, p.email, p.name, p.role, p.created_at, p.company_id, p.expiration_date,
             COALESCE(u.manual_created, 0) AS manual_created
      FROM profiles p
      LEFT JOIN users u ON u.id = p.id
      ORDER BY p.created_at DESC
    `);

    return new Response(JSON.stringify({ data: users }), { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/admin/users:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
}

// Busca una empresa por nombre (case-insensitive); si no existe, la crea.
async function findOrCreateCompany(companyName) {
  const cleanName = (companyName || '').trim();
  if (!cleanName) return null;
  const existing = await query.get('SELECT id FROM companies WHERE LOWER(name) = LOWER(?)', [cleanName]);
  if (existing) return existing.id;
  const res = await query.run('INSERT INTO companies (name) VALUES (?)', [cleanName]);
  return res.lastID;
}

export async function POST({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const { email, password, name, role, mode, company_id, company_name } = await request.json();
    const cleanEmail = email.trim().toLowerCase();

    const domain = cleanEmail.split('@')[1];
    if (!domain) {
      return new Response(JSON.stringify({ error: 'Ingresa un correo electrónico válido.' }), { status: 400 });
    }

    let targetCompanyId = null;

    if (mode === 'manual') {
      // Asignación manual: el dominio NO se valida (excepción creada por un admin)
      if (company_id) {
        targetCompanyId = parseInt(company_id, 10) || null;
      } else {
        targetCompanyId = await findOrCreateCompany(company_name);
      }
      if (!targetCompanyId) {
        return new Response(JSON.stringify({ error: 'El nombre de la empresa es obligatorio.' }), { status: 400 });
      }
    } else {
      // Asignación automática: el dominio debe estar autorizado y la empresa sale del dominio
      const allowed = await query.get('SELECT id, company_id FROM allowed_domains WHERE LOWER(domain) = ?', [domain]);
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'Solo se permiten correos electrónicos de dominios autorizados.' }), { status: 400 });
      }
      targetCompanyId = allowed.company_id || null;
    }

    // Verificar existente
    const existing = await query.get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      return new Response(JSON.stringify({ error: `Ya existe un usuario con el correo "${cleanEmail}". Usa otro correo o edita el usuario existente.` }), { status: 409 });
    }

    if (!['user', 'admin'].includes(role || 'user')) {
      return new Response(JSON.stringify({ error: 'El rol seleccionado no es válido.' }), { status: 400 });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const isManual = mode === 'manual' ? 1 : 0;

    await query.run('INSERT INTO users (id, email, password, role, manual_created) VALUES (?, ?, ?, ?, ?)', [userId, cleanEmail, hashedPassword, role || 'user', isManual]);
    await query.run('INSERT INTO profiles (id, email, name, role, company_id) VALUES (?, ?, ?, ?, ?)', [userId, cleanEmail, name || '', role || 'user', targetCompanyId]);

    const newUser = await query.get('SELECT * FROM profiles WHERE id = ?', [userId]);
    return new Response(JSON.stringify({ data: newUser }), { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/admin/users:', error);
    return dbErrorResponse(error, 'No se pudo crear el usuario. Intenta de nuevo.');
  }
}

export async function PUT({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const { userId, name, role, email, password, companyId, expirationDate, companyName } = await request.json();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return new Response(JSON.stringify({ error: 'Ingresa un correo electrónico válido.' }), { status: 400 });
    }
    if (!['user', 'admin'].includes(role || '')) {
      return new Response(JSON.stringify({ error: 'El rol seleccionado no es válido.' }), { status: 400 });
    }
    if (cleanEmail) {
      const duplicateEmail = await query.get('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [cleanEmail, userId]);
      if (duplicateEmail) {
        return new Response(JSON.stringify({ error: `Ya existe otro usuario con el correo "${cleanEmail}". Usa un correo diferente.` }), { status: 409 });
      }
    }

    let targetCompanyId = companyId ? parseInt(companyId) : null;

    if (companyName && companyName.trim()) {
      // Usuario manual: empresa escrita por el admin (find-or-create)
      const resolvedCompanyId = await findOrCreateCompany(companyName);
      if (resolvedCompanyId) targetCompanyId = resolvedCompanyId;
    } else {
      // Obtener empresa asociada al dominio automáticamente si el email está presente.
      // No aplica a usuarios creados manualmente: su empresa no se deriva del dominio.
      const existingUser = await query.get('SELECT manual_created FROM users WHERE id = ?', [userId]);
      const isManual = Number(existingUser?.manual_created) === 1;
      if (!isManual && cleanEmail) {
        const domain = cleanEmail.split('@')[1];
        if (domain) {
          const allowed = await query.get('SELECT id, company_id FROM allowed_domains WHERE LOWER(domain) = ?', [domain]);
          if (allowed && allowed.company_id) {
            targetCompanyId = allowed.company_id;
          }
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
    return dbErrorResponse(error, 'No se pudo actualizar el usuario. Intenta de nuevo.');
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
    return dbErrorResponse(error, 'No se pudo eliminar el usuario. Intenta de nuevo.');
  }
}
