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
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const createPostForm = document.getElementById('createPostForm');
    const modalMessage = document.getElementById('modal-message');
    const optionsContainer = document.getElementById('options-container');
    const addOptionBtn = document.getElementById('add-option-btn');
    const pollTypeSelect = document.getElementById('poll-type');

    // --- Functions ---
    async function fetchPublicaciones() {
        try {
            const response = await fetch('http://localhost:3000/api/publicaciones');
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
                
                const optionsHTML = Array.isArray(pub.Opcions) 
                    ? pub.Opcions.map(op => `<button class="option-btn" disabled>${op.texto_opcion}</button>`).join('') 
                    : '';
                
                const authorUsername = pub.User ? pub.User.username : 'Anónimo';
                
                // Se envuelve el contenido del post en una etiqueta <a>
                postElement.innerHTML = `
                    <a href="publicacion.html?id=${pub.id}" class="post-link">
                        <div class="post-header">
                            <img src="https://i.pravatar.cc/40?u=${authorUsername}" alt="avatar" class="post-avatar">
                            <span class="post-author">@${authorUsername}</span>
                        </div>
                        <p class="post-question">${pub.texto_pregunta}</p>
                        <div class="post-options-grid">${optionsHTML}</div>
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

    function createOptionInput(optionNumber, isQuiz) {
        const div = document.createElement('div');
        div.className = 'modal-option-group';
        
        let quizInputHTML = isQuiz ? `<input type="radio" name="correct_answer" value="${optionNumber-1}" class="correct-answer-radio" title="Marcar como correcta">` : '';

        div.innerHTML = `
            ${quizInputHTML}
            <input type="text" class="option-input" placeholder="Opción ${optionNumber}" required>
        `;
        return div;
    }

    function renderOptionInputs() {
        const isQuiz = pollTypeSelect.value === 'quiz';
        optionsContainer.innerHTML = '';
        optionsContainer.appendChild(createOptionInput(1, isQuiz));
        optionsContainer.appendChild(createOptionInput(2, isQuiz));
    }

    // --- Event Listeners ---
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
            optionsContainer.appendChild(createOptionInput(count + 1, pollTypeSelect.value === 'quiz'));
        }
    });

    createPostForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        modalMessage.textContent = '';
        
        const texto_pregunta = document.getElementById('post-question').value;
        const optionInputs = document.querySelectorAll('.option-input');
        const correctAnswerRadio = document.querySelector('input[name="correct_answer"]:checked');
        const correctIndex = correctAnswerRadio ? parseInt(correctAnswerRadio.value) : -1;

        const opciones = Array.from(optionInputs).map((input, index) => ({
            texto: input.value,
            es_correcta: index === correctIndex
        }));

        if (opciones.some(op => !op.texto.trim()) || opciones.length < 2) {
            modalMessage.textContent = 'Debes rellenar al menos 2 opciones.';
            return;
        }
        if (pollTypeSelect.value === 'quiz' && correctIndex === -1) {
            modalMessage.textContent = 'En un Quiz, debes seleccionar una respuesta correcta.';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/publicaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: currentUser.id, texto_pregunta, opciones })
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

    // --- Initial Load ---
    fetchPublicaciones();
});