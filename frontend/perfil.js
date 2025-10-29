document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const profilePageContainer = document.getElementById('profile-page-container');

    async function loadProfileData() {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${currentUser.id}`);
            if (!response.ok) {
                throw new Error('No se pudo cargar el perfil.');
            }
            const userData = await response.json();
            renderProfile(userData);
        } catch (error) {
            profilePageContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    function renderProfile(user) {
        // Limpiamos el contenedor
        profilePageContainer.innerHTML = '';

        // --- 1. Construir la Tarjeta de Perfil ---
        const profileCard = document.createElement('div');
        profileCard.className = 'profile-card';

        // --- DATOS DE EJEMPLO (reemplazar cuando el API los envíe) ---
        const correctAnswers = 171; // Placeholder
        
        profileCard.innerHTML = `
            <div class="profile-banner"></div>
            <img src="${user.foto_perfil_url || 'https://i.pravatar.cc/150'}" alt="Avatar" class="profile-avatar">
            <div class="profile-content">
                <h1 class="profile-name">${user.username}</h1>
                <div class="profile-stats">
                    <div class="stat-item">
                        <i class="fa-solid fa-chart-simple"></i>
                        <div class="stat-value">${user.Publicacions.length}</div>
                        <div class="stat-label">Polls Created</div>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-circle-check"></i>
                        <div class="stat-value">${correctAnswers}</div>
                        <div class="stat-label">Correct Answers</div>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-coins"></i>
                        <div class="stat-value">${user.fan_coins}</div>
                        <div class="stat-label">FanCoins</div>
                    </div>
                </div>
                <div class="achievements">
                    <h4>Achievements</h4>
                    <div class="achievements-icons">
                        <!-- Iconos de ejemplo para los logros -->
                        <div class="achievement-icon"><i class="fa-solid fa-trophy"></i></div>
                        <div class="achievement-icon"><i class="fa-solid fa-star"></i></div>
                        <div class="achievement-icon"><i class="fa-solid fa-fire"></i></div>
                        <div class="achievement-icon"><i class="fa-solid fa-shield-halved"></i></div>
                    </div>
                </div>
            </div>
        `;
        profilePageContainer.appendChild(profileCard);

        // --- 2. Construir la sección de "Mis Publicaciones" ---
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
    }

    loadProfileData();
});