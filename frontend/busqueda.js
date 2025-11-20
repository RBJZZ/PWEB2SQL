document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    
    const queryDisplay = document.getElementById('query-display');
    const resultsFeed = document.getElementById('search-results-feed');
    const serverUrl = ''; 

    if (!query) {
        queryDisplay.textContent = "-";
        resultsFeed.innerHTML = '<p style="text-align: center;">Ingresa un término para buscar.</p>';
        return;
    }

    queryDisplay.textContent = `"${query}"`;

    const userAvatarTop = document.getElementById('user-avatar-top');
    if(userAvatarTop) {
        userAvatarTop.src = currentUser.foto_perfil_url 
            ? `${serverUrl}${currentUser.foto_perfil_url}` 
            : 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg';
    }

    try {
        const response = await fetch(`/api/publicaciones/buscar?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Error en la búsqueda');
        
        const resultados = await response.json();

        if (resultados.length === 0) {
            resultsFeed.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fa-solid fa-ghost" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                    <p style="color: #666;">No encontramos nada con "${query}".</p>
                </div>`;
            return;
        }

        resultsFeed.innerHTML = resultados.map(pub => {
            const authorUsername = pub.User ? pub.User.username : 'Anónimo';
            const authorId = pub.User ? pub.User.id : '#';
            
            const avatarUrl = pub.User && pub.User.foto_perfil_url
                ? `${serverUrl}${pub.User.foto_perfil_url}`
                : `https://i.pravatar.cc/40?u=${authorUsername}`;

            let optionsHTML = '';
            if (pub.Opcions && pub.Opcions.length > 0) {
                optionsHTML = `<div class="post-options-grid">` + pub.Opcions.map(op => 
                    `<button class="option-btn" style="cursor:default;">${op.texto_opcion}</button>`
                ).join('') + `</div>`;
            }

            return `
                <div class="post">
                    <a href="perfil.html?id=${authorId}" class="post-link-header">
                        <div class="post-header">
                            <img src="${avatarUrl}" alt="avatar" class="post-avatar">
                            <span class="post-author">@${authorUsername}</span>
                        </div>
                    </a>
                    <a href="publicacion.html?id=${pub.id}" class="post-link-body">
                        <p class="post-question">${pub.texto_pregunta}</p>
                        ${optionsHTML}
                    </a>
                    <div class="post-actions">
                        <a href="publicacion.html?id=${pub.id}" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 5px;">
                            <i class="fa-solid fa-eye"></i>
                            <span>Ver encuesta completa</span>
                        </a>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        resultsFeed.innerHTML = '<p style="color: red; text-align: center;">Ocurrió un error al buscar.</p>';
    }
});