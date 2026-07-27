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
    const sectors = await query.all(`
      SELECT * FROM sectors 
      ORDER BY CASE WHEN LOWER(name) = 'otro' THEN 1 ELSE 0 END ASC, name ASC
    `);
    return new Response(JSON.stringify({ data: sectors }), { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/sectors:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
}

export async function POST({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const { name } = await request.json();
    if (!name || name.trim() === '') {
      return new Response(JSON.stringify({ error: 'El nombre del sector es requerido' }), { status: 400 });
    }

    const clean = name.trim();
    const res = await query.run('INSERT INTO sectors (name) VALUES (?)', [clean]);
    const newSector = await query.get('SELECT * FROM sectors WHERE id = ?', [res.lastID]);

    return new Response(JSON.stringify({ data: newSector }), { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/sectors:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}

export async function PUT({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const { id, name } = await request.json();
    if (!id || !name || name.trim() === '') {
      return new Response(JSON.stringify({ error: 'ID y nombre son requeridos' }), { status: 400 });
    }

    const clean = name.trim();
    await query.run('UPDATE sectors SET name = ? WHERE id = ?', [clean, id]);
    const updatedSector = await query.get('SELECT * FROM sectors WHERE id = ?', [id]);

    return new Response(JSON.stringify({ data: updatedSector }), { status: 200 });
  } catch (error) {
    console.error('Error en PUT /api/sectors:', error);
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

    const sectorId = parseInt(id, 10);
    if (isNaN(sectorId)) {
      return new Response(JSON.stringify({ error: 'ID del sector debe ser un número válido' }), { status: 400 });
    }

    // 1. Desvincular de forma segura las empresas de este sector antes de borrarlo
    await query.run('UPDATE companies SET sector_id = NULL WHERE sector_id = ?', [sectorId]);

    // 2. Borrar el sector
    await query.run('DELETE FROM sectors WHERE id = ?', [sectorId]);

    return new Response(JSON.stringify({ data: true }), { status: 200 });
  } catch (error) {
    console.error('Error en DELETE /api/sectors:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
