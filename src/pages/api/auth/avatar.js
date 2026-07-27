import { query } from '../../../lib/db.js';
import fs from 'fs';
import path from 'path';

async function getSession(cookies) {
  const sessionToken = cookies.get('session_token')?.value;
  if (!sessionToken) return null;
  return query.get('SELECT user_id FROM sessions WHERE id = ?', [sessionToken]);
}

export async function POST({ request, cookies }) {
  try {
    const session = await getSession(cookies);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Inicia sesión para continuar.' }), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'Archivo no proporcionado o inválido' }), { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Solo se permiten archivos de imagen' }), { status: 400 });
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'La imagen no debe superar los 2MB' }), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop().toLowerCase();
    const userId = session.user_id;
    const filename = `avatar-${userId}-${Date.now()}.${ext}`;

    // Ruta única y estable para dev y producción
    const uploadDir = path.resolve('uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Eliminar avatar anterior del usuario si existe para no acumular archivos
    try {
      const existing = await query.get('SELECT avatar_url FROM profiles WHERE id = ?', [userId]);
      if (existing?.avatar_url) {
        const oldFilename = existing.avatar_url.split('/').pop().split('?')[0];
        const oldPath = path.join(uploadDir, oldFilename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    } catch (_) {
      // No bloquear la subida si falla la limpieza
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // URL con timestamp para forzar invalidación de caché del navegador
    const publicUrl = `/api/images/avatars/${filename}?t=${Date.now()}`;

    // Guardar en la tabla de perfiles
    await query.run(
      'UPDATE profiles SET avatar_url = ? WHERE id = ?',
      [publicUrl, userId]
    );

    return new Response(JSON.stringify({ publicUrl }), { status: 200 });
  } catch (error) {
    console.error('Error en carga de avatar:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
