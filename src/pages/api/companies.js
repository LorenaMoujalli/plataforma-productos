import { query } from '../../lib/db.js';

async function isAdmin(cookies) {
  const sessionToken = cookies.get('session_token')?.value;
  if (!sessionToken) return false;
  const session = await query.get('SELECT user_id FROM sessions WHERE id = ?', [sessionToken]);
  if (!session) return false;
  const user = await query.get('SELECT role FROM users WHERE id = ?', [session.user_id]);
  return user?.role === 'admin';
}

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const forSelect = url.searchParams.get('select') === 'true';

    if (forSelect) {
      const companies = await query.all('SELECT id, name, logo_url FROM companies ORDER BY name ASC');
      return new Response(JSON.stringify({ data: companies }), { status: 200 });
    }

    const companies = await query.all(`
      SELECT c.id, c.name, c.logo_url, c.created_at, c.sector_id, s.name AS sector_name,
             (SELECT COUNT(*) FROM coupons WHERE company_id = c.id) AS coupon_count
      FROM companies c
      LEFT JOIN sectors s ON c.sector_id = s.id
      ORDER BY c.name ASC
    `);

    // El frontend espera sectors como subobjeto o ya plano. En coupons-admin.js hace:
    // sector_name: c.sectors?.name ?? null, coupon_count: c.coupons?.[0]?.count ?? 0
    // Si estructuramos la respuesta JSON de forma idéntica o adaptamos el servicio,
    // es más seguro devolver la estructura exacta esperada por el JS original:
    const data = companies.map(c => ({
      id: c.id,
      name: c.name,
      logo_url: c.logo_url,
      created_at: c.created_at,
      sector_id: c.sector_id,
      sectors: c.sector_name ? { name: c.sector_name } : null,
      coupons: [{ count: c.coupon_count }]
    }));

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/companies:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
}

export async function POST({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const payload = await request.json();
    const sectorId = payload.sector_id ? parseInt(payload.sector_id, 10) : null;
    const res = await query.run(
      'INSERT INTO companies (name, logo_url, sector_id) VALUES (?, ?, ?)',
      [payload.name, payload.logo_url || null, isNaN(sectorId) ? null : sectorId]
    );

    const newCompany = await query.get('SELECT * FROM companies WHERE id = ?', [res.lastID]);
    return new Response(JSON.stringify({ data: newCompany }), { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/companies:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}

export async function PUT({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const payload = await request.json();
    const { id, name, logo_url, sector_id } = payload;
    
    const companyId = parseInt(id, 10);
    const parsedSectorId = sector_id ? parseInt(sector_id, 10) : null;

    if (isNaN(companyId)) {
      return new Response(JSON.stringify({ error: 'ID de empresa inválido' }), { status: 400 });
    }

    await query.run(
      'UPDATE companies SET name = ?, logo_url = ?, sector_id = ? WHERE id = ?',
      [name, logo_url || null, (parsedSectorId && !isNaN(parsedSectorId)) ? parsedSectorId : null, companyId]
    );

    const updated = await query.get('SELECT * FROM companies WHERE id = ?', [companyId]);
    return new Response(JSON.stringify({ data: updated }), { status: 200 });
  } catch (error) {
    console.error('Error en PUT /api/companies:', error);
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

    const companyId = parseInt(id, 10);
    if (isNaN(companyId)) {
      return new Response(JSON.stringify({ error: 'ID de empresa inválido' }), { status: 400 });
    }

    // 1. Eliminar cupones de esta empresa
    await query.run('DELETE FROM coupons WHERE company_id = ?', [companyId]);

    // 2. Eliminar la empresa
    await query.run('DELETE FROM companies WHERE id = ?', [companyId]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error en DELETE /api/companies:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
