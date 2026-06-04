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
 * Muestra un formulario modal para crear un nuevo usuario.
 * @param {string[]} allowedDomains - Lista de dominios permitidos para validación.
 * @param {Array<{id: number, name: string}>} companies - Lista de empresas para el select.
 * @returns {Promise<Object|null>} Los datos del nuevo usuario o null si cancela.
 */
export async function showCreateUserModal(allowedDomains = [], companies = []) {
  const Swal = (await import('sweetalert2')).default;
  const domainsHint = allowedDomains.length > 0
    ? allowedDomains.map(d => `@${d}`).join(', ')
    : 'dominios autorizados';

  // Generar opciones de empresas
  const companyOptions = companies.map(c => 
    `<option value="${c.id}">${c.name}</option>`
  ).join('');
  
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
        <label for="swal-new-email">Correo Electrónico (${domainsHint})</label>
        <input id="swal-new-email" type="email" class="swal-input-custom" placeholder="usuario@dominio.com">
      </div>
      <div class="swal-form-group">
        <label for="swal-new-password">Contraseña Provisional</label>
        <div style="position: relative;">
          <input id="swal-new-password" type="password" class="swal-input-custom" placeholder="••••••••" style="padding-right: 2.5rem;">
          <button type="button" tabindex="-1" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #64748b; padding: 0; display: flex;" onclick="const input = document.getElementById('swal-new-password'); const icon = this.querySelector('svg'); if(input.type === 'password'){ input.type='text'; icon.innerHTML='<path d=\\'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24\\'></path><line x1=\\'1\\' y1=\\'1\\' x2=\\'23\\' y2=\\'23\\'></line>'; } else { input.type='password'; icon.innerHTML='<path d=\\'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z\\'></path><circle cx=\\'12\\' cy=\\'12\\' r=\\'3\\'></circle>'; }">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>
      <div class="swal-form-group">
        <label for="swal-new-name">Nombre y Apellido</label>
        <input id="swal-new-name" class="swal-input-custom" placeholder="Ej. Juan Pérez">
      </div>
      <div class="swal-form-group">
        <label for="swal-new-company">Empresa</label>
        <select id="swal-new-company" class="swal-input-custom swal-select-custom">
          <option value="">Sin empresa asignada</option>
          ${companyOptions}
        </select>
      </div>
      <div class="swal-form-group">
        <label for="swal-new-role">Rol en la plataforma</label>
        <select id="swal-new-role" class="swal-input-custom swal-select-custom">
          <option value="user">Usuario (Normal)</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <div class="swal-form-group">
        <label for="swal-new-expiration" style="display:flex;align-items:center;gap:0.4rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Fecha de Expiración <span style="font-weight:400;color:#94a3b8;">(Opcional)</span>
        </label>
        <input id="swal-new-expiration" type="date" class="swal-input-custom" style="cursor:pointer;">
        <p class="swal-hint" style="font-size:0.8rem;color:#94a3b8;margin-top:0.3rem;">Si no se establece, quedará como "No especificado"</p>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Crear Usuario',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#64748b',
    background: '#ffffff',
    color: '#0f172a',
    customClass: {
      popup: 'premium-popup',
    },
    preConfirm: () => {
      const email = document.getElementById('swal-new-email').value.trim().toLowerCase();
      const password = document.getElementById('swal-new-password').value;
      const name = document.getElementById('swal-new-name').value;
      const role = document.getElementById('swal-new-role').value;
      const companyId = document.getElementById('swal-new-company').value;
      const expirationDate = document.getElementById('swal-new-expiration').value || null;

      if (!name || !email || !password) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }
      
      const domain = email.split('@')[1];
      if (!domain) {
        Swal.showValidationMessage('Ingresa un correo electrónico válido');
        return false;
      }

      if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
        Swal.showValidationMessage(`Dominio no autorizado. Permitidos: ${allowedDomains.map(d => '@' + d).join(', ')}`);
        return false;
      }
      
      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        return false;
      }

      return { email, password, name, role, company_id: companyId ? parseInt(companyId) : null, expiration_date: expirationDate };
    }
  });

  return formValues || null;
}

/**
 * Muestra un formulario modal para editar un usuario.
 * @param {Object} user - Los datos actuales del usuario
 * @param {string[]} allowedDomains - Lista de dominios permitidos para validación.
 * @param {Array<{id: number, name: string}>} companies - Lista de empresas para el select.
 * @returns {Promise<Object|null>} Los datos actualizados o null si cancela.
 */
export async function showEditUserModal(user, allowedDomains = [], companies = []) {
  const Swal = (await import('sweetalert2')).default;
  const domainsHint = allowedDomains.length > 0
    ? allowedDomains.map(d => `@${d}`).join(', ')
    : 'dominios autorizados';

  // Generar opciones de empresas
  const companyOptions = companies.map(c => 
    `<option value="${c.id}" ${user.company_id == c.id ? 'selected' : ''}>${c.name}</option>`
  ).join('');

  // Formatear fecha para el input tipo date (YYYY-MM-DD)
  const formattedExpiration = user.expiration_date ? user.expiration_date.split('T')[0] : '';
  
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
        <label for="swal-edit-email">Correo Electrónico (${domainsHint})</label>
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
        <label for="swal-edit-company">Empresa</label>
        <select id="swal-edit-company" class="swal-input-custom swal-select-custom">
          <option value="">Sin empresa asignada</option>
          ${companyOptions}
        </select>
      </div>
      <div class="swal-form-group">
        <label for="swal-edit-role">Rol en la plataforma</label>
        <select id="swal-edit-role" class="swal-input-custom swal-select-custom">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario (Normal)</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
        </select>
      </div>
      <div class="swal-form-group">
        <label for="swal-edit-expiration" style="display:flex;align-items:center;gap:0.4rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Fecha de Expiración <span style="font-weight:400;color:#94a3b8;">(Opcional)</span>
        </label>
        <input id="swal-edit-expiration" type="date" class="swal-input-custom" style="cursor:pointer;" value="${formattedExpiration}">
        <p class="swal-hint" style="font-size:0.8rem;color:#94a3b8;margin-top:0.3rem;">Deja vacío para que quede como "No especificado"</p>
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
      const email = document.getElementById('swal-edit-email').value.trim().toLowerCase();
      const password = document.getElementById('swal-edit-password').value;
      const name = document.getElementById('swal-edit-name').value;
      const role = document.getElementById('swal-edit-role').value;
      const companyId = document.getElementById('swal-edit-company').value;
      const expirationDate = document.getElementById('swal-edit-expiration').value || null;

      if (!name || !email) {
        Swal.showValidationMessage('El nombre y correo son obligatorios');
        return false;
      }
      
      const domain = email.split('@')[1];
      if (!domain) {
        Swal.showValidationMessage('Ingresa un correo electrónico válido');
        return false;
      }

      if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
        Swal.showValidationMessage(`Dominio no autorizado. Permitidos: ${allowedDomains.map(d => '@' + d).join(', ')}`);
        return false;
      }
      
      if (password && password.length < 6) {
        Swal.showValidationMessage('La nueva contraseña debe tener al menos 6 caracteres');
        return false;
      }

      return { email, password, name, role, company_id: companyId ? parseInt(companyId) : null, expiration_date: expirationDate };
    }
  });

  return formValues || null;
}

/**
 * Muestra un modal para agregar un nuevo dominio permitido.
 * @returns {Promise<{domain:string}|null>}
 */
export async function showCreateDomainModal() {
  const Swal = (await import('sweetalert2')).default;

  const { value: formValues } = await Swal.fire({
    title: 'Agregar Dominio',
    html: `
      <style>
        .swal2-html-container { margin: 1rem 0 0 0; overflow: visible; }
        .swal-form-group { margin-bottom: 1rem; text-align: left; }
        .swal-form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.85rem; color: #475569; }
        .swal-input-custom { width: 100%; box-sizing: border-box; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.95rem; font-family: inherit; transition: all 0.2s; outline: none; }
        .swal-input-custom:focus { border-color: #94a3b8; box-shadow: 0 0 0 3px rgba(226, 232, 240, 0.5); background-color: #fff; }
        .swal-hint { font-size: 0.8rem; color: #94a3b8; margin-top: 0.3rem; }
      </style>
      <div class="swal-form-group">
        <label for="swal-domain">Dominio</label>
        <input id="swal-domain" class="swal-input-custom" placeholder="empresa.com" autocomplete="off">
        <p class="swal-hint">Sin @ ni http. Ej: empresa.com</p>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#64748b',
    background: '#ffffff',
    color: '#0f172a',
    customClass: { popup: 'premium-popup' },
    preConfirm: () => {
      const domain = document.getElementById('swal-domain').value.trim().toLowerCase();
      if (!domain) {
        Swal.showValidationMessage('El dominio es obligatorio');
        return false;
      }
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
      if (!domainRegex.test(domain)) {
        Swal.showValidationMessage('Ingresa un dominio válido. Ej: empresa.com');
        return false;
      }
      return { domain };
    }
  });

  return formValues || null;
}

/**
 * Muestra un modal para editar un dominio existente.
 * @param {{ id: number, domain: string }} domainData
 * @returns {Promise<{domain:string}|null>}
 */
export async function showEditDomainModal(domainData) {
  const Swal = (await import('sweetalert2')).default;

  const { value: formValues } = await Swal.fire({
    title: 'Editar Dominio',
    html: `
      <style>
        .swal2-html-container { margin: 1rem 0 0 0; overflow: visible; }
        .swal-form-group { margin-bottom: 1rem; text-align: left; }
        .swal-form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.85rem; color: #475569; }
        .swal-input-custom { width: 100%; box-sizing: border-box; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.95rem; font-family: inherit; transition: all 0.2s; outline: none; }
        .swal-input-custom:focus { border-color: #94a3b8; box-shadow: 0 0 0 3px rgba(226, 232, 240, 0.5); background-color: #fff; }
        .swal-hint { font-size: 0.8rem; color: #94a3b8; margin-top: 0.3rem; }
      </style>
      <div class="swal-form-group">
        <label for="swal-edit-domain">Dominio</label>
        <input id="swal-edit-domain" class="swal-input-custom" value="${domainData.domain}" autocomplete="off">
        <p class="swal-hint">Sin @ ni http. Ej: empresa.com</p>
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
    customClass: { popup: 'premium-popup' },
    preConfirm: () => {
      const domain = document.getElementById('swal-edit-domain').value.trim().toLowerCase();
      if (!domain) {
        Swal.showValidationMessage('El dominio es obligatorio');
        return false;
      }
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
      if (!domainRegex.test(domain)) {
        Swal.showValidationMessage('Ingresa un dominio válido. Ej: empresa.com');
        return false;
      }
      return { domain };
    }
  });

  return formValues || null;
}
