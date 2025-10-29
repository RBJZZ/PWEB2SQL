document.addEventListener('DOMContentLoaded', () => {
    const userAvatarIcon = document.getElementById('user-avatar-top');
    const dropdownMenu = document.getElementById('user-dropdown-menu');

    // Si no encontramos los elementos (por ejemplo, en la página de login), no hacemos nada.
    if (!userAvatarIcon || !dropdownMenu) {
        return;
    }

    // --- Lógica para mostrar/ocultar el menú ---
    userAvatarIcon.addEventListener('click', (event) => {
        // Evita que el click en el ícono cierre el menú inmediatamente (ver abajo)
        event.stopPropagation(); 
        dropdownMenu.classList.toggle('show');
    });

    // --- Lógica para cerrar el menú si se hace clic fuera de él ---
    window.addEventListener('click', () => {
        if (dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    });

    // --- Lógica para el botón de Cerrar Sesión ---
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // 1. Borramos los datos del usuario del almacenamiento local
            localStorage.removeItem('currentUser');
            
            // 2. Redirigimos al usuario a la página de inicio de sesión
            window.location.href = 'index.html';
        });
    }
});