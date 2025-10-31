
/**
 * ============================
 * SELECTOR DE IMÁGENES
 * ============================
 */

let availableImages = [];
let filteredImages = [];

// Cargar imágenes disponibles
async function loadAvailableImages() {
    try {
        const response = await fetch('/api/images');
        const result = await response.json();
        if (result.ok) {
            availableImages = result.images;
            filteredImages = [...availableImages];
            renderImageGrid();
        }
    } catch (err) {
        console.error('Error al cargar imágenes:', err);
    }
}

// Renderizar grid de imágenes
function renderImageGrid() {
    const imageGrid = document.getElementById('image-grid');
    imageGrid.innerHTML = '';
    
    filteredImages.forEach(imageName => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-grid-item';
        imageItem.innerHTML = `
            <img src="/images/equipos/${imageName}" alt="${imageName}" loading="lazy">
            <span class="image-name">${imageName}</span>
        `;
        imageItem.addEventListener('click', () => selectImage(imageName));
        imageGrid.appendChild(imageItem);
    });
}

// Seleccionar imagen
function selectImage(imageName) {
    const fotoInput = document.getElementById('new-foto');
    const preview = document.getElementById('selected-image-preview');
    
    fotoInput.value = `/images/equipos/${imageName}`;
    preview.innerHTML = `
        <div class="selected-image">
            <img src="/images/equipos/${imageName}" alt="Imagen seleccionada">
            <p>Seleccionada: ${imageName}</p>
            <button type="button" onclick="clearImageSelection()">✕ Cambiar</button>
        </div>
    `;
    
    // Ocultar grid después de seleccionar
    document.getElementById('image-grid').style.display = 'none';
}

// Limpiar selección
function clearImageSelection() {
    document.getElementById('new-foto').value = '';
    document.getElementById('selected-image-preview').innerHTML = '';
    document.getElementById('image-grid').style.display = 'grid';
}

// Búsqueda de imágenes
const imageSearchInput = document.getElementById('image-search');
if (imageSearchInput) {
    imageSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredImages = availableImages.filter(img => 
            img.toLowerCase().includes(searchTerm)
        );
        renderImageGrid();
    });
}

// Cargar imágenes al abrir el formulario
const imageToggleFormBtn = document.getElementById('toggle-add-form');
if (imageToggleFormBtn) {
    imageToggleFormBtn.addEventListener('click', () => {
        if (!availableImages.length) {
            loadAvailableImages();
        }
    });
}
