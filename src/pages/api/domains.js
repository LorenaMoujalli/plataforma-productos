import { query } from '../../lib/db.js';

// Auxiliar para validar admin
async function isAdmin(cookies) {
  const sessionToken = cookies.get('session_token')?.value;
  if (!sessionToken) return false;
  const session = await query.get('SELECT user_id FROM sessions WHERE id = ?', [sessionToken]);
  if (!session) return false;
  const user = await query.get('SELECT role FROM users WHERE id = ?', [session.user_id]);
  return user?.role === 'admin';
}

export async function GET() {
  try {
    const domains = await query.all('SELECT * FROM allowed_domains ORDER BY created_at DESC');
    return new Response(JSON.stringify({ data: domains }), { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/domains:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
}

export async function POST({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const { domain } = await request.json();
    const clean = domain.trim().toLowerCase();

    const res = await query.run('INSERT INTO allowed_domains (domain) VALUES (?)', [clean]);
    const newDomain = await query.get('SELECT * FROM allowed_domains WHERE id = ?', [res.lastID]);

    return new Response(JSON.stringify({ data: newDomain }), { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/domains:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}

export async function PUT({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const { id, domain } = await request.json();
    const clean = domain.trim().toLowerCase();

    await query.run('UPDATE allowed_domains SET domain = ? WHERE id = ?', [clean, id]);
    const updatedDomain = await query.get('SELECT * FROM allowed_domains WHERE id = ?', [id]);

    return new Response(JSON.stringify({ data: updatedDomain }), { status: 200 });
  } catch (error) {
    console.error('Error en PUT /api/domains:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}

export async function DELETE({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID es requerido' }), { status: 400 });
    }

    // 1. Obtener el nombre del dominio
    const domRecord = await query.get('SELECT domain FROM allowed_domains WHERE id = ?', [id]);
    if (!domRecord) {
      return new Response(JSON.stringify({ data: false, error: 'Dominio no encontrado' }), { status: 200 });
    }

    const v_domain = domRecord.domain;

    // 2. Eliminar los usuarios cuyo correo termine con @dominio
    const usersToDelete = await query.all("SELECT id FROM users WHERE email LIKE '%@' || ?", [v_domain]);
    for (const u of usersToDelete) {
      await query.run('DELETE FROM users WHERE id = ?', [u.id]);
    }

    // 3. Eliminar el dominio de allowed_domains
    await query.run('DELETE FROM allowed_domains WHERE id = ?', [id]);

    return new Response(JSON.stringify({ data: true }), { status: 200 });
  } catch (error) {
    console.error('Error en DELETE /api/domains:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
