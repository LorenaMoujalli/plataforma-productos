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

/**
 * Muestra una alerta de confirmación utilizando SweetAlert2.
 * 
 * @param {Object} options
 * @param {string} options.title - Título principal
 * @param {string} options.text - Texto explicativo
 * @param {string} [options.confirmButtonText] - Texto del botón de confirmación
 * @param {string} [options.cancelButtonText] - Texto del botón de cancelación
 * @returns {Promise<boolean>} - True si el usuario confirma, false si cancela.
 */
export async function showConfirm({ title, text, confirmButtonText = 'Sí, eliminar', cancelButtonText = 'Cancelar' }) {
  const Swal = (await import('sweetalert2')).default;
  
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#DA291C',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
    background: '#ffffff',
    color: '#0f172a',
    customClass: {
      popup: 'premium-popup',
    }
  });

  return result.isConfirmed;
}

/**
 * Muestra un formulario modal complejo para crear un usuario.
 * @returns {Promise<Object|null>} Los datos del usuario o null si cancela.
 */
export async function showCreateUserModal() {
  const Swal = (await import('sweetalert2')).default;
  
  const { value: formValues } = await Swal.fire({
    title: 'Registrar Nuevo Usuario',
    html: `
      <style>
        .swal2-html-container { margin: 1rem 0 0 0; overflow: visible; }
        .swal-form-group { margin-bottom: 1rem; text-align: left; }
        .swal-form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.85rem; color: #475569; }
        .swal-input-custom { width: 100%; box-sizing: border-box; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.95rem; font-family: inherit; transition: all 0.2s; outline: none; }
        .swal-input-custom:focus { border-color: #94a3b8; box-shadow: 0 0 0 3px rgba(226, 232, 240, 0.5); background-color: #fff; }
        .swal-select-custom { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em; cursor: pointer; }
      </style>
      <div class="swal-form-group">
        <label for="swal-name">Nombre y Apellido</label>
        <input id="swal-name" class="swal-input-custom" placeholder="Ej. Juan Pérez">
      </div>
      <div class="swal-form-group">
        <label for="swal-email">Correo Electrónico (@oberstaff.com)</label>
        <input id="swal-email" type="email" class="swal-input-custom" placeholder="juan@oberstaff.com">
      </div>
      <div class="swal-form-group">
        <label for="swal-password">Contraseña (Mínimo 6 caracteres)</label>
        <div style="position: relative;">
          <input id="swal-password" type="password" class="swal-input-custom" placeholder="••••••••" style="padding-right: 2.5rem;">
          <button type="button" tabindex="-1" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #64748b; padding: 0; display: flex;" onclick="const input = document.getElementById('swal-password'); const icon = this.querySelector('svg'); if(input.type === 'password'){ input.type='text'; icon.innerHTML='<path d=\\'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24\\'></path><line x1=\\'1\\' y1=\\'1\\' x2=\\'23\\' y2=\\'23\\'></line>'; } else { input.type='password'; icon.innerHTML='<path d=\\'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z\\'></path><circle cx=\\'12\\' cy=\\'12\\' r=\\'3\\'></circle>'; }">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>
      <div class="swal-form-group">
        <label for="swal-role">Rol en la plataforma</label>
        <select id="swal-role" class="swal-input-custom swal-select-custom">
          <option value="user">Usuario (Normal)</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Registrar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10b981', /* Verde para crear */
    cancelButtonColor: '#64748b',
    background: '#ffffff',
    color: '#0f172a',
    customClass: {
      popup: 'premium-popup',
    },
    preConfirm: () => {
      const name = document.getElementById('swal-name').value;
      const email = document.getElementById('swal-email').value;
      const password = document.getElementById('swal-password').value;
      const role = document.getElementById('swal-role').value;

      if (!name || !email || !password) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }
      
      const domain = email.split('@')[1];
      if (!domain || domain.toLowerCase() !== 'oberstaff.com') {
        Swal.showValidationMessage('El correo debe terminar en @oberstaff.com');
        return false;
      }

      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }

      return { name, email, password, role };
    }
  });

  return formValues || null;
}

/**
 * Muestra un formulario modal para editar un usuario.
 * @param {Object} user - Los datos actuales del usuario
 * @returns {Promise<Object|null>} Los datos actualizados o null si cancela.
 */
export async function showEditUserModal(user) {
  const Swal = (await import('sweetalert2')).default;
  
  const { value: formValues } = await Swal.fire({
    title: 'Editar Usuario',
    html: `
      <style>
        .swal2-html-container { margin: 1rem 0 0 0; overflow: visible; }
        .swal-form-group { margin-bottom: 1rem; text-align: left; }
        .swal-form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.85rem; color: #475569; }
        .swal-input-custom { width: 100%; box-sizing: border-box; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.95rem; font-family: inherit; transition: all 0.2s; outline: none; }
        .swal-input-custom:focus { border-color: #94a3b8; box-shadow: 0 0 0 3px rgba(226, 232, 240, 0.5); background-color: #fff; }
        .swal-input-disabled { background-color: #e2e8f0; color: #64748b; cursor: not-allowed; }
        .swal-select-custom { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em; cursor: pointer; }
      </style>
      <div class="swal-form-group">
        <label for="swal-edit-email">Correo Electrónico (@oberstaff.com)</label>
        <input id="swal-edit-email" type="email" class="swal-input-custom" value="${user.email}">
      </div>
      <div class="swal-form-group">
        <label for="swal-edit-password">Nueva Contraseña (Opcional, déjalo en blanco para no cambiar)</label>
        <div style="position: relative;">
          <input id="swal-edit-password" type="password" class="swal-input-custom" placeholder="••••••••" style="padding-right: 2.5rem;">
          <button type="button" tabindex="-1" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #64748b; padding: 0; display: flex;" onclick="const input = document.getElementById('swal-edit-password'); const icon = this.querySelector('svg'); if(input.type === 'password'){ input.type='text'; icon.innerHTML='<path d=\\'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24\\'></path><line x1=\\'1\\' y1=\\'1\\' x2=\\'23\\' y2=\\'23\\'></line>'; } else { input.type='password'; icon.innerHTML='<path d=\\'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z\\'></path><circle cx=\\'12\\' cy=\\'12\\' r=\\'3\\'></circle>'; }">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>
      <div class="swal-form-group">
        <label for="swal-edit-name">Nombre y Apellido</label>
        <input id="swal-edit-name" class="swal-input-custom" value="${user.name || ''}" placeholder="Ej. Juan Pérez">
      </div>
      <div class="swal-form-group">
        <label for="swal-edit-role">Rol en la plataforma</label>
        <select id="swal-edit-role" class="swal-input-custom swal-select-custom">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario (Normal)</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
        </select>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar Cambios',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0f172a',
    cancelButtonColor: '#64748b',
    background: '#ffffff',
    color: '#0f172a',
    customClass: {
      popup: 'premium-popup',
    },
    preConfirm: () => {
      const email = document.getElementById('swal-edit-email').value;
      const password = document.getElementById('swal-edit-password').value;
      const name = document.getElementById('swal-edit-name').value;
      const role = document.getElementById('swal-edit-role').value;

      if (!name || !email) {
        Swal.showValidationMessage('El nombre y correo son obligatorios');
        return false;
      }
      
      const domain = email.split('@')[1];
      if (!domain || domain.toLowerCase() !== 'oberstaff.com') {
        Swal.showValidationMessage('El correo debe terminar en @oberstaff.com');
        return false;
      }
      
      if (password && password.length < 6) {
        Swal.showValidationMessage('La nueva contraseña debe tener al menos 6 caracteres');
        return false;
      }

      return { email, password, name, role };
    }
  });

  return formValues || null;
}
