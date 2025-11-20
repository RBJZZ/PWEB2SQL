document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const userIdFromUrl = params.get('id'); 
    const targetUserId = userIdFromUrl || currentUser.id;
    
    const profilePageContainer = document.getElementById('profile-page-container');
    let userData = null;

    // Elementos del Modal de Edición de Datos (Username/Avatar)
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeModalBtn = editProfileModal ? editProfileModal.querySelector('.close-modal-btn') : null;
    const editProfileForm = document.getElementById('editProfileForm');
    const usernameInput = document.getElementById('edit-username');
    const avatarFileInput = document.getElementById('edit-avatar-file');
    const avatarPreview = document.getElementById('avatar-preview'); 
    const coverFileInput = document.getElementById('edit-cover-file');
    const coverPreview = document.getElementById('cover-preview');
    const modalMessage = document.getElementById('edit-modal-message');

    // --- 1. CARGAR DATOS ---
    async function loadProfileData() {
        try {
            // Usamos ruta relativa
            const response = await fetch(`/api/users/${targetUserId}`);
            if (!response.ok) throw new Error('Usuario no encontrado.');
            
            userData = await response.json();
            renderProfile(userData);
            
            // Solo activamos el modal si es el dueño del perfil
            if (currentUser.id == targetUserId) {
                addEventListenersForModal();
            }
        } catch (error) {
            profilePageContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
            console.error(error);
        }
    }

    // --- 2. RENDERIZAR PERFIL ---
    function renderProfile(user) {
        profilePageContainer.innerHTML = '';

        // Recuperar personalización visual del LocalStorage
        const activeFrame = localStorage.getItem(`frame_${user.id}`);
        const activeThemeClass = localStorage.getItem(`theme_class_${user.id}`); 

        const profileCard = document.createElement('div');
        profileCard.className = 'profile-card';

        // Botones de Acción (Solo para el dueño)
        const actionButtons = currentUser.id == user.id 
            ? `<div style="display:flex; gap:10px; justify-content:center; margin-top:15px;">
                <button id="edit-profile-btn" class="btn-edit-profile" style="margin:0;"><i class="fa-solid fa-pencil"></i> Datos</button>
                <a href="personalizar.html" class="btn-edit-profile" style="text-decoration:none; background:#4a00e0; color:white; margin:0;"><i class="fa-solid fa-shirt"></i> Personalizar</a>
                </div>`
            : ''; 

        const serverUrl = ''; // Ruta relativa
        const avatarUrl = user.foto_perfil_url ? `${serverUrl}${user.foto_perfil_url}` : 'https://i.pravatar.cc/150';
        const coverImageUrl = user.foto_portada_url ? `url(${serverUrl}${user.foto_portada_url})` : '';

        // Aplicar clase del tema visual (si existe)
        const bannerClasses = `profile-banner ${activeThemeClass || ''}`;

        profileCard.innerHTML = `
            <div id="profile-banner" class="${bannerClasses}" style="background-image: ${coverImageUrl}"></div>
            
            <div class="avatar-container">
                <img src="${avatarUrl}" alt="Avatar" class="profile-avatar">
                <img src="${activeFrame || ''}" class="profile-frame" style="display: ${activeFrame ? 'block' : 'none'}">
            </div>

            <div class="profile-content">
                <h1 class="profile-name">${user.username}</h1>
                
                ${actionButtons}
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <i class="fa-solid fa-chart-simple"></i>
                        <div class="stat-value">${user.Publicacions ? user.Publicacions.length : 0}</div>
                        <div class="stat-label">Polls</div>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-circle-check"></i>
                        <div class="stat-value">${user.total_aciertos || 0}</div>
                        <div class="stat-label">Aciertos</div>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-coins"></i>
                        <div class="stat-value">${user.fan_coins}</div>
                        <div class="stat-label">FanCoins</div>
                    </div>
                </div>

                <div class="achievements">
                    ${renderBadgesOnly(user)}
                </div>
            </div>
        `;
        profilePageContainer.appendChild(profileCard);

        // Sección de Publicaciones
        const postsSection = document.createElement('div');
        let postsHTML = `<h2 class="user-posts-title">Mis Publicaciones</h2>`;
        
        if (user.Publicacions && user.Publicacions.length > 0) {
            user.Publicacions.forEach(pub => {
                // Muestra botones desactivados como preview
                const optionsHTML = pub.Opcions ? pub.Opcions.map(op => `<button class="option-btn" disabled>${op.texto_opcion}</button>`).join('') : '';
                postsHTML += `
                    <div class="post">
                        <p class="post-question">${pub.texto_pregunta}</p>
                        <div class="post-options-grid">${optionsHTML}</div>
                    </div>
                `;
            });
        } else {
            postsHTML += `<div class="post"><p>Aún no has creado ninguna publicación.</p></div>`;
        }
        
        postsSection.innerHTML = postsHTML;
        profilePageContainer.appendChild(postsSection);
    }

    // --- 3. RENDERIZAR SOLO INSIGNIAS (Limpiamos lo demás) ---
    function renderBadgesOnly(user) {
        if (!user.Premios) return '';

        // Filtramos solo insignias
        const insignias = user.Premios.filter(p => p.tipo_premio === 'INSIGNIA');

        if (insignias.length === 0) return '';

        return `
            <h4 style="color:#666; margin-bottom:15px; margin-top:20px; text-align: center; width: 100%;">
                <i class="fa-solid fa-medal" style="color: #ffd700;"></i> Mis Insignias
            </h4>
            <div class="achievements-icons" style="display:flex; gap:15px; justify-content:center; flex-wrap:wrap; margin-bottom: 20px;">
                ${insignias.map(p => `
                    <div class="badge-item" title="${p.nombre_premio}">
                        <img src="${p.imagen_preview_url}" alt="${p.nombre_premio}">
                    </div>
                `).join('')}
            </div>
        `;
    }

    // --- 4. LOGICA DEL MODAL DE DATOS (Username / Fotos Base) ---
    function addEventListenersForModal() {
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) editProfileBtn.addEventListener('click', openEditModal);
        
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => editProfileModal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target === editProfileModal) editProfileModal.style.display = 'none';
        });

        // Previews de subida de archivos
        avatarFileInput.addEventListener('change', () => {
            const file = avatarFileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => { avatarPreview.src = e.target.result; };
                reader.readAsDataURL(file);
            }
        });

        coverFileInput.addEventListener('change', () => {
            const file = coverFileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => { coverPreview.src = e.target.result; };
                reader.readAsDataURL(file);
            }
        });

        const deleteBtn = document.getElementById('btn-delete-account');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (confirm('⚠️ ¿ESTÁS SEGURO?\n\nEsta acción borrará tu cuenta, tus monedas, tus posts y tu inventario para siempre.\n\nNo se puede deshacer.')) {
                    try {
                        const response = await fetch(`/api/users/${currentUser.id}`, { method: 'DELETE' });
                        if (response.ok) {
                            alert('Tu cuenta ha sido eliminada. Hasta luego. 👋');
                            localStorage.removeItem('currentUser');
                            window.location.href = 'index.html';
                        } else {
                            alert('Error al eliminar cuenta.');
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            });
        }

        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }

    function openEditModal() {
        usernameInput.value = userData.username;
        const serverUrl = '';
        
        avatarPreview.src = userData.foto_perfil_url 
            ? `${serverUrl}${userData.foto_perfil_url}` 
            : 'https://i.pravatar.cc/150';
        avatarFileInput.value = ''; 

        coverPreview.src = userData.foto_portada_url 
            ? `${serverUrl}${userData.foto_portada_url}` 
            : 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop';
        coverFileInput.value = '';

        modalMessage.textContent = '';
        editProfileModal.style.display = 'flex';
    }

    async function handleProfileUpdate(event) {
        event.preventDefault();
        modalMessage.textContent = '';
        
        const formData = new FormData();
        formData.append('username', usernameInput.value);
        if (avatarFileInput.files[0]) formData.append('avatar', avatarFileInput.files[0]);
        if (coverFileInput.files[0]) formData.append('cover', coverFileInput.files[0]);
        
        try {
            const response = await fetch(`/api/users/${currentUser.id}`, {
                method: 'PUT',
                body: formData 
            });
            const result = await response.json();
            
            if (!response.ok) throw new Error(result.message);
            
            editProfileModal.style.display = 'none';
            loadProfileData(); // Recargar para ver cambios
        } catch (error) {
            modalMessage.style.color = 'red';
            modalMessage.textContent = `Error: ${error.message}`;
        }
    }

    // Iniciar carga
    loadProfileData();
});