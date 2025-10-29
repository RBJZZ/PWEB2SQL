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
        
        const divider = dropdownMenu.querySelector('.dropdown-divider');
        if (divider) {
            dropdownMenu.insertBefore(adminLink, divider);
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