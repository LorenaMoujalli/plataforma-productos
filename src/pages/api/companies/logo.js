import { query } from '../../../lib/db.js';
import fs from 'fs';
import path from 'path';

async function isAuthenticated(cookies) {
  const sessionToken = cookies.get('session_token')?.value;
  if (!sessionToken) return false;
  const session = await query.get('SELECT user_id FROM sessions WHERE id = ?', [sessionToken]);
  return !!session;
}

export async function POST({ request, cookies }) {
  try {
    if (!(await isAuthenticated(cookies))) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: Inicia sesión para continuar.' }), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'Archivo no proporcionado o inválido' }), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `company-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Ruta única y estable para dev y producción.
    // En Docker se debe montar como volumen: -v uploads_data:/app/uploads
    const uploadDir = path.resolve('uploads/logos');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    // La URL pública apunta al endpoint /api/images que sirve desde uploads/
    const publicUrl = `/api/images/logos/${filename}`;

    return new Response(JSON.stringify({ publicUrl }), { status: 200 });
  } catch (error) {
    console.error('Error en carga de logo:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
