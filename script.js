/**
 * ============================
 * CONFIGURACIÓN INICIAL
 * ============================
 */

// Constantes para almacenamiento local (adaptadas a equipos)
const SELECTED_EQUIPOS_KEY = 'selectedEquipos';
const FAVORITE_EQUIPOS_KEY = 'favoriteEquipos';

// Variables globales para equipos
let equiposData = [];
let equiposPerPage = 3;
let currentPage = 1;
let currentFilteredEquipos = [];
let renderTimeoutId = null;

// Conjuntos para almacenar IDs seleccionados y favoritos
const selectedEquipoIds = new Set(JSON.parse(localStorage.getItem(SELECTED_EQUIPOS_KEY)) || []);
const favoriteEquipoIds = new Set(JSON.parse(localStorage.getItem(FAVORITE_EQUIPOS_KEY)) || []);

/**
 * ============================
 * INICIALIZACIÓN DE DATOS
 * ============================
 */

// Cargar equipos desde localStorage o usar datos por defecto
const storedEquipos = localStorage.getItem('equiposData');
console.log('Equipos almacenados:', storedEquipos);

if (storedEquipos) {
    equiposData = JSON.parse(storedEquipos);
    console.log('Equipos cargados:', equiposData);
} else {
    console.log('No hay equipos almacenados');
    // Equipo de ejemplo por defecto
    equiposData = [
        {
            nombre: "Bomba de Infusión",
            marca: "Medtronic",
            modelo: "InfuStar 3000",
            numserie: "SN123456",
            foto: "https://via.placeholder.com/150",
            descripcion: "Equipo de infusión volumétrica para uso hospitalario."
        }
    ];
    // Guardar el equipo de ejemplo en localStorage
    localStorage.setItem('equiposData', JSON.stringify(equiposData));
}

/**
 * ============================
 * ELEMENTOS DEL DOM
 * ============================
 */

// Selección de elementos del DOM adaptados a equipos
const equiposContainer = document.getElementById('equipos-container');
const searchInput = document.getElementById('search-input');
const noResultsMessage = document.getElementById('no-results-message');
const selectedEquiposCountDisplay = document.getElementById('selected-equipos-count');
const loadingMessage = document.getElementById('loading-message');
const equiposPerPageSelect = document.getElementById('equipos-per-page');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageNumbersContainer = document.getElementById('page-numbers');
const addEquipoForm = document.getElementById('add-equipo-form');
const clearSearchBtn = document.getElementById('clear-search');
const exportCsvBtn = document.getElementById('export-csv-btn');
const searchIcon = document.querySelector('.search-icon');
const showFavoritesOnlyCheckbox = document.getElementById('show-favorites-only');

// Elementos del formulario
const toggleFormBtn = document.getElementById('toggle-add-form');
const closeFormBtn = document.getElementById('close-add-form');
const addEquipoContainer = document.querySelector('.add-equipo-container');

/**
 * ============================
 * FUNCIONES DE PAGINACIÓN
 * ============================
 */

// Calcula el número total de páginas según la cantidad de equipos y equipos por página
function getTotalPages(equipos = equiposData) {
    return Math.ceil(equipos.length / equiposPerPage);
}

// Crea un botón para cada número de página
function createPageNumberButton(pageNumber) {
    const button = document.createElement('button');
    button.textContent = pageNumber;
    button.classList.add('page-number-button');
    if (pageNumber === currentPage) {
        button.classList.add('active');
    }
    button.addEventListener('click', () => {
        currentPage = pageNumber;
        displayEquipos();
    });
    return button;
}

// Renderiza los botones de paginación
function renderPageNumberButtons(equipos = equiposData) {
    pageNumbersContainer.innerHTML = '';
    const totalPages = getTotalPages(equipos);
    for (let i = 1; i <= totalPages; i++) {
        const button = createPageNumberButton(i);
        pageNumbersContainer.appendChild(button);
    }
}

// Actualiza el estado de los botones de paginación
function updatePaginationUI(equipos = equiposData) {
    const totalPages = getTotalPages(equipos);
    const pageNumberButtons = document.querySelectorAll('.page-number-button');
    pageNumberButtons.forEach(button => {
        button.classList.remove('active');
        if (parseInt(button.textContent) === currentPage) {
            button.classList.add('active');
        }
    });
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
}

/**
 * ============================
 * FUNCIONES DE RENDERIZADO
 * ============================
 */

// Renderiza las tarjetas de equipos en la página actual
function renderEquipoCards(equiposToRender) {
    if (renderTimeoutId) clearTimeout(renderTimeoutId);
    equiposContainer.innerHTML = '';
    loadingMessage.classList.remove('hidden');

    renderTimeoutId = setTimeout(() => {
        if (equiposToRender.length === 0) {
            noResultsMessage.classList.remove('hidden');
        } else {
            noResultsMessage.classList.add('hidden');
            equiposToRender.forEach(equipo => {
                const newCard = createEquipoCard(equipo);
                newCard.classList.add('equipo-card--enter');
                equiposContainer.appendChild(newCard);
                setTimeout(() => {
                    newCard.classList.remove('equipo-card--enter');
                }, 10);
            });
        }
        updateSelectedCount();
        loadingMessage.classList.add('hidden');
        renderTimeoutId = null;
    }, 100);
}

// Resalta el texto buscado en los campos de la tarjeta
function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="highlight">$1</mark>');
}

// Crea la estructura HTML de una tarjeta de equipo biomédico
function createEquipoCard(equipo) {
    const card = document.createElement('div');
    card.classList.add('equipo-card');
    card.dataset.equipoNombre = equipo.nombre;

    if (selectedEquipoIds.has(equipo.nombre)) {
        card.classList.add('selected');
    }

    const searchTerm = searchInput.value.trim().toLowerCase();

    // Estructura de la tarjeta: imagen, nombre, marca-modelo-numserie en una línea, descripción y botones
    card.innerHTML = `
        <button class="favorite-btn" title="Marcar como favorito">
            ${favoriteEquipoIds.has(equipo.nombre) ? '★' : '☆'}
        </button>
        <img class="equipo-image" src="${equipo.foto}" alt="Foto de equipo ${equipo.nombre}">
        <h2 class="equipo-nombre">${highlightText(equipo.nombre, searchTerm)}</h2>
        <div class="equipo-info-line">
            <span class="equipo-marca-modelo-numserie">
                ${highlightText(equipo.marca, searchTerm)} | 
                ${highlightText(equipo.modelo, searchTerm)} | 
                ${highlightText(equipo.numserie, searchTerm)}
            </span>
        </div>
        <p class="equipo-descripcion">${highlightText(equipo.descripcion, searchTerm)}</p>
        <div class="equipo-acciones">
            <button class="equipo-button">Contactar</button>
            <button class="detail-equipo-btn">Ver más</button>
            <div class="equipo-actions">
                <button class="edit-equipo-btn">Editar</button>
                <button class="delete-equipo-btn">Eliminar</button>
            </div>
        </div>
    `;

    // Asigna los eventos a la tarjeta y sus botones
    setupCardEventListeners(card, equipo);

    return card;
}

/**
 * ============================
 * FUNCIONES DE BÚSQUEDA Y FILTRADO
 * ============================
 */

function displayEquipos() {
    console.log('Ejecutando displayEquipos');
    console.log('Estado actual de equiposData:', equiposData);
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    let equiposToShow = [];

    // Filtrar favoritos si está activado
    let baseEquipos = equiposData;
    if (showFavoritesOnlyCheckbox && showFavoritesOnlyCheckbox.checked) {
        baseEquipos = equiposData.filter(e => favoriteEquipoIds.has(e.nombre));
    }

    // Si hay término de búsqueda, filtrar equipos
    if (searchTerm) {
        currentFilteredEquipos = baseEquipos.filter(equipo => {
            const nombreLower = equipo.nombre.toLowerCase();
            const marcaLower = equipo.marca.toLowerCase();
            const descripcionLower = equipo.descripcion.toLowerCase();
            return nombreLower.includes(searchTerm) || 
                   marcaLower.includes(searchTerm) || 
                   descripcionLower.includes(searchTerm);
        });
    } else {
        currentFilteredEquipos = baseEquipos;
    }

    // Aplicar paginación
    const startIndex = (currentPage - 1) * equiposPerPage;
    const endIndex = startIndex + equiposPerPage;
    equiposToShow = currentFilteredEquipos.slice(startIndex, endIndex);

    console.log('Equipos a mostrar:', equiposToShow);
    console.log('Página actual:', currentPage);
    console.log('Equipos por página:', equiposPerPage);
    
    renderEquipoCards(equiposToShow);
    updateEquiposCount();
    updatePaginationVisibility(true);
}

function updateEquiposCount() {
    const countDiv = document.getElementById('equipos-count');
    countDiv.textContent = `Total de equipos: ${equiposData.length}`;
}

function handleSearch() {
    currentPage = 1;
    displayEquipos();
}

function updatePaginationVisibility(paginated) {
    const paginationContainer = document.querySelector('.pagination-container');
    const pageNumbers = document.getElementById('page-numbers');
    const searchTerm = searchInput.value.trim();

    if (paginationContainer) {
        paginationContainer.style.display = '';
        
        // Mostrar/ocultar números de página según si hay búsqueda
        if (pageNumbers) {
            pageNumbers.style.display = searchTerm ? '' : 'none';
        }

        // Actualizar botones según si hay búsqueda o no
        if (searchTerm) {
            renderPageNumberButtons(currentFilteredEquipos);
            updatePaginationUI(currentFilteredEquipos);
        } else {
            // Solo actualizar estado de botones anterior/siguiente
            const totalPages = getTotalPages(equiposData);
            prevPageButton.disabled = currentPage === 1;
            nextPageButton.disabled = currentPage === totalPages;
        }
    }
}

function updateGlobalActionsVisibility() {
    const globalActionsContainer = document.getElementById('global-equipo-actions');
    if (globalActionsContainer) {
        if (selectedEquipoIds.size > 0) {
            globalActionsContainer.classList.remove('hidden');
        } else {
            globalActionsContainer.classList.add('hidden');
        }
    }
}

/**
 * ============================
 * FUNCIONES DE UTILIDAD Y LOCALSTORAGE
 * ============================
 */

function saveSelectedEquipos() {
    localStorage.setItem(SELECTED_EQUIPOS_KEY, JSON.stringify(Array.from(selectedEquipoIds)));
}

function saveEquiposToLocalStorage() {
    localStorage.setItem('equiposData', JSON.stringify(equiposData));
}

function updateSelectedCount() {
    selectedEquiposCountDisplay.classList.add('pulsing');
    selectedEquiposCountDisplay.textContent = `Equipos seleccionados: ${selectedEquipoIds.size}`;
    setTimeout(() => {
        selectedEquiposCountDisplay.classList.remove('pulsing');
    }, 300);
    updateGlobalActionsVisibility();
}

function cleanSelectedEquipos() {
    const validNames = new Set(equiposData.map(e => e.nombre));
    for (const name of selectedEquipoIds) {
        if (!validNames.has(name)) {
            selectedEquipoIds.delete(name);
        }
    }
    saveSelectedEquipos();
}

function saveFavoriteEquipos() {
    localStorage.setItem(FAVORITE_EQUIPOS_KEY, JSON.stringify(Array.from(favoriteEquipoIds)));
}

function exportSelectedEquiposToCSV() {
    const selectedEquipos = equiposData.filter(equipo => selectedEquipoIds.has(equipo.nombre));
    if (!selectedEquipos.length) {
        showToast("No hay equipos seleccionados para exportar.", "error");
        return;
    }

    const headers = ["nombre", "marca", "modelo", "numserie", "foto", "descripcion"];
    const csvRows = [headers.join(",")];

    selectedEquipos.forEach(equipo => {
        const row = headers.map(key => {
            let value = equipo[key] || "";
            value = String(value).replace(/"/g, '""');
            if (value.includes(",") || value.includes('"') || value.includes('\n')) {
                value = `"${value}"`;
            }
            return value;
        });
        csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "equipos_seleccionados.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');

if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
        importFileInput.value = '';
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            let importedEquipos = [];
            try {
                if (file.name.endsWith('.json')) {
                    importedEquipos = JSON.parse(event.target.result);
                } else if (file.name.endsWith('.csv')) {
                    importedEquipos = parseCSVEquipos(event.target.result);
                } else {
                    showToast("Formato de archivo no soportado.", "error");
                    return;
                }
            } catch (err) {
                showToast("Error al leer el archivo.", "error");
                return;
            }

            let addedCount = 0;
            importedEquipos.forEach(equipo => {
                if (
                    equipo.nombre &&
                    !equiposData.some(e => e.nombre === equipo.nombre)
                ) {
                    equiposData.unshift(equipo);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                saveEquiposToLocalStorage();
                displayEquipos();
                showToast(`Se importaron ${addedCount} equipos.`, "success");
            } else {
                showToast("No se importaron equipos nuevos.", "info");
            }
        };

        reader.readAsText(file);
    });
}

function parseCSVEquipos(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const equipos = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        const equipo = {};
        headers.forEach((header, idx) => {
            equipo[header] = row[idx] ? row[idx].replace(/^"|"$/g, '').replace(/""/g, '"') : '';
        });
        equipos.push(equipo);
    }
    return equipos;
}

function showEquipoDetailModal(equipo) {
    const modal = document.getElementById('equipo-detail-modal');
    const content = document.getElementById('equipo-detail-content');
    
    content.innerHTML = `
        <div class="equipo-detail-modal-content">
            <img src="${equipo.foto}" alt="Foto de equipo ${equipo.nombre}" 
                 style="width:150px;height:150px;border-radius:50%;margin-bottom:20px;border:3px solid var(--color-primary);">
            <h2 style="font-size:24px;margin-bottom:10px;color:var(--color-text);">${equipo.nombre}</h2>
            <h3 style="font-size:18px;margin-bottom:15px;color:var(--color-profile-title);">${equipo.marca} ${equipo.modelo}</h3>
            <p style="margin:20px 0;line-height:1.6;color:var(--color-profile-bio);">${equipo.descripcion}</p>
            <div style="margin-top:20px;">
                ${equipo.twitter ? 
                    `<a href="${equipo.twitter}" target="_blank" rel="noopener noreferrer" 
                        style="margin:0 10px;color:var(--color-primary);text-decoration:none;">
                        <i class="fab fa-twitter"></i> Twitter
                    </a>` : ''}
                ${equipo.linkedin ? 
                    `<a href="${equipo.linkedin}" target="_blank" rel="noopener noreferrer" 
                        style="margin:0 10px;color:var(--color-primary);text-decoration:none;">
                        <i class="fab fa-linkedin"></i> LinkedIn
                    </a>` : ''}
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

document.getElementById('close-detail-modal').addEventListener('click', () => {
    document.getElementById('equipo-detail-modal').classList.add('hidden');
});

// --- MANEJO DEL FORMULARIO DE AGREGAR/EDITAR EQUIPO ---

if (addEquipoForm) {
    addEquipoForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Obtén los valores de los campos
        const nombre = document.getElementById('new-nombre').value.trim();
        const marca = document.getElementById('new-marca').value.trim();
        const modelo = document.getElementById('new-modelo').value.trim();
        const numserie = document.getElementById('new-numserie').value.trim();
        const foto = document.getElementById('new-foto').value.trim();
        const descripcion = document.getElementById('new-descripcion').value.trim();

        // Validación básica
        if (!nombre || !marca || !modelo || !numserie || !foto || !descripcion) {
            showToast("Por favor, completa todos los campos obligatorios.", "error");
            return;
        }

        const newEquipo = { nombre, marca, modelo, numserie, foto, descripcion };
        const editingIndex = addEquipoForm.dataset.editingIndex;

        if (editingIndex && editingIndex !== "-1") {
            // Validar duplicados excluyendo el equipo que se está editando
            const existe = equiposData.some((e, idx) =>
                idx != editingIndex &&
                e.nombre === nombre &&
                e.numserie === numserie
            );
            if (existe) {
                showToast("Ya existe un equipo con ese nombre y número de serie.", "error");
                return;
            }
            equiposData[editingIndex] = newEquipo;
            delete addEquipoForm.dataset.editingIndex;
            addEquipoForm.querySelector('button[type="submit"]').textContent = "Agregar equipo";
            showToast("Equipo editado correctamente.", "success");
        } else {
            // Validar duplicados normalmente
            const existe = equiposData.some(e => e.nombre === nombre && e.numserie === numserie);
            if (existe) {
                showToast("Ya existe un equipo con ese nombre y número de serie.", "error");
                return;
            }
            equiposData.unshift(newEquipo);
            showToast("Equipo agregado correctamente.", "success");
        }

        saveEquiposToLocalStorage();
        displayEquipos();
        addEquipoForm.reset();
        addEquipoContainer.classList.add('hidden');
    });
}

function showToast(message, type = "info") {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (type === "error") toast.style.background = "#d32f2f";
    if (type === "success") toast.style.background = "#388e3c";
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2500);
}

function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const msg = document.getElementById('confirm-modal-message');
    const yesBtn = document.getElementById('confirm-modal-yes');
    const noBtn = document.getElementById('confirm-modal-no');

    msg.textContent = message;
    modal.classList.remove('hidden');

    yesBtn.onclick = null;
    noBtn.onclick = null;

    yesBtn.onclick = () => {
        modal.classList.add('hidden');
        onConfirm(true);
    };
    noBtn.onclick = () => {
        modal.classList.add('hidden');
        onConfirm(false);
    };
}

searchIcon.addEventListener('click', () => {
    searchInput.classList.add('active');
    searchInput.focus();
    currentPage = 1;
    displayEquipos();
});

searchInput.addEventListener('input', () => {
    currentPage = 1;
    displayEquipos();
});

equiposPerPageSelect.addEventListener('change', () => {
    equiposPerPage = parseInt(equiposPerPageSelect.value);
    currentPage = 1;
    displayEquipos();
});

prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayEquipos();
    }
});

nextPageButton.addEventListener('click', () => {
    const totalPages = getTotalPages(currentFilteredEquipos);
    if (currentPage < totalPages) {
        currentPage++;
        displayEquipos();
    }
});

const themeToggleBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleBtn.textContent = '🌙';
    }
}

function getSavedTheme() {
    return localStorage.getItem('theme') || 'light';
}

applyTheme(getSavedTheme());

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
});

/**
 * ============================
 * INICIALIZACIÓN Y EVENTOS GLOBALES
 * ============================
 */

// Mostrar/ocultar el formulario al presionar "Agregar Equipo"
if (toggleFormBtn) {
    toggleFormBtn.addEventListener('click', toggleAddEquipoForm);
}

// Cerrar el formulario y limpiar campos al presionar la X
if (closeFormBtn) {
    closeFormBtn.addEventListener('click', () => {
        addEquipoContainer.classList.add('hidden');
        addEquipoForm.reset();
        // Resetear el formulario al modo "agregar"
        if (addEquipoForm.dataset.editingIndex) {
            delete addEquipoForm.dataset.editingIndex;
            addEquipoForm.querySelector('button[type="submit"]').textContent = "Agregar equipo";
        }
    });
}

// Filtro de favoritos: mostrar solo favoritos si está activado
if (showFavoritesOnlyCheckbox) {
    showFavoritesOnlyCheckbox.addEventListener('change', () => {
        currentPage = 1;
        displayEquipos();
    });
}

// Limpiar favoritos que ya no existen
function cleanFavoriteEquipos() {
    const validNames = new Set(equiposData.map(e => e.nombre));
    for (const name of favoriteEquipoIds) {
        if (!validNames.has(name)) {
            favoriteEquipoIds.delete(name);
        }
    }
    saveFavoriteEquipos();
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    equiposPerPage = parseInt(equiposPerPageSelect.value) || 3;
    displayEquipos();
    updateGlobalActionsVisibility();
});

// Permite cerrar el modal de detalles con la tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        const detailModal = document.getElementById('equipo-detail-modal');
        if (detailModal && !detailModal.classList.contains('hidden')) {
            detailModal.classList.add('hidden');
        }
        const confirmModal = document.getElementById('confirm-modal');
        if (confirmModal && !confirmModal.classList.contains('hidden')) {
            confirmModal.classList.add('hidden');
        }
    }
});

// Limpiar selección de equipos si se eliminan
function cleanSelectedEquipos() {
    const validNames = new Set(equiposData.map(e => e.nombre));
    for (const name of selectedEquipoIds) {
        if (!validNames.has(name)) {
            selectedEquipoIds.delete(name);
        }
    }
    saveSelectedEquipos();
}

// Inicializar el botón de limpiar búsqueda
if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentPage = 1;
        displayEquipos();
        clearSearchBtn.style.display = 'none';
    });
}

// Mostrar botón de limpiar búsqueda solo si hay texto
if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearSearchBtn.style.display = searchInput.value ? '' : 'none';
    });
}

/**
 * ============================
 * FIN DEL SCRIPT
 * ============================
 */

/**
 * ============================
 * FUNCIONES DE MANEJO DE TARJETAS
 * ============================
 */

function setupCardEventListeners(card, equipo) {
    // Evento de selección de tarjeta
    card.addEventListener('click', (event) => {
        const clickedElement = event.target;
        // Evita seleccionar si se hace clic en un botón o enlace
        if (clickedElement.classList.contains('equipo-button') || 
            clickedElement.closest('a') ||
            clickedElement.classList.contains('edit-equipo-btn') ||
            clickedElement.classList.contains('delete-equipo-btn') ||
            clickedElement.classList.contains('favorite-btn') ||
            clickedElement.classList.contains('detail-equipo-btn')) {
            return;
        }
        const equipoNombre = card.dataset.equipoNombre;
        if (selectedEquipoIds.has(equipoNombre)) {
            selectedEquipoIds.delete(equipoNombre);
            card.classList.remove('selected');
        } else {
            selectedEquipoIds.add(equipoNombre);
            card.classList.add('selected');
        }
        updateSelectedCount();
        saveSelectedEquipos();
    });

    // Botón de contactar
    const contactBtn = card.querySelector('.equipo-button');
    if (contactBtn) {
        let contactSent = false;
        contactBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            contactSent = !contactSent;
            if (contactSent) {
                contactBtn.textContent = "Contacto Enviado ✅";
                contactBtn.classList.add('sent');
            } else {
                contactBtn.textContent = "Contactar";
                contactBtn.classList.remove('sent');
            }
        });
    }

    // Botón Ver más
    const detailBtn = card.querySelector('.detail-equipo-btn');
    if (detailBtn) {
        detailBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showEquipoDetailModal(equipo);
        });
    }

    // Botón de favorito
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (favoriteEquipoIds.has(equipo.nombre)) {
                favoriteEquipoIds.delete(equipo.nombre);
                favoriteBtn.innerHTML = '☆';
                showToast(`${equipo.nombre} eliminado de favoritos`, "info");
            } else {
                favoriteEquipoIds.add(equipo.nombre);
                favoriteBtn.innerHTML = '★';
                showToast(`${equipo.nombre} agregado a favoritos`, "success");
            }
            saveFavoriteEquipos();
            if (showFavoritesOnlyCheckbox && showFavoritesOnlyCheckbox.checked) {
                currentPage = 1; // Resetear a la primera página
                displayEquipos();
            }
        });
    }

    // Botón de editar
    const editBtn = card.querySelector('.edit-equipo-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            addEquipoContainer.classList.remove('hidden');
            document.getElementById('new-nombre').value = equipo.nombre;
            document.getElementById('new-marca').value = equipo.marca;
            document.getElementById('new-modelo').value = equipo.modelo;
            document.getElementById('new-numserie').value = equipo.numserie;
            document.getElementById('new-foto').value = equipo.foto;
            document.getElementById('new-descripcion').value = equipo.descripcion;

            // Encuentra el índice del equipo a editar
            const editingIndex = equiposData.findIndex(e =>
                e.nombre === equipo.nombre &&
                e.marca === equipo.marca &&
                e.modelo === equipo.modelo &&
                e.numserie === equipo.numserie
            );

            addEquipoForm.dataset.editingIndex = editingIndex;
            addEquipoForm.querySelector('button[type="submit"]').textContent = "Guardar cambios";

            // Scroll hacia el formulario
            addEquipoContainer.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Botón de eliminar
    const deleteBtn = card.querySelector('.delete-equipo-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showConfirmModal(`¿Seguro que deseas eliminar el equipo ${equipo.nombre}?`, (confirmed) => {
                if (confirmed) {
                    const idx = equiposData.findIndex(e => 
                        e.nombre === equipo.nombre && 
                        e.marca === equipo.marca && 
                        e.modelo === equipo.modelo
                    );
                    if (idx !== -1) {
                        selectedEquipoIds.delete(equipo.nombre);
                        favoriteEquipoIds.delete(equipo.nombre);
                        card.classList.add('equipo-card--exit');
                        setTimeout(() => {
                            equiposData.splice(idx, 1);
                            saveEquiposToLocalStorage();
                            saveFavoriteEquipos();
                            showToast(`Equipo ${equipo.nombre} eliminado correctamente.`, "success");
                            currentPage = 1;
                            displayEquipos();
                            cleanSelectedEquipos();
                            cleanFavoriteEquipos();
                            updateSelectedCount();
                        }, 300);
                    }
                }
            });
        });
    }
}

// Función para mostrar/ocultar el formulario
function toggleAddEquipoForm() {
    addEquipoContainer.classList.toggle('hidden');
    if (!addEquipoContainer.classList.contains('hidden')) {
        document.getElementById('new-nombre').focus();
    }
}

