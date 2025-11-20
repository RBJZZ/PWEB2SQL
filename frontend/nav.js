document.addEventListener('DOMContentLoaded', () => {

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const userAvatarIcon = document.getElementById('user-avatar-top');
    const dropdownMenu = document.getElementById('user-dropdown-menu');

    if (!dropdownMenu) {
        return;
    }
    
    if (currentUser && currentUser.rol === 'admin') {
        const adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.className = 'dropdown-item';
        adminLink.innerHTML = `<i class="fa-solid fa-user-shield"></i><span>Panel Admin</span>`;
        
        const reportLink = document.createElement('a');
        reportLink.href = 'reportes.html';
        reportLink.className = 'dropdown-item';
        reportLink.innerHTML = `<i class="fa-solid fa-chart-line"></i><span>Reportes</span>`;

        const divider = dropdownMenu.querySelector('.dropdown-divider');
        if (divider) {
            dropdownMenu.insertBefore(adminLink, divider);
            dropdownMenu.insertBefore(reportLink, divider);
        }
    }

    if (currentUser) {
        const tiendaLink = document.createElement('a');
        tiendaLink.href = 'tienda.html'; 
        tiendaLink.className = 'dropdown-item';
        tiendaLink.innerHTML = `<i class="fa-solid fa-store"></i><span>Tienda Virtual</span>`;
        
        const divider = dropdownMenu.querySelector('.dropdown-divider');
        if (divider) {
            dropdownMenu.insertBefore(tiendaLink, divider);
        }
    }

    if (userAvatarIcon) {
        userAvatarIcon.addEventListener('click', (event) => {
            event.stopPropagation(); 
            dropdownMenu.classList.toggle('show');
        });
    }

    window.addEventListener('click', () => {
        if (dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    });

    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
});

const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                window.location.href = `busqueda.html?q=${encodeURIComponent(query)}`;
            }
        }
    });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target)) {
                searchResultsContainer.style.display = 'none';
            }
        });
    }

    async function performSearch(query) {
        try {
            const response = await fetch(`/api/publicaciones/buscar?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            renderSearchResults(results);
        } catch (error) {
            console.error('Error en la búsqueda:', error);
        }
    }

    function renderSearchResults(results) {
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `<div class="search-result-item">No se encontraron resultados.</div>`;
        } else {
            searchResultsContainer.innerHTML = results.map(post => `
                <a href="publicacion.html?id=${post.id}" class="search-result-item">
                    <div>${post.texto_pregunta}</div>
                    <div class="author">por @${post.User.username}</div>
                </a>
            `).join('');
        }
        searchResultsContainer.style.display = 'block';
    }