document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser || currentUser.rol !== 'admin') {
        alert('Acceso denegado.');
        window.location.href = 'home.html';
        return;
    }

    const container = document.getElementById('pending-posts-container');

    async function fetchPendingPosts() {
        try {
            const response = await fetch('/api/admin/publicaciones/pendientes');
            if (!response.ok) throw new Error('No se pudo cargar la lista de moderación.');
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) {
            container.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    function renderPosts(posts) {
        if (posts.length === 0) {
            container.innerHTML = '<h2>¡Excelente! No hay publicaciones pendientes de revisión.</h2>';
            return;
        }

        const serverUrl = '';

        container.innerHTML = posts.map(post => {
            let optionsHTML = '';
            const hasImages = post.Opcions && post.Opcions.some(op => op.imagen_url);

            if (hasImages) {
                optionsHTML = `<div class="post-options-images">` + post.Opcions.map(op => `
                    <div class="image-option-card">
                        <img src="${serverUrl}${op.imagen_url}" alt="${op.texto_opcion}">
                        <div class="option-text-overlay">${op.texto_opcion}</div>
                    </div>
                `).join('') + `</div>`;
            } else if (post.Opcions) {
                optionsHTML = `<div class="post-options-grid">` + post.Opcions.map(op => 
                    `<button class="option-btn" disabled>${op.texto_opcion}</button>`
                ).join('') + `</div>`;
            }

            return `
            <div class="post-review-card" id="post-card-${post.id}">
                <p><strong>Autor:</strong> @${post.User.username}</p>
                <p class="post-question">${post.texto_pregunta}</p>
                
                <!-- Aquí insertamos la vista previa de las opciones -->
                ${optionsHTML}

                <div class="review-actions">
                    <button class="btn-approve" data-id="${post.id}">Aprobar</button>
                    <button class="btn-reject" data-id="${post.id}">Rechazar</button>
                </div>
            </div>
            `;
        }).join('');
    }

    container.addEventListener('click', async (e) => {
        const postId = e.target.dataset.id;
        if (!postId) return;

        let nuevoEstado = '';
        if (e.target.classList.contains('btn-approve')) {
            nuevoEstado = 'aprobado';
        } else if (e.target.classList.contains('btn-reject')) {
            nuevoEstado = 'rechazado';
        } else {
            return;
        }

        try {
            const response = await fetch(`/api/admin/publicaciones/${postId}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevoEstado })
            });

            if (!response.ok) throw new Error('Falló la actualización del estado.');
            
            document.getElementById(`post-card-${postId}`).remove();

        } catch (error) {
            alert(error.message);
        }
    });

    fetchPendingPosts();
});