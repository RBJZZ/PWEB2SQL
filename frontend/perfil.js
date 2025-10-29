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

    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeModalBtn = editProfileModal.querySelector('.close-modal-btn');
    const editProfileForm = document.getElementById('editProfileForm');
    const usernameInput = document.getElementById('edit-username');
    const avatarFileInput = document.getElementById('edit-avatar-file');
    const avatarPreview = document.getElementById('avatar-preview'); 
    const coverFileInput = document.getElementById('edit-cover-file');
    const coverPreview = document.getElementById('cover-preview');
    const modalMessage = document.getElementById('edit-modal-message');

     async function loadProfileData() {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${targetUserId}`);
            if (!response.ok) throw new Error('Usuario no encontrado.');
            
            userData = await response.json();
            renderProfile(userData);
            
            // Solo añadimos los listeners para el modal SI estamos viendo nuestro propio perfil
            if (currentUser.id == targetUserId) {
                addEventListenersForModal();
            }
        } catch (error) {
            profilePageContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }


    function renderProfile(user) {
        profilePageContainer.innerHTML = '';


        const profileCard = document.createElement('div');
        profileCard.className = 'profile-card';


        const editButtonHTML = currentUser.id == user.id 
            ? `<button id="edit-profile-btn" class="btn-edit-profile">
                   <i class="fa-solid fa-pencil"></i> Editar Perfil
               </button>`
            : ''; 

        const serverUrl = 'http://localhost:3000';
        const avatarUrl = user.foto_perfil_url ? `${serverUrl}${user.foto_perfil_url}` : 'https://i.pravatar.cc/150';
        const coverImageUrl = user.foto_portada_url ? `url(${serverUrl}${user.foto_portada_url})` : '';

        profileCard.innerHTML = `
            <div id="profile-banner" class="profile-banner" style="background-image: ${coverImageUrl}"></div>
            <img src="${avatarUrl}" alt="Avatar" class="profile-avatar">
            <div class="profile-content">
                <h1 class="profile-name">${user.username}</h1>
                ${editButtonHTML} 
                <div class="profile-stats">
                    <div class="stat-item">
                        <i class="fa-solid fa-chart-simple"></i>
                        <div class="stat-value">${user.Publicacions.length}</div>
                        <div class="stat-label">Polls Created</div>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-circle-check"></i>
                        <div class="stat-value">171</div>
                        <div class="stat-label">Correct Answers</div>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-coins"></i>
                        <div class="stat-value">${user.fan_coins}</div>
                        <div class="stat-label">FanCoins</div>
                    </div>
                </div>
                <div class="achievements">
                    <!-- ... (código de achievements sin cambios) ... -->
                </div>
            </div>
        `;
        profilePageContainer.appendChild(profileCard);

        const postsSection = document.createElement('div');
        
        let postsHTML = `<h2 class="user-posts-title">Mis Publicaciones</h2>`;
        
        if (user.Publicacions && user.Publicacions.length > 0) {
            user.Publicacions.forEach(pub => {
                const optionsHTML = pub.Opcions.map(op => `<button class="option-btn" disabled>${op.texto_opcion}</button>`).join('');
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

                const profileBanner = document.getElementById('profile-banner');
        if (profileBanner) {
            const serverUrl = 'http://localhost:3000';
            if (user.foto_portada_url) {
                profileBanner.style.backgroundImage = `url(${serverUrl}${user.foto_portada_url})`;
            } else {
                profileBanner.style.backgroundImage = ''; 
            }
        }
    }

    function addEventListenersForModal() {
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', openEditModal);
        }

        closeModalBtn.addEventListener('click', () => editProfileModal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target === editProfileModal) {
                editProfileModal.style.display = 'none';
            }
        });

        avatarFileInput.addEventListener('change', () => {
            const file = avatarFileInput.files[0];
            if (file) {
                // Usamos FileReader para mostrar la imagen localmente antes de subirla
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }

    function openEditModal() {
        usernameInput.value = userData.username;
        const serverUrl = 'http://localhost:3000';
        avatarPreview.src = userData.foto_perfil_url ? `${serverUrl}${userData.foto_perfil_url}` : 'https://i.pravatar.cc/150';
        avatarFileInput.value = ''; 
        modalMessage.textContent = '';
        editProfileModal.style.display = 'flex';
    }

    async function handleProfileUpdate(event) {
        event.preventDefault();
        modalMessage.textContent = '';

        const formData = new FormData();
        formData.append('username', usernameInput.value);

        if (avatarFileInput.files[0]) {
            formData.append('avatar', avatarFileInput.files[0]);
        }

        try {
            const response = await fetch(`http://localhost:3000/api/users/${currentUser.id}`, {
                method: 'PUT',
                body: formData 
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            editProfileModal.style.display = 'none';
            const serverUrl = 'http://localhost:3000';
            const newAvatarUrl = result.user.foto_perfil_url ? `${serverUrl}${result.user.foto_perfil_url}` : 'https://i.pravatar.cc/150';
            
            document.querySelector('.profile-avatar').src = newAvatarUrl;
            document.getElementById('user-avatar-top').src = newAvatarUrl;
            document.querySelector('.profile-name').textContent = result.user.username;

            userData.username = result.user.username;
            userData.foto_perfil_url = result.user.foto_perfil_url;

        } catch (error) {
            modalMessage.style.color = 'red';
            modalMessage.textContent = `Error: ${error.message}`;
        }
    }

    loadProfileData();
});