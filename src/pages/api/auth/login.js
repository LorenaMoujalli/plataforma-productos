import { query } from '../../../lib/db.js';
import bcrypt from 'bcryptjs';

export async function POST({ request, cookies }) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Validar dominio antes
    const domain = cleanEmail.split('@')[1];
    const allowed = await query.get('SELECT id FROM allowed_domains WHERE LOWER(domain) = ?', [domain]);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Solo se permiten correos electrónicos de dominios autorizados.' }), { status: 400 });
    }

    // 2. Buscar usuario
    const user = await query.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' }), { status: 400 });
    }

    // 3. Verificar contraseña
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' }), { status: 400 });
    }

    // 4. Obtener perfil
    const profile = await query.get('SELECT * FROM profiles WHERE id = ?', [user.id]);

    // 5. Crear sesión
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 días
    await query.run('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', [sessionId, user.id, expiresAt]);

    // 6. Configurar cookie
    cookies.set('session_token', sessionId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: new Date(expiresAt)
    });

    const sessionData = {
      session: {
        access_token: sessionId,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            name: profile?.name || ''
          }
        }
      }
    };

    return new Response(JSON.stringify(sessionData), { status: 200 });
  } catch (error) {
    console.error('Error en login:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), { status: 500 });
  }
}
