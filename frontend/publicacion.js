document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const postContainer = document.getElementById('post-detail-container');
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        postContainer.innerHTML = '<p class="error-message">ID de publicación no encontrado.</p>';
        return;
    }

    async function fetchPost() {
        try {
            const response = await fetch(`/api/publicaciones/${postId}?userId=${currentUser.id}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo cargar la publicación');
            }
            const post = await response.json();
            renderPost(post);
        } catch (error) {
            postContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    function renderPost(pub) {
        const author = pub.User || { username: 'Anónimo', foto_perfil_url: null };
        const options = pub.Opcions || [];
        const comments = pub.Comentarios || [];
        const serverUrl = '';

        const authorAvatar = author.foto_perfil_url ? `${serverUrl}${author.foto_perfil_url}` : `https://i.pravatar.cc/40?u=${author.username}`;
        
        let optionsHTML = '';
        const hasImages = options.some(op => op.imagen_url);

        if (hasImages) {
            if (pub.currentUserHasVoted) {
                const totalVotes = options.reduce((sum, op) => sum + (parseInt(op.votosCount) || 0), 0);
                optionsHTML = `<div class="post-options-images results">` + options.map(op => {
                    const percentage = totalVotes > 0 ? ((op.votosCount / totalVotes) * 100).toFixed(1) : 0;
                    return `
                        <div class="image-option-card">
                            <div class="result-overlay" style="width: ${percentage}%;"></div>
                            <span class="result-percentage">${percentage}%</span>
                            <img src="${serverUrl}${op.imagen_url}" alt="${op.texto_opcion}">
                            <div class="option-text-overlay">${op.texto_opcion}</div>
                        </div>`;
                }).join('') + `</div>`;
            } else {
                optionsHTML = `<div class="post-options-images">` + options.map(op => `
                    <div class="image-option-card votable" data-option-id="${op.id}">
                        <img src="${serverUrl}${op.imagen_url}" alt="${op.texto_opcion}">
                        <div class="option-text-overlay">${op.texto_opcion}</div>
                    </div>
                `).join('') + `</div>`;
            }
        } else {
            if (pub.currentUserHasVoted) {
                const totalVotes = options.reduce((sum, op) => sum + (parseInt(op.votosCount) || 0), 0);
                optionsHTML = options.map(op => {
                    const percentage = totalVotes > 0 ? ((op.votosCount / totalVotes) * 100).toFixed(1) : 0;
                    return `
                    <div class="option-result-bar">
                        <div class="percentage-bar" style="width: ${percentage}%;"></div>
                        <span class="option-text">${op.texto_opcion}</span>
                        <span class="percentage-text">${percentage}%</span>
                    </div>`;
                }).join('');
            } else {
                optionsHTML = `<div class="post-options-grid">` + options.map(op => 
                    `<button class="option-btn" data-option-id="${op.id}">${op.texto_opcion}</button>`
                ).join('') + `</div>`;
            }
        }

        const commentsHTML = comments.map(com => {
            const commentAuthor = com.User || { username: 'Anónimo', foto_perfil_url: null };
            const commentAvatar = commentAuthor.foto_perfil_url ? `${serverUrl}${commentAuthor.foto_perfil_url}` : `https://i.pravatar.cc/32?u=${commentAuthor.username}`;
            return `
            <div class="comment">
                <img src="${commentAvatar}" alt="avatar" class="comment-avatar">
                <div class="comment-body">
                    <a href="perfil.html?id=${commentAuthor.id}" class="comment-author-link">@${commentAuthor.username}</a>
                    <p class="comment-text">${com.texto_comentario}</p>
                </div>
            </div>`;
        }).join('');

        const postHTML = `
            <div class="post">
                <div class="post-header">
                    <img src="${authorAvatar}" alt="avatar" class="post-avatar">
                    <a href="perfil.html?id=${author.id}" class="post-link-header"><span class="post-author">@${author.username}</span></a>
                </div>
                <p class="post-question">${pub.texto_pregunta}</p>
                <div id="options-container">${optionsHTML}</div>
            </div>
            <div class="comments-section">
                <h3>Comentarios</h3>
                <div id="comments-list">${commentsHTML}</div>
                <form id="comment-form" class="comment-form">
                    <input type="text" id="comment-input" class="comment-input" placeholder="Escribe un comentario..." required>
                    <button type="submit" class="btn-create-post" style="width: auto; padding: 10px 15px;">Enviar</button>
                </form>
            </div>`;
        postContainer.innerHTML = postHTML;
        addEventListeners();
    }
    
    function addEventListeners() {
        const commentForm = document.getElementById('comment-form');
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const commentInput = document.getElementById('comment-input');
            const texto_comentario = commentInput.value.trim();
            if (!texto_comentario) return;

            try {
                const response = await fetch('/api/comentarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        usuario_id: currentUser.id,
                        publicacion_id: postId,
                        texto_comentario
                    })
                });
                const newComment = await response.json(); 
                
                const commentAuthor = newComment.User || { username: 'Anónimo', foto_perfil_url: null };

                const commentsList = document.getElementById('comments-list');
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                
                const serverUrl = '';
                const newCommentAvatar = commentAuthor.foto_perfil_url 
                    ? `${serverUrl}${commentAuthor.foto_perfil_url}` 
                    : `https://i.pravatar.cc/32?u=${commentAuthor.username}`;

                commentElement.innerHTML = `
                    <img src="${newCommentAvatar}" alt="avatar" class="comment-avatar">
                    <div class="comment-body">
                        <a href="perfil.html?id=${commentAuthor.id}" class="comment-author-link">@${commentAuthor.username}</a>
                        <p class="comment-text">${newComment.texto_comentario}</p>
                    </div>`;
                commentsList.appendChild(commentElement);
                commentInput.value = '';
            } catch (error) {
                alert('Error al enviar el comentario.');
            }
        });
        
        const optionsContainer = document.getElementById('options-container');
        if (optionsContainer) {
            optionsContainer.addEventListener('click', async (e) => {
                const votableElement = e.target.closest('.votable, .option-btn');
                if (votableElement) {
                    const optionId = votableElement.dataset.optionId;
                    try {
                        await fetch('/api/votos', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ usuario_id: currentUser.id, opcion_id: optionId })
                        });
                        fetchPost();
                    } catch (error) {
                        alert('Error al votar.');
                    }
                }
            });
        }
    }
    fetchPost();
});