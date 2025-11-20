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

    // Elementos del Modal
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
            const response = await fetch(`http://localhost:3000/api/users/${targetUserId}`);
            if (!response.ok) throw new Error('Usuario no encontrado.');
            
            userData = await response.json();
            renderProfile(userData);
            
            if (currentUser.id == targetUserId) {
                addEventListenersForModal();
            }
        } catch (error) {
            profilePageContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
            console.error(error); // Para ver detalles en consola
        }
    }

    // --- 2. RENDERIZAR PERFIL (CORREGIDO) ---
    function renderProfile(user) {
        profilePageContainer.innerHTML = '';

        // AQUI ESTABA EL ERROR: Aseguramos que estas variables existan
        const activeFrame = localStorage.getItem(`frame_${user.id}`);
        const activeThemeClass = localStorage.getItem(`theme_class_${user.id}`); 

        const profileCard = document.createElement('div');
        profileCard.className = 'profile-card';

        const editButtonHTML = currentUser.id == user.id 
            ? `<button id="edit-profile-btn" class="btn-edit-profile"><i class="fa-solid fa-pencil"></i> Editar Perfil</button>`
            : ''; 

        const serverUrl = 'http://localhost:3000';
        const avatarUrl = user.foto_perfil_url ? `${serverUrl}${user.foto_perfil_url}` : 'https://i.pravatar.cc/150';
        const coverImageUrl = user.foto_portada_url ? `url(${serverUrl}${user.foto_portada_url})` : '';

        // Aplicamos la clase del tema si existe
        const bannerClasses = `profile-banner ${activeThemeClass || ''}`;

        profileCard.innerHTML = `
            <div id="profile-banner" class="${bannerClasses}" style="background-image: ${coverImageUrl}"></div>
            
            <div class="avatar-container">
                <img src="${avatarUrl}" alt="Avatar" class="profile-avatar">
                <img src="${activeFrame || ''}" class="profile-frame" style="display: ${activeFrame ? 'block' : 'none'}">
            </div>

            <div class="profile-content">
                <h1 class="profile-name">${user.username}</h1>
                ${editButtonHTML} 
                
                <div class="profile-stats">
                    <div class="stat-item"><i class="fa-solid fa-chart-simple"></i><div class="stat-value">${user.Publicacions ? user.Publicacions.length : 0}</div><div class="stat-label">Polls</div></div>
                    <div class="stat-item"><i class="fa-solid fa-circle-check"></i><div class="stat-value">171</div><div class="stat-label">Aciertos</div></div>
                    <div class="stat-item"><i class="fa-solid fa-coins"></i><div class="stat-value">${user.fan_coins}</div><div class="stat-label">FanCoins</div></div>
                </div>

                <div class="achievements">
                    ${renderInventorySection(user)}
                </div>
            </div>
        `;
        profilePageContainer.appendChild(profileCard);

        // Sección de Publicaciones
        const postsSection = document.createElement('div');
        let postsHTML = `<h2 class="user-posts-title">Mis Publicaciones</h2>`;
        
        if (user.Publicacions && user.Publicacions.length > 0) {
            user.Publicacions.forEach(pub => {
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


    function renderInventorySection(user) {
        if (!user.Premios || user.Premios.length === 0) {
            return '<p style="color: #999; font-size: 0.9rem; margin-top: 20px;">Aún no tienes ítems. ¡Visita la tienda!</p>';
        }

        const insignias = user.Premios.filter(p => p.tipo_premio === 'INSIGNIA');
        const marcos = user.Premios.filter(p => p.tipo_premio === 'BORDE_PERFIL');
        const temas = user.Premios.filter(p => p.tipo_premio === 'TEMA_PERFIL');

        let html = '';

        // Insignias
        if (insignias.length > 0) {
            html += `<h4 style="color:#666; margin-bottom:10px; margin-top:20px;">Insignias</h4>
                    <div class="achievements-icons" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                        ${insignias.map(p => `<img src="${p.imagen_preview_url}" title="${p.nombre_premio}" style="width:40px; height:40px;">`).join('')}
                    </div>`;
        }

        if (currentUser.id == user.id) {
            // Marcos
            if (marcos.length > 0) {
                html += `<h4 style="color:#666; margin-bottom:10px; margin-top:20px;">Marcos de Perfil</h4>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
                            ${marcos.map(p => `
                                <div class="inventory-item-card">
                                    <img src="${p.imagen_preview_url}" style="width:50px; height:50px; object-fit:contain;">
                                    <button class="equip-btn" onclick="equiparItem('frame', '${p.imagen_preview_url}', ${user.id})">Usar</button>
                                </div>
                            `).join('')}
                            <div class="inventory-item-card" style="justify-content:center;"><button class="equip-btn" style="background:#dc3545;" onclick="equiparItem('frame', '', ${user.id})">Quitar</button></div>
                        </div>`;
            }

            // Temas (AQUÍ ESTÁ EL CAMBIO CLAVE)
            if (temas.length > 0) {
                html += `<h4 style="color:#666; margin-bottom:10px; margin-top:20px;">Efectos de Portada</h4>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
                            ${temas.map(p => {
                                const cssClass = THEME_MAP[p.nombre_premio];
                                
                                const previewHTML = cssClass 
                                    ? `<div class="inventory-preview-box ${cssClass}"></div>`
                                    : `<img src="${p.imagen_preview_url}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">`;

                                return `
                                <div class="inventory-item-card">
                                    ${previewHTML}
                                    <button class="equip-btn" onclick="equiparItem('theme', '${p.nombre_premio}', ${user.id})">Usar</button>
                                </div>
                                `;
                            }).join('')}
                            <div class="inventory-item-card" style="justify-content:center;"><button class="equip-btn" style="background:#dc3545;" onclick="equiparItem('theme', '', ${user.id})">Quitar</button></div>
                        </div>`;
            }
        }

        return html;
    }

    // --- 4. LOGICA DEL MODAL DE EDICION ---
    function addEventListenersForModal() {
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) editProfileBtn.addEventListener('click', openEditModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => editProfileModal.style.display = 'none');
        
        window.addEventListener('click', (event) => {
            if (event.target === editProfileModal) editProfileModal.style.display = 'none';
        });

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

        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }

    function openEditModal() {
        usernameInput.value = userData.username;
        const serverUrl = 'http://localhost:3000';
        
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
            const response = await fetch(`http://localhost:3000/api/users/${currentUser.id}`, {
                method: 'PUT',
                body: formData 
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            editProfileModal.style.display = 'none';
            loadProfileData(); 
        } catch (error) {
            modalMessage.style.color = 'red';
            modalMessage.textContent = `Error: ${error.message}`;
        }
    }

    // Iniciar carga
    loadProfileData();
});

// --- 5. FUNCIÓN GLOBAL PARA EQUIPAR (FUERA DEL DOMContentLoaded) ---
const THEME_MAP = {
    'Efecto Neón': 'effect-neon',
    'Lluvia Dorada': 'effect-gold',
    'Modo Cyberpunk': 'effect-glitch'
};

window.equiparItem = function(type, value, userId) {
    if (type === 'frame') {
        const frameEl = document.querySelector('.profile-frame');
        if (value) {
            frameEl.src = value;
            frameEl.style.display = 'block';
            localStorage.setItem(`frame_${userId}`, value);
        } else {
            frameEl.style.display = 'none';
            localStorage.removeItem(`frame_${userId}`);
        }
    } else if (type === 'theme') {
        const bannerEl = document.getElementById('profile-banner');
        // Limpiar clases previas
        bannerEl.className = 'profile-banner';
        
        if (value) {
            // Si value es el nombre del premio, buscamos su clase
            const cssClass = THEME_MAP[value];
            if (cssClass) {
                bannerEl.classList.add(cssClass);
                localStorage.setItem(`theme_class_${userId}`, cssClass);
            }
        } else {
            localStorage.removeItem(`theme_class_${userId}`);
        }
    }
};