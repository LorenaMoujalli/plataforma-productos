import { query } from '../../../lib/db.js';

export async function GET({ request, cookies }) {
  try {
    const url = new URL(request.url);
    let userId = url.searchParams.get('id');

    if (!userId) {
      // Intentar obtener desde la sesión
      const sessionToken = cookies.get('session_token')?.value;
      if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
      }
      const session = await query.get('SELECT user_id FROM sessions WHERE id = ?', [sessionToken]);
      if (!session) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
      }
      userId = session.user_id;
    }

    const profile = await query.get('SELECT * FROM profiles WHERE id = ?', [userId]);
    if (!profile) {
      return new Response(JSON.stringify({ data: null }), { status: 200 });
    }

    let companies = null;
    if (profile.company_id) {
      const company = await query.get('SELECT id, name FROM companies WHERE id = ?', [profile.company_id]);
      if (company) {
        companies = { id: company.id, name: company.name };
      }
    }

    const responseData = {
      data: {
        ...profile,
        companies
      }
    };

    return new Response(JSON.stringify(responseData), { status: 200 });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
}

export async function PUT({ request, cookies }) {
  try {
    const sessionToken = cookies.get('session_token')?.value;
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }
    const session = await query.get('SELECT user_id FROM sessions WHERE id = ?', [sessionToken]);
    if (!session) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const bodyData = await request.json();
    const { name, email, company_id, avatar_url, expiration_date } = bodyData;

    const current = await query.get('SELECT * FROM profiles WHERE id = ?', [session.user_id]);
    if (!current) {
      return new Response(JSON.stringify({ error: 'Perfil no encontrado' }), { status: 404 });
    }

    const updatedName = name !== undefined ? name : current.name;
    const updatedEmail = email !== undefined ? email : current.email;
    const updatedCompanyId = company_id !== undefined ? company_id : current.company_id;
    const updatedAvatarUrl = avatar_url !== undefined ? avatar_url : current.avatar_url;
    const updatedExpirationDate = expiration_date !== undefined ? expiration_date : current.expiration_date;

    await query.run(
      'UPDATE profiles SET name = ?, email = ?, company_id = ?, avatar_url = ?, expiration_date = ? WHERE id = ?',
      [updatedName, updatedEmail, updatedCompanyId || null, updatedAvatarUrl || null, updatedExpirationDate || null, session.user_id]
    );

    // Si también se actualiza el email del usuario en la tabla auth/users
    if (updatedEmail) {
      await query.run('UPDATE users SET email = ? WHERE id = ?', [updatedEmail, session.user_id]);
    }

    const updated = await query.get('SELECT * FROM profiles WHERE id = ?', [session.user_id]);

    return new Response(JSON.stringify({ data: updated }), { status: 200 });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
