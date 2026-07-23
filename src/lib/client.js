let lastUploadedUrl = '';

export const supabase = {
  auth: {
    async getSession() {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const body = await res.json();
        return { data: { session: body.session }, error: null };
      } catch (err) {
        return { data: { session: null }, error: err };
      }
    }
  },
  
  storage: {
    from(bucketName) {
      return {
        async upload(path, file, options) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch('/api/companies/logo', {
              method: 'POST',
              body: formData
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'Error al subir archivo');
            
            lastUploadedUrl = body.publicUrl;
            return { data: { path }, error: null };
          } catch (err) {
            return { data: null, error: err };
          }
        },
        getPublicUrl(path) {
          return { data: { publicUrl: lastUploadedUrl || `/uploads/logos/${path.split('/').pop()}` } };
        }
      };
    }
  },

  from(table) {
    return {
      select(fields) {
        return {
          eq(column, value) {
            return {
              async maybeSingle() {
                if (table === 'profiles') {
                  try {
                    const res = await fetch(`/api/auth/profile?id=${value}`, { cache: 'no-store' });
                    const body = await res.json();
                    return { data: body.data, error: null };
                  } catch (err) {
                    return { data: null, error: err };
                  }
                }
                return { data: null, error: null };
              },
              async single() {
                return this.maybeSingle();
              }
            };
          }
        };
      },
      
      update(values) {
        return {
          eq(column, value) {
            return (async () => {
              if (table === 'profiles') {
                try {
                  const profileRes = await fetch(`/api/auth/profile?id=${value}`);
                  const profileData = await profileRes.json();
                  const merged = { ...profileData.data, ...values };

                  const res = await fetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(merged)
                  });
                  const body = await res.json();
                  if (!res.ok) throw new Error(body.error || 'Error al actualizar perfil');
                  return { data: body.data, error: null };
                } catch (err) {
                  return { data: null, error: err };
                }
              }
              return { data: null, error: null };
            })();
          }
        };
      }
    };
  },

  async rpc(functionName, args = {}) {
    try {
      if (functionName === 'update_own_profile') {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: args.p_name,
            email: args.p_email,
            company_id: args.p_company_id
          })
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Error al actualizar perfil');
        return { data: body.data, error: null };
      }
      
      if (functionName === 'update_own_email') {
        // Obtener perfil actual para rellenar campos obligatorios
        const profileRes = await fetch('/api/auth/profile');
        const profileData = await profileRes.json();
        
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: profileData.data?.name || '',
            email: args.p_email,
            company_id: profileData.data?.company_id || null
          })
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Error al actualizar email');
        return { data: body.data, error: null };
      }
      
      if (functionName === 'admin_update_user_company') {
        const profileRes = await fetch(`/api/auth/profile?id=${args.p_user_id}`, { cache: 'no-store' });
        const profileData = await profileRes.json();
        
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: args.p_user_id,
            name: profileData.data?.name || '',
            role: profileData.data?.role || 'user',
            email: profileData.data?.email || '',
            companyId: args.p_company_id,
            expirationDate: profileData.data?.expiration_date || null
          })
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Error al actualizar empresa del usuario');
        return { data: true, error: null };
      }

      if (functionName === 'admin_update_user_full') {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: args.p_user_id,
            name: args.p_name,
            role: args.p_role,
            email: args.p_email,
            password: args.p_password,
            companyId: args.p_company_id
          })
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Error al actualizar usuario');
        return { data: true, error: null };
      }

      if (functionName === 'admin_update_user_expiration') {
        const profileRes = await fetch(`/api/auth/profile?id=${args.p_user_id}`, { cache: 'no-store' });
        const profileData = await profileRes.json();
        
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: args.p_user_id,
            name: profileData.data?.name || '',
            role: profileData.data?.role || 'user',
            email: profileData.data?.email || '',
            companyId: profileData.data?.company_id || null,
            expirationDate: args.p_expiration_date
          })
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Error al actualizar fecha de expiración del usuario');
        return { data: true, error: null };
      }
      
      return { data: null, error: new Error(`RPC ${functionName} no soportado en mock`) };
    } catch (err) {
      return { data: null, error: err };
    }
  }
};