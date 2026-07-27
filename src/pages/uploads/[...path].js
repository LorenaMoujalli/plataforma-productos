/**
 * Endpoint de compatibilidad hacia atrás.
 * Las URLs antiguas almacenadas en la BD como /uploads/logos/xxx.png
 * son redirigidas al nuevo endpoint /api/images/logos/xxx.png
 * que lee desde <cwd>/uploads/ de forma estable.
 */
export async function GET({ params, redirect }) {
  const requestedPath = params.path;
  if (!requestedPath) {
    return new Response('Not found', { status: 404 });
  }
  // Redirección permanente al nuevo endpoint
  return redirect(`/api/images/${requestedPath}`, 301);
}
