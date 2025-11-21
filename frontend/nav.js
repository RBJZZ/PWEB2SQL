document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GESTIÓN DE USUARIO Y MENÚ DESPLEGABLE ---
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userAvatarIcon = document.getElementById('user-avatar-top');
    const dropdownMenu = document.getElementById('user-dropdown-menu');

    if (dropdownMenu && currentUser) {
        const divider = dropdownMenu.querySelector('.dropdown-divider');

        if (currentUser.rol === 'admin') {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.className = 'dropdown-item';
            adminLink.innerHTML = `<i class="fa-solid fa-user-shield"></i><span>Panel Admin</span>`;
            
            if (divider) dropdownMenu.insertBefore(adminLink, divider);
        }

        const leaderLink = document.createElement('a');
        leaderLink.href = 'reportes.html'; 
        leaderLink.className = 'dropdown-item';
        leaderLink.innerHTML = `<i class="fa-solid fa-trophy" style="color:gold;"></i><span>Leaderboard</span>`; 
        
        if (divider) dropdownMenu.insertBefore(leaderLink, divider);

        const tiendaLink = document.createElement('a');
        tiendaLink.href = 'tienda.html'; 
        tiendaLink.className = 'dropdown-item';
        tiendaLink.innerHTML = `<i class="fa-solid fa-store"></i><span>Tienda Virtual</span>`;
        
        if (divider) dropdownMenu.insertBefore(tiendaLink, divider);

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
    }

    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');

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
            if (searchResultsContainer && !searchInput.contains(e.target)) {
                searchResultsContainer.style.display = 'none';
            }
        });
    }

    startCountdown();
});

function startCountdown() {
    const countdownElement = document.getElementById('countdown-text');
    if (!countdownElement) return;

    const targetDate = new Date('June 11, 2026 00:00:00').getTime();

    function update() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Formateo con ceros a la izquierda
        const d = days; 
        const h = hours < 10 ? "0" + hours : hours;
        const m = minutes < 10 ? "0" + minutes : minutes;
        const s = seconds < 10 ? "0" + seconds : seconds;

        const text = `🏆 WORLD CUP 2026 IN: ${d}D ${h}H ${m}M ${s}S ⚽ PREPÁRATE PARA LA GLORIA 🏆`;

        const repeatedText = Array(15).fill(text).join(' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; '); 

        countdownElement.innerHTML = repeatedText;
    }

    setInterval(update, 1000);
    update(); 
}