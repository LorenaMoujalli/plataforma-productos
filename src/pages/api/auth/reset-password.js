import { query } from '../../../lib/db.js';
import bcrypt from 'bcryptjs';

export async function POST({ request }) {
  try {
    const { email, newPassword } = await request.json();
    const cleanEmail = email.trim().toLowerCase();

    const user = await query.get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Usuario no encontrado' }), { status: 200 }); // Retornar success: false como en RPC original
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await query.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
}
