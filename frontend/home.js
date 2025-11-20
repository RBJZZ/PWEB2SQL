document.addEventListener('DOMContentLoaded', () => {

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // --- DOM Elements ---
    const feedContainer = document.getElementById('feed-container');
    const createPostBtn = document.getElementById('create-post-btn');
    const modal = document.getElementById('create-post-modal');
    const closeModalBtn = modal.querySelector('.close-modal-btn');
    const createPostForm = document.getElementById('createPostForm');
    const modalMessage = document.getElementById('modal-message');
    const optionsContainer = document.getElementById('options-container');
    const addOptionBtn = document.getElementById('add-option-btn');
    const pollTypeSelect = document.getElementById('poll-type');
    const trendingContainer = document.getElementById('trending-polls-container');

    async function fetchPublicaciones() {
        try {
            const response = await fetch('/api/publicaciones');
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al cargar.');
            
            feedContainer.innerHTML = '';
            if (data.length === 0) {
                feedContainer.innerHTML = `<p class="empty-feed">Aún no hay publicaciones. ¡Sé el primero!</p>`;
                return;
            }
            data.forEach(pub => {
                const postElement = document.createElement('div');
                postElement.className = 'post';
                
                const authorUsername = pub.User ? pub.User.username : 'Anónimo';
                const authorId = pub.User ? pub.User.id : '#';
                const serverUrl = '';
                const avatarUrl = pub.User && pub.User.foto_perfil_url
                    ? `${serverUrl}${pub.User.foto_perfil_url}`
                    : `https://i.pravatar.cc/40?u=${authorUsername}`;

                let optionsHTML = '';
                const hasImages = pub.Opcions.some(op => op.imagen_url);
                const isMyPost = pub.User && pub.User.id === currentUser.id;
                
                const deleteButtonHTML = isMyPost 
                    ? `<button class="btn-delete-post" onclick="deletePost(event, ${pub.id})" style="background:none; border:none; color:#999; cursor:pointer; margin-left:auto;" title="Eliminar"><i class="fa-solid fa-trash"></i></button>` 
                    : '';

                if (hasImages) {
                    optionsHTML = `<div class="post-options-images">` + pub.Opcions.map(op => `
                        <div class="image-option-card">
                            <img src="${serverUrl}${op.imagen_url}" alt="${op.texto_opcion}">
                            <div class="option-text-overlay">${op.texto_opcion}</div>
                        </div>
                    `).join('') + `</div>`;
                } else {
                    optionsHTML = `<div class="post-options-grid">` + pub.Opcions.map(op => 
                        `<button class="option-btn" disabled>${op.texto_opcion}</button>`
                    ).join('') + `</div>`;
                }

                postElement.innerHTML = `
                    <div class="post-header">
                        <a href="perfil.html?id=${authorId}" class="post-link-header" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; flex-grow: 1;">
                            <img src="${avatarUrl}" alt="avatar" class="post-avatar">
                            <span class="post-author">@${authorUsername}</span>
                        </a>
                        ${deleteButtonHTML} 
                    </div>

                    <a href="publicacion.html?id=${pub.id}" class="post-link-body">
                        <p class="post-question">${pub.texto_pregunta}</p>
                        ${optionsHTML}
                    </a>
                    <div class="post-actions">
                        <i class="fa-regular fa-comment"></i>
                        <span>Ver detalles y comentar</span>
                    </div>
                `;
                feedContainer.appendChild(postElement);
            });
        } catch (error) {
            feedContainer.innerHTML = `<p class="error-message">Error al cargar el feed: ${error.message}</p>`;
        }
    }

    async function fetchTrendingPolls() {
        if (!trendingContainer) return;
        try {

            const response = await fetch('/api/publicaciones/trending');
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.statusText}`);
            }

            const posts = await response.json();
            renderTrendingPolls(posts);
        } catch (error) {
            console.error('Error al cargar tendencias:', error);
            trendingContainer.innerHTML = '<p style="font-size: 0.9rem; color: #606770;">No se pudieron cargar las tendencias.</p>';
        }
    }

    function renderTrendingPolls(posts) {
        if (!Array.isArray(posts) || posts.length === 0) {
            trendingContainer.innerHTML = '<p style="font-size: 0.9rem; color: #606770;">Aún no hay tendencias.</p>';
            return;
        }
        
        trendingContainer.innerHTML = posts.map(post => `
            <a href="publicacion.html?id=${post.id}" class="trending-item">
                ${post.texto_pregunta}
                <span class="trending-item-votes">${post.votesCount} votos</span>
            </a>
        `).join('');
    }
    
    function createOptionInput(optionNumber, pollType) {
        const div = document.createElement('div');

        const radioHTML = `
            <div class="radio-wrapper" title="Marcar como respuesta correcta">
                <input type="radio" name="correctOption" value="${optionNumber - 1}" ${optionNumber === 1 ? 'checked' : ''}>
            </div>
        `;

        if (pollType === 'image') {
            div.className = 'image-poll-card'; 
            div.innerHTML = `
                ${radioHTML}
                
                <div class="poll-image-preview-box">
                    <img class="option-image-preview" id="preview-${optionNumber}" src="" alt="">
                    <div class="placeholder-icon" id="placeholder-${optionNumber}">
                        <i class="fa-regular fa-image"></i>
                    </div>
                </div>

                <div class="poll-image-inputs">
                    <input type="text" class="modal-input" placeholder="Descripción Opción ${optionNumber}" required>
                    
                    <div class="file-upload-container">
                        <label for="file-input-${optionNumber}" class="btn-upload-small">
                            <i class="fa-solid fa-camera"></i> Subir Imagen
                        </label>
                        <input type="file" id="file-input-${optionNumber}" class="option-image-input" accept="image/*" data-preview-id="preview-${optionNumber}" data-placeholder-id="placeholder-${optionNumber}">
                    </div>
                </div>
            `;
        } else { 
            div.className = 'modal-option-group';
            div.innerHTML = `
                ${radioHTML}
                <input type="text" class="option-input" placeholder="Opción ${optionNumber}" required style="flex-grow:1;">
            `;
        }
        return div;
    }

    function renderOptionInputs() {
        const pollType = pollTypeSelect.value;
        optionsContainer.innerHTML = '';
        optionsContainer.appendChild(createOptionInput(1, pollType));
        optionsContainer.appendChild(createOptionInput(2, pollType));
    }
    
    optionsContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('option-image-input')) {
            const previewId = e.target.dataset.previewId;
            const placeholderId = e.target.dataset.placeholderId; // Nuevo ID
            
            const previewImg = document.getElementById(previewId);
            const placeholderDiv = document.getElementById(placeholderId);
            
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewImg.src = event.target.result;
                    previewImg.style.display = 'block'; 
                    if(placeholderDiv) placeholderDiv.style.display = 'none'; 
                    

                    const label = e.target.previousElementSibling;
                    if(label) { label.innerHTML = '<i class="fa-solid fa-check"></i> Lista'; label.style.borderColor = '#00b09b'; color = '#00b09b'; }
                }
                reader.readAsDataURL(file);
            }
        }
    });

    createPostBtn.addEventListener('click', () => {
        createPostForm.reset();
        modalMessage.textContent = '';
        renderOptionInputs();
        modal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => { if (event.target === modal) modal.style.display = 'none'; });
    pollTypeSelect.addEventListener('change', renderOptionInputs);

    addOptionBtn.addEventListener('click', () => {
        const count = optionsContainer.children.length;
        if (count < 4) {
            const pollType = pollTypeSelect.value;
            optionsContainer.appendChild(createOptionInput(count + 1, pollType));
        }
    });

    createPostForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        modalMessage.textContent = '';
        
        const formData = new FormData();
        formData.append('usuario_id', currentUser.id);
        formData.append('texto_pregunta', document.getElementById('post-question').value);

        const optionTextInputs = document.querySelectorAll('.option-input');
        const optionImageInputs = document.querySelectorAll('.option-image-input');


        const correctOptionInput = document.querySelector('input[name="correctOption"]:checked');
        const correctIndex = correctOptionInput ? parseInt(correctOptionInput.value) : -1;

        const opciones = Array.from(optionTextInputs).map((input, index) => ({ 
            texto: input.value, 
            es_correcta: index === correctIndex 
        }));

        if (opciones.some(op => !op.texto.trim()) || opciones.length < 2) {
            modalMessage.textContent = 'Debes rellenar el texto de al menos 2 opciones.';
            return;
        }

        if (pollTypeSelect.value === 'image') {
            const hasAtLeastTwoImages = Array.from(optionImageInputs).filter(input => input.files[0]).length >= 2;
            if (!hasAtLeastTwoImages) {
                modalMessage.textContent = 'Para una encuesta de imagen, debes seleccionar al menos 2 imágenes.';
                return;
            }
            optionImageInputs.forEach(input => {
                if (input.files[0]) {
                    formData.append('option_images', input.files[0]);
                }
            });
        }
        
        formData.append('opciones', JSON.stringify(opciones));

        try {
            const response = await fetch('/api/publicaciones', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            modal.style.display = 'none';
            createPostForm.reset();
            fetchPublicaciones();
        } catch (error) {
            modalMessage.textContent = `Error: ${error.message}`;
        }
    });

    fetchPublicaciones();
    fetchTrendingPolls();
});

window.deletePost = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();

    if(!confirm('¿Quieres eliminar esta publicación?')) return;
    
    try {
        const res = await fetch(`/api/publicaciones/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Publicación eliminada');
            location.reload(); 
        } else {
            alert('No se pudo eliminar');
        }
    } catch (e) {
        console.error(e);
    }
};