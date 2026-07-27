import { query } from '../../../lib/db.js';
import bcrypt from 'bcryptjs';

export async function POST({ request }) {
  try {
    const { email, password, name, company_id } = await request.json();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Validar dominio
    const domain = cleanEmail.split('@')[1];
    const allowed = await query.get('SELECT id FROM allowed_domains WHERE LOWER(domain) = ?', [domain]);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Solo se permiten registros con correos electrónicos de dominios autorizados.' }), { status: 400 });
    }

    // 2. Verificar si usuario ya existe
    const existing = await query.get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      return new Response(JSON.stringify({ error: 'El usuario ya existe.' }), { status: 400 });
    }

    // 3. Crear usuario
    const userId = crypto.randomUUID();
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    await query.run('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)', [userId, cleanEmail, hashedPassword, 'user']);
    await query.run('INSERT INTO profiles (id, email, name, role, company_id) VALUES (?, ?, ?, ?, ?)', [userId, cleanEmail, name || '', 'user', company_id || null]);

    return new Response(JSON.stringify({
      user: {
        id: userId,
        email: cleanEmail,
        user_metadata: { name }
      }
    }), { status: 201 });
  } catch (error) {
    console.error('Error en registro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor' }), { status: 500 });
  }
}
