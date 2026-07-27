import fs from 'fs';
import path from 'path';

/**
 * Endpoint para servir imágenes subidas por el usuario.
 * Funciona igual en desarrollo (npm run dev) y en producción (Docker/standalone),
 * sin depender de dist/client ni de la carpeta public/.
 *
 * Orden de búsqueda:
 *  1. <cwd>/uploads/          (ruta nueva y estable — todas las subidas nuevas van aquí)
 *  2. <cwd>/public/uploads/   (fallback: archivos subidos con el sistema anterior en dev)
 *  3. <cwd>/dist/client/uploads/ (fallback: archivos subidos con el sistema anterior en prod)
 */
export async function GET({ params }) {
  try {
    const requestedPath = params.path;

    if (!requestedPath) {
      return new Response('Not found', { status: 404 });
    }

    // Sanitizar la ruta para evitar directory traversal
    const normalized = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '');

    // Lista de directorios donde buscar, en orden de prioridad
    const searchRoots = [
      path.resolve('uploads'),
      path.resolve('public/uploads'),
      path.resolve('dist/client/uploads'),
    ];

    let fileBuffer = null;
    let filePath = null;

    for (const root of searchRoots) {
      const candidate = path.join(root, normalized);
      // Verificar que el archivo sigue dentro del directorio raíz (seguridad)
      if (!candidate.startsWith(root)) continue;
      if (fs.existsSync(candidate)) {
        filePath = candidate;
        fileBuffer = fs.readFileSync(candidate);
        break;
      }
    }

    if (!fileBuffer || !filePath) {
      return new Response('Not found', { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase().slice(1);

    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      avif: 'image/avif',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Caché largo — se invalida con ?t=timestamp en uploads nuevos
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error sirviendo imagen:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
