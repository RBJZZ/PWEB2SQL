document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) window.location.href = 'index.html';

    // Elementos de la Preview
    const pBanner = document.getElementById('preview-banner');
    const pAvatar = document.getElementById('preview-avatar');
    const pFrame = document.getElementById('preview-frame');
    const pName = document.getElementById('preview-username');
    const inventoryGrid = document.getElementById('inventory-grid');

    // Estado Temporal
    let currentEquipped = {
        frame: localStorage.getItem(`frame_${currentUser.id}`),
        theme: localStorage.getItem(`theme_class_${currentUser.id}`)
    };

    // --- NUEVO: Variable para recordar el filtro activo ---
    let activeFilter = 'all'; 

    // Mapas y Datos
    let allItems = [];
    const THEME_MAP = {
        'Efecto Neón': 'effect-neon',
        'Lluvia Dorada': 'effect-gold',
        'Modo Cyberpunk': 'effect-glitch'
    };

    // 1. Cargar Datos
    try {
        // Ruta relativa corregida
        const response = await fetch(`/api/users/${currentUser.id}`);
        const user = await response.json();
        
        const serverUrl = '';
        pAvatar.src = user.foto_perfil_url ? `${serverUrl}${user.foto_perfil_url}` : 'https://i.pravatar.cc/150';
        pName.textContent = user.username;
        
        const coverUrl = user.foto_portada_url ? `url(${serverUrl}${user.foto_portada_url})` : '';
        pBanner.style.backgroundImage = coverUrl;

        allItems = user.Premios || [];
        
        // Render inicial
        renderGrid(allItems);
        updatePreview();

    } catch (e) {
        console.error(e);
    }

    // 2. Lógica de Filtros (MEJORADA)
    window.filterItems = (type) => {
        // Actualizar variable de estado
        activeFilter = type;

        // Actualizar visualmente los botones (Tabs)
        // Nota: Usamos event.target si existe, o buscamos el botón manualmente si no
        if (event && event.target) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
        }

        // Filtrar datos
        if (type === 'all') {
            renderGrid(allItems);
        } else {
            renderGrid(allItems.filter(i => i.tipo_premio === type));
        }
    };

    // 3. Renderizar Grid (CON PREVIEWS REALES)
    function renderGrid(items) {
        if (items.length === 0) {
            inventoryGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No tienes ítems de este tipo.</p>';
            return;
        }

        // Botón Reset
        let html = `
            <div class="selectable-item" onclick="selectItem(null, 'RESET')">
                <div style="height:60px; display:flex; align-items:center; justify-content:center; font-size:2rem;">🚫</div>
                <div class="item-name">Nada</div>
            </div>
        `;

        // Items Reales
        html += items.map(item => {
            // Verificar si está seleccionado actualmente
            const isSelected = (item.tipo_premio === 'BORDE_PERFIL' && currentEquipped.frame === item.imagen_preview_url) ||
                               (item.tipo_premio === 'TEMA_PERFIL' && currentEquipped.theme === THEME_MAP[item.nombre_premio]);
            
            // --- LÓGICA DE PREVISUALIZACIÓN (IGUAL A LA TIENDA) ---
            let previewHTML = '';
            
            if (item.tipo_premio === 'TEMA_PERFIL') {
                const cssClass = THEME_MAP[item.nombre_premio] || '';
                // Usamos la clase .inventory-preview-box que definimos antes
                previewHTML = `<div class="inventory-preview-box ${cssClass}" style="width:60px; height:60px; margin:0 auto;"></div>`;
            } else {
                // Imagen normal para marcos e insignias
                previewHTML = `<img src="${item.imagen_preview_url}" alt="${item.nombre_premio}">`;
            }
            // ------------------------------------------------------

            return `
            <div class="selectable-item ${isSelected ? 'selected' : ''}" onclick="selectItem('${item.tipo_premio}', '${item.nombre_premio}', '${item.imagen_preview_url}')">
                ${previewHTML}
                <div class="item-name">${item.nombre_premio}</div>
            </div>
            `;
        }).join('');

        inventoryGrid.innerHTML = html;
    }

    // 4. Lógica de Selección (CON MEMORIA DE FILTRO)
    window.selectItem = (type, name, url) => {
        if (name === 'RESET') {
            // Si estamos en filtro de Marcos, solo reseteamos marco. Si es Efectos, solo efecto.
            if (activeFilter === 'BORDE_PERFIL') currentEquipped.frame = null;
            else if (activeFilter === 'TEMA_PERFIL') currentEquipped.theme = null;
            else { // Si está en 'Todo', reseteamos ambos por seguridad o definimos una lógica
                 // Por simplicidad en el reset general:
                 currentEquipped.frame = null;
                 currentEquipped.theme = null;
            }
        } else if (type === 'BORDE_PERFIL') {
            currentEquipped.frame = (currentEquipped.frame === url) ? null : url;
        } else if (type === 'TEMA_PERFIL') {
            const cssClass = THEME_MAP[name];
            currentEquipped.theme = (currentEquipped.theme === cssClass) ? null : cssClass;
        }
        
        updatePreview();
        
        // --- CORRECCIÓN: RE-RENDERIZAR USANDO EL FILTRO ACTUAL ---
        // En lugar de renderGrid(allItems), filtramos de nuevo
        if (activeFilter === 'all') {
            renderGrid(allItems);
        } else {
            renderGrid(allItems.filter(i => i.tipo_premio === activeFilter));
        }
        // ---------------------------------------------------------
    };

    function updatePreview() {
        // Actualizar Marco
        if (currentEquipped.frame) {
            pFrame.src = currentEquipped.frame;
            pFrame.style.display = 'block';
        } else {
            pFrame.style.display = 'none';
        }

        // Actualizar Efecto
        pBanner.className = 'profile-banner'; 
        if (currentEquipped.theme) {
            pBanner.classList.add(currentEquipped.theme);
        }
    }

    // 5. Guardar Cambios
    document.getElementById('btn-save-changes').addEventListener('click', () => {
        if (currentEquipped.frame) localStorage.setItem(`frame_${currentUser.id}`, currentEquipped.frame);
        else localStorage.removeItem(`frame_${currentUser.id}`);

        if (currentEquipped.theme) localStorage.setItem(`theme_class_${currentUser.id}`, currentEquipped.theme);
        else localStorage.removeItem(`theme_class_${currentUser.id}`);

        alert('¡Perfil actualizado!');
        window.location.href = 'perfil.html';
    });
});