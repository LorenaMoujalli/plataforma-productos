import { query } from '../../../lib/db.js';

export async function POST({ cookies }) {
  try {
    const sessionToken = cookies.get('session_token')?.value;
    if (sessionToken) {
      await query.run('DELETE FROM sessions WHERE id = ?', [sessionToken]);
    }
    cookies.delete('session_token', { path: '/' });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error en logout:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
}
