/**
 * Muestra una alerta tipo modal premium utilizando SweetAlert2.
 * Utiliza importación dinámica (Dynamic Import) para cargar la librería
 * solo cuando se necesita, optimizando el rendimiento de carga inicial de la página al 100%.
 * 
 * @param {Object} options
 * @param {string} options.title - Título de la alerta
 * @param {string} options.text - Mensaje descriptivo
 * @param {'success' | 'error' | 'warning' | 'info' | 'question'} options.icon - Tipo de icono visual
 * @param {string} [options.confirmButtonText] - Texto del botón de acción
 */
export async function showAlert({ title, text, icon, confirmButtonText = 'Entendido' }) {
  const Swal = (await import('sweetalert2')).default;
  
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText,
    background: '#ffffff',
    color: '#0f172a',
    confirmButtonColor: '#DA291C',
    customClass: {
      popup: 'premium-popup',
    }
  });
}

/**
 * Muestra una notificación Toast (flotante, temporal y no intrusiva) en la esquina superior derecha.
 * Ideal para errores rápidos de validación o alertas sin interrumpir al usuario.
 * 
 * @param {Object} options
 * @param {string} options.text - Mensaje a mostrar
 * @param {'success' | 'error' | 'warning' | 'info'} options.icon - Tipo de icono visual
 */
export async function showToast({ text, icon }) {
  const Swal = (await import('sweetalert2')).default;
  
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    background: '#ffffff',
    color: '#0f172a',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  return Toast.fire({
    icon,
    title: text
  });
}
