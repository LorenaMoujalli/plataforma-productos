import { query } from '../../../lib/db.js';

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function GET({ cookies }) {
  try {
    const sessionToken = cookies.get('session_token')?.value;
    if (!sessionToken) {
      return new Response(JSON.stringify({ session: null }), { status: 200, headers });
    }

    const session = await query.get('SELECT * FROM sessions WHERE id = ?', [sessionToken]);
    if (!session) {
      cookies.delete('session_token', { path: '/' });
      return new Response(JSON.stringify({ session: null }), { status: 200, headers });
    }

    // Verificar si expiró
    if (new Date(session.expires_at) < new Date()) {
      await query.run('DELETE FROM sessions WHERE id = ?', [sessionToken]);
      cookies.delete('session_token', { path: '/' });
      return new Response(JSON.stringify({ session: null }), { status: 200, headers });
    }

    const user = await query.get('SELECT id, email, role FROM users WHERE id = ?', [session.user_id]);
    if (!user) {
      cookies.delete('session_token', { path: '/' });
      return new Response(JSON.stringify({ session: null }), { status: 200, headers });
    }

    const profile = await query.get('SELECT * FROM profiles WHERE id = ?', [user.id]);

    return new Response(JSON.stringify({
      session: {
        access_token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            name: profile?.name || ''
          }
        }
      }
    }), { status: 200, headers });
  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
