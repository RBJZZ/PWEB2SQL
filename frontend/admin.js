document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Validación de Seguridad
    if (!currentUser || currentUser.rol !== 'admin') {
        alert('⛔ Acceso denegado: Se requieren permisos de Administrador.');
        window.location.href = 'home.html';
        return;
    }

    const postsContainer = document.getElementById('pending-posts-container');
    const usersContainer = document.getElementById('user-list-container');
    const userSearchInput = document.getElementById('user-search-input');

    async function fetchPendingPosts() {
        try {
            const response = await fetch('/api/admin/publicaciones/pendientes');
            if (!response.ok) throw new Error('Error cargando posts.');
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) {
            postsContainer.innerHTML = `<div class="empty-state"><p style="color: red;">${error.message}</p></div>`;
        }
    }

    function renderPosts(posts) {
        if (posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-clipboard-check"></i>
                    <h2>¡Todo limpio!</h2>
                    <p>No hay publicaciones pendientes.</p>
                </div>`;
            return;
        }

        const serverUrl = '';
        postsContainer.innerHTML = posts.map(post => {

            let optionsHTML = '';
            const hasImages = post.Opcions && post.Opcions.some(op => op.imagen_url);
            if (hasImages) {
                optionsHTML = `<div class="review-options-grid">` + post.Opcions.map(op => 
                    `<div class="review-option"><img src="${serverUrl}${op.imagen_url}"><div>${op.texto_opcion}</div></div>`
                ).join('') + `</div>`;
            } else {
                optionsHTML = `<div class="review-options-grid">` + post.Opcions.map(op => 
                    `<div class="review-option">${op.texto_opcion}</div>`
                ).join('') + `</div>`;
            }

            return `
            <div class="post-review-card" id="post-card-${post.id}">
                <div class="review-header">
                    <div class="review-user">
                        <i class="fa-solid fa-user-circle" style="font-size: 1.5rem; color: #ccc;"></i>
                        <span>@${post.User ? post.User.username : 'Anónimo'}</span>
                    </div>
                    <span class="review-badge">Pendiente</span>
                </div>
                <div class="review-content">
                    <div class="review-question">${post.texto_pregunta}</div>
                    ${optionsHTML}
                </div>
                <div class="review-actions">
                    <button class="btn-reject" data-id="${post.id}"><i class="fa-solid fa-ban"></i> Rechazar</button>
                    <button class="btn-approve" data-id="${post.id}"><i class="fa-solid fa-check"></i> Aprobar</button>
                </div>
            </div>`;
        }).join('');
    }

    async function fetchUsers(query = '') {
        if (!usersContainer) return;
        try {
            const url = query 
                ? `/api/admin/users?q=${encodeURIComponent(query)}` 
                : '/api/admin/users';

            const response = await fetch(url);
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            usersContainer.innerHTML = '<p>Error cargando usuarios.</p>';
        }
    }

    function renderUsers(users) {
        const serverUrl = '';
        usersContainer.innerHTML = users.map(u => {
            const isMe = u.id === currentUser.id;
            const isAdmin = u.rol === 'admin';
            
            const btnAction = isAdmin 
                ? `<button onclick="toggleUserRole(${u.id}, 'admin')" style="background:#ffebee; color:#c62828; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" title="Quitar Admin"><i class="fa-solid fa-user-minus"></i></button>`
                : `<button onclick="toggleUserRole(${u.id}, 'usuario')" style="background:#e8f5e9; color:#2e7d32; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" title="Hacer Admin"><i class="fa-solid fa-user-shield"></i></button>`;

            return `
            <div class="user-card">
                <div class="user-card-info">
                    <img src="${u.foto_perfil_url ? serverUrl+u.foto_perfil_url : 'https://i.pravatar.cc/150'}" class="user-card-avatar">
                    <div>
                        <div style="font-weight:bold; font-size:0.95rem;">@${u.username} ${isMe ? '(Tú)' : ''}</div>
                        <div style="font-size:0.8rem; color:#999;">${u.email}</div>
                        <span class="role-badge ${isAdmin ? 'role-admin' : 'role-user'}">${u.rol}</span>
                    </div>
                </div>
                <div>
                    ${isMe ? '' : btnAction} </div>
            </div>`;
        }).join('');
    }

    if (userSearchInput) {
        let timeout = null;
        userSearchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            
            timeout = setTimeout(() => {
                const term = e.target.value.trim();
                fetchUsers(term);
            }, 300);
        });
    }

    window.toggleUserRole = async (id, currentRol) => {
        const newRol = currentRol === 'admin' ? 'usuario' : 'admin';
        const actionName = newRol === 'admin' ? 'HACER ADMINISTRADOR' : 'QUITAR PERMISOS';
        
        if (!confirm(`¿Estás seguro de ${actionName} a este usuario?`)) return;

        try {
            const res = await fetch(`/api/admin/users/${id}/rol`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ nuevoRol: newRol })
            });
            
            if (res.ok) {
                alert('Rol actualizado exitosamente.');
                fetchUsers(); // Recargar lista
            } else {
                alert('Error al actualizar.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    postsContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn || !btn.dataset.id) return;
        
        const postId = btn.dataset.id;
        const nuevoEstado = btn.classList.contains('btn-approve') ? 'aprobado' : 'rechazado';
        
        try {
            await fetch(`/api/admin/publicaciones/${postId}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevoEstado })
            });
            const card = document.getElementById(`post-card-${postId}`);
            if(card) card.remove();
            if (postsContainer.children.length === 0) fetchPendingPosts();
        } catch(e) { console.error(e); }
    });

    // Inicializar
    fetchPendingPosts();
    fetchUsers();
});