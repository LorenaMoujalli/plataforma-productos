/**
 * Traduce errores de SQLite/BD a mensajes que entienda el usuario.
 * Devuelve null si el error no es un error de restricción conocido.
 */
export function friendlyDbMessage(error) {
  const msg = String(error?.message || '');
  if (!/constraint|SQLITE/i.test(msg)) return null;

  if (/UNIQUE constraint failed/i.test(msg)) {
    if (/allowed_domains\.domain/i.test(msg)) return 'Ese dominio ya está registrado en la plataforma.';
    if (/companies\.name/i.test(msg)) return 'Ya existe una empresa con ese nombre.';
    if (/sectors\.name/i.test(msg)) return 'Ya existe un sector con ese nombre.';
    if (/users\.email|profiles\.email/i.test(msg)) return 'Ya existe una cuenta con ese correo electrónico.';
    return 'Ese registro ya existe en el sistema.';
  }
  if (/FOREIGN KEY constraint failed/i.test(msg)) {
    return 'No se puede completar la operación porque otros registros dependen de él (empresa, sector o dominio asociado).';
  }
  if (/NOT NULL constraint failed/i.test(msg)) {
    return 'Faltan datos obligatorios. Revisa el formulario e inténtalo de nuevo.';
  }
  if (/CHECK constraint failed/i.test(msg)) {
    return 'Uno de los valores seleccionados no es válido.';
  }
  if (/SQLITE_CONSTRAINT/i.test(msg)) {
    return 'Los datos enviados no son válidos o ya existen en el sistema.';
  }
  return null;
}

/**
 * Devuelve una Response JSON con un mensaje amigable.
 * Los errores de restricción se responden como 409; el resto como 500 con el mensaje genérico.
 */
export function dbErrorResponse(error, fallback = 'Ocurrió un error inesperado. Intenta de nuevo.') {
  const friendly = friendlyDbMessage(error);
  return new Response(
    JSON.stringify({ error: friendly || fallback }),
    { status: friendly ? 409 : 500 }
  );
}
