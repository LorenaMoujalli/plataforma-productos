import { query } from '../../lib/db.js';
import { dbErrorResponse } from '../../lib/api-errors.js';

// Columnas que el cliente puede modificar en un cupón
const COUPON_COLUMNS = [
  'company_id', 'title', 'description', 'vigencia', 'tipo_descuento',
  'discount_amount', 'discount_label', 'code_label', 'discount_code',
  'benefit_text', 'terms', 'active', 'sort_order'
];

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
    const adminMode = url.searchParams.get('admin') === 'true';

    let sql = `
      SELECT cp.*, 
             c.name AS company_name, c.logo_url AS company_logo_url, c.sector_id AS company_sector_id,
             s.name AS sector_name
      FROM coupons cp
      LEFT JOIN companies c ON cp.company_id = c.id
      LEFT JOIN sectors s ON c.sector_id = s.id
    `;
    const params = [];

    if (!adminMode) {
      sql += ' WHERE cp.active = 1 ';
    }

    sql += ' ORDER BY cp.sort_order ASC ';

    const rows = await query.all(sql, params);

    const data = rows.map(r => ({
      id: r.id,
      company_id: r.company_id,
      title: r.title,
      description: r.description,
      vigencia: r.vigencia,
      tipo_descuento: r.tipo_descuento,
      discount_amount: r.discount_amount,
      discount_label: r.discount_label,
      code_label: r.code_label,
      discount_code: r.discount_code,
      benefit_text: r.benefit_text,
      terms: r.terms,
      active: r.active === 1 || r.active === true || r.active === 'true',
      sort_order: r.sort_order,
      created_at: r.created_at,
      companies: r.company_id ? {
        id: r.company_id,
        name: r.company_name,
        logo_url: r.company_logo_url,
        sector_id: r.company_sector_id,
        sectors: r.company_sector_id ? {
          id: r.company_sector_id,
          name: r.sector_name
        } : null
      } : null
    }));

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/coupons:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
}

export async function POST({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const payload = await request.json();

    const title = (payload.title || '').trim();
    if (!title) {
      return new Response(JSON.stringify({ error: 'El título del cupón es obligatorio.' }), { status: 400 });
    }
    if (!payload.company_id) {
      return new Response(JSON.stringify({ error: 'Debes seleccionar la empresa a la que pertenece el cupón.' }), { status: 400 });
    }
    const company = await query.get('SELECT id FROM companies WHERE id = ?', [payload.company_id]);
    if (!company) {
      return new Response(JSON.stringify({ error: 'La empresa seleccionada no existe. Recarga la lista e inténtalo de nuevo.' }), { status: 400 });
    }
    const sameCompany = await query.all('SELECT id, title FROM coupons WHERE company_id = ?', [payload.company_id]);
    const duplicate = sameCompany.find(x => String(x.title || '').toLowerCase() === title.toLowerCase());
    if (duplicate) {
      return new Response(JSON.stringify({ error: `Ya existe un cupón con el título "${title}" para esta empresa. Si quieres modificarlo, edítalo en su lugar.` }), { status: 409 });
    }

    const dataToInsert = { ...payload, title };
    const columns = Object.keys(dataToInsert).filter(col => COUPON_COLUMNS.includes(col));
    const values = columns.map(col => dataToInsert[col]);
    const placeholders = columns.map(() => '?').join(', ');

    const res = await query.run(
      `INSERT INTO coupons (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    const newCoupon = await query.get('SELECT * FROM coupons WHERE id = ?', [res.lastID]);
    return new Response(JSON.stringify({ data: newCoupon }), { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/coupons:', error);
    return dbErrorResponse(error, 'No se pudo guardar el cupón. Intenta de nuevo.');
  }
}

export async function PUT({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const payload = await request.json();
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || payload.id;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID es requerido' }), { status: 400 });
    }

    const existing = await query.get('SELECT * FROM coupons WHERE id = ?', [id]);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'El cupón que intentas editar ya no existe. Recarga la lista.' }), { status: 404 });
    }

    const dataToUpdate = { ...payload };
    delete dataToUpdate.id;
    const columns = Object.keys(dataToUpdate).filter(col => COUPON_COLUMNS.includes(col));

    if (columns.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay cambios para guardar.' }), { status: 400 });
    }

    // Validar título y empresa finales (los que quedarían guardados)
    const finalTitle = columns.includes('title') ? String(dataToUpdate.title || '').trim() : existing.title;
    if (!finalTitle) {
      return new Response(JSON.stringify({ error: 'El título del cupón es obligatorio.' }), { status: 400 });
    }
    dataToUpdate.title = finalTitle;
    if (!columns.includes('title')) columns.push('title');

    const finalCompanyId = columns.includes('company_id') ? dataToUpdate.company_id : existing.company_id;
    const company = await query.get('SELECT id FROM companies WHERE id = ?', [finalCompanyId]);
    if (!company) {
      return new Response(JSON.stringify({ error: 'La empresa seleccionada no existe. Recarga la lista e inténtalo de nuevo.' }), { status: 400 });
    }

    const sameCompany = await query.all('SELECT id, title FROM coupons WHERE company_id = ? AND id != ?', [finalCompanyId, id]);
    const duplicate = sameCompany.find(x => String(x.title || '').toLowerCase() === finalTitle.toLowerCase());
    if (duplicate) {
      return new Response(JSON.stringify({ error: `Ya existe otro cupón con el título "${finalTitle}" para esta empresa. Cambia el título.` }), { status: 409 });
    }

    const values = columns.map(col => dataToUpdate[col]);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    values.push(id);

    await query.run(
      `UPDATE coupons SET ${setClause} WHERE id = ?`,
      values
    );

    const updated = await query.get('SELECT * FROM coupons WHERE id = ?', [id]);
    return new Response(JSON.stringify({ data: updated }), { status: 200 });
  } catch (error) {
    console.error('Error en PUT /api/coupons:', error);
    return dbErrorResponse(error, 'No se pudo actualizar el cupón. Intenta de nuevo.');
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

    await query.run('DELETE FROM coupons WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error en DELETE /api/coupons:', error);
    return dbErrorResponse(error, 'No se pudo eliminar el cupón. Intenta de nuevo.');
  }
}
