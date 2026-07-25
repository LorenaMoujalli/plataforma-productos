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
    const ext = file.name.split('.').pop();
    const filename = `company-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Determinar la ruta de subida: en desarrollo es public/uploads, en producción es dist/client/uploads
    let uploadDir = path.resolve('public/uploads/logos');
    const prodDir = path.resolve('dist/client/uploads/logos');
    
    if (fs.existsSync(path.resolve('dist/client'))) {
      uploadDir = prodDir;
    }

    // Asegurar que el directorio de destino exista
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/logos/${filename}`;

    return new Response(JSON.stringify({ publicUrl }), { status: 200 });
  } catch (error) {
    console.error('Error en carga de logo:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
