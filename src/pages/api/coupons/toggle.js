import { query } from '../../../lib/db.js';

async function isAdmin(cookies) {
  const sessionToken = cookies.get('session_token')?.value;
  if (!sessionToken) return false;
  const session = await query.get('SELECT user_id FROM sessions WHERE id = ?', [sessionToken]);
  if (!session) return false;
  const user = await query.get('SELECT role FROM users WHERE id = ?', [session.user_id]);
  return user?.role === 'admin';
}

export async function POST({ request, cookies }) {
  try {
    if (!(await isAdmin(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Se requieren permisos de administrador.' }), { status: 403 });
    }

    const { id, active } = await request.json();
    await query.run('UPDATE coupons SET active = ? WHERE id = ?', [active ? 1 : 0, id]);

    const updated = await query.get('SELECT * FROM coupons WHERE id = ?', [id]);
    return new Response(JSON.stringify({ data: updated }), { status: 200 });
  } catch (error) {
    console.error('Error en toggle coupon:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
