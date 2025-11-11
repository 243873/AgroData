document.addEventListener('DOMContentLoaded', () => {
    // --- SIMULACIÓN DE BASE DE DATOS ---
    const initialTalleresDisponibles = [
        { id: 'taller-01', nombre: 'Manejo de Suelo', descripcion: 'Análisis del suelo, condiciones edafoclimáticas y mejora de la tierra.', costo: 25000 },
        { id: 'taller-02', nombre: 'Control de Plagas', descripcion: 'Métodos de muestreo, análisis del nivel de incidencia y control biológico.', costo: 8000 },
        { id: 'taller-03', nombre: 'Fertilización Orgánica', descripcion: 'Identificación de requerimientos nutricionales y creación de abonos.', costo: 15000 },
    ];
    const historialTalleresData = [
        { id: 'hist-01', nombre: 'Fertilización', cliente: 'Juan Pérez', ubicacion: 'San Juan Chamula', fechaInicio: '2025-11-05', fechaFin: '2025-11-12', estado: 'completado', comprobante: '/Imagenes/comprobante_ejemplo.png' },
        { id: 'hist-02', nombre: 'Ecotecnias', cliente: 'María García', ubicacion: 'Comitán, Chiapas', fechaInicio: '2025-10-20', fechaFin: '2025-10-25', estado: 'en-curso', comprobante: '/Imagenes/comprobante_ejemplo.png' },
        { id: 'hist-03', nombre: 'Control de Plagas', cliente: 'Carlos López', ubicacion: 'Ocosingo, Chiapas', fechaInicio: '2025-12-01', fechaFin: '2025-12-06', estado: 'pendiente', comprobante: null },
    ];

    // --- ELEMENTOS DEL DOM ---
    const workshopListContainer = document.getElementById('workshop-list');
    const historyGridContainer = document.getElementById('workshop-history-grid');
    const modal = document.getElementById('workshopModal');
    const deleteModal = document.getElementById('deleteConfirmationModal');
    const successModal = document.getElementById('successModal');
    const receiptModal = document.getElementById('receiptModal');
    const workshopForm = document.getElementById('workshopForm');
    
    let talleresDisponiblesDB = [];
    let editingWorkshopId = null;

    // --- FUNCIONES DE DATOS (localStorage) ---
    const saveDataToLocalStorage = () => localStorage.setItem('talleresDisponiblesDB', JSON.stringify(talleresDisponiblesDB));
    const loadDataFromLocalStorage = () => {
        const data = localStorage.getItem('talleresDisponiblesDB');
        talleresDisponiblesDB = data ? JSON.parse(data) : initialTalleresDisponibles;
    };

    // --- FUNCIONES DE RENDERIZADO ---
    const renderTalleresDisponibles = () => {
        workshopListContainer.innerHTML = '';
        if (talleresDisponiblesDB.length === 0) {
            workshopListContainer.innerHTML = '<p>No hay talleres disponibles. ¡Agrega el primero!</p>';
            return;
        }
        talleresDisponiblesDB.forEach(taller => {
            const item = document.createElement('div');
            item.className = 'workshop-item';
            item.innerHTML = `<div class="workshop-header"><h5>${taller.nombre}</h5><button class="btn btn-secondary btn-edit" data-id="${taller.id}">Editar</button></div><p class="workshop-description">${taller.descripcion}</p><p class="workshop-cost">Costo: $${taller.costo.toLocaleString()}</p>`;
            workshopListContainer.appendChild(item);
        });
    };

    const renderHistorialTalleres = (filter = 'all') => {
        historyGridContainer.innerHTML = '';
        const filteredData = (filter === 'all') ? historialTalleresData : historialTalleresData.filter(t => t.estado === filter);
        if (filteredData.length === 0) {
            historyGridContainer.innerHTML = '<p>No hay registros que coincidan con el filtro seleccionado.</p>';
            return;
        }
        filteredData.forEach(taller => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="history-card-body">
                    <p><strong>Taller:</strong> ${taller.nombre}</p>
                    <p><img src="/Imagenes/user.png" class="icon"> <strong>Cliente:</strong> ${taller.cliente}</p>
                    <p><img src="/Imagenes/marker.png" class="icon"> <strong>Ubicación:</strong> ${taller.ubicacion}</p>
                    <div class="expandable-content">
                        <div class="info-group"><p><strong>Fecha de Inicio:</strong> ${taller.fechaInicio}</p></div>
                        <div class="info-group"><p><strong>Fecha de Final:</strong> ${taller.fechaFin}</p></div>
                        ${taller.comprobante ? `<a href="#" class="view-receipt" data-img-src="${taller.comprobante}"><img src="/Imagenes/eye-icon.png" class="icon"> Ver comprobante</a>` : ''}
                    </div>
                </div>
                <div class="history-card-footer">
                    <a href="#" class="toggle-details-btn">▼ Ver más</a>
                    <button class="btn btn-status status-${taller.estado}" disabled>${taller.estado.charAt(0).toUpperCase() + taller.estado.slice(1)}</button>
                </div>`;
            historyGridContainer.appendChild(card);
        });
    };
    
    // --- MANEJO DE MODALES ---
    const openModal = (m) => m.classList.remove('hidden');
    const closeModal = (m) => m.classList.add('hidden');
    const showSuccess = () => { openModal(successModal); setTimeout(() => closeModal(successModal), 2000); };
    
    const openModalForEdit = (id) => {
        editingWorkshopId = id;
        const taller = talleresDisponiblesDB.find(t => t.id === id);
        if (!taller) return;
        modal.querySelector('#modalTitle').textContent = 'Editar Taller';
        workshopForm.elements['workshopName'].value = taller.nombre;
        workshopForm.elements['workshopDescription'].value = taller.descripcion;
        workshopForm.elements['workshopCost'].value = taller.costo;
        document.getElementById('deleteWorkshopBtn').classList.remove('hidden');
        openModal(modal);
    };
    
    const openModalForNew = () => {
        editingWorkshopId = null;
        modal.querySelector('#modalTitle').textContent = 'Agregar Nuevo Taller';
        workshopForm.reset();
        document.getElementById('deleteWorkshopBtn').classList.add('hidden');
        openModal(modal);
    };
    
    // --- MANEJO DE EVENTOS ---
    document.getElementById('addNewWorkshopBtn').addEventListener('click', openModalForNew);
    document.getElementById('cancelWorkshop').addEventListener('click', () => closeModal(modal));
    document.getElementById('saveWorkshop').addEventListener('click', () => workshopForm.requestSubmit());
    document.getElementById('deleteWorkshopBtn').addEventListener('click', () => { closeModal(modal); openModal(deleteModal); });
    document.getElementById('cancelDelete').addEventListener('click', () => closeModal(deleteModal));
    document.getElementById('closeReceipt').addEventListener('click', () => closeModal(receiptModal));
    
    document.getElementById('acceptDelete').addEventListener('click', () => {
        talleresDisponiblesDB = talleresDisponiblesDB.filter(t => t.id !== editingWorkshopId);
        saveDataToLocalStorage();
        renderTalleresDisponibles();
        closeModal(deleteModal);
        showSuccess();
    });

    workshopForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = workshopForm.elements['workshopName'].value.trim();
        const descripcion = workshopForm.elements['workshopDescription'].value.trim();
        const costo = parseInt(workshopForm.elements['workshopCost'].value, 10);

        if (!nombre || !descripcion || isNaN(costo) || costo < 0) {
            alert("Por favor, completa todos los campos con valores válidos.");
            return;
        }
        
        if (editingWorkshopId) {
            const index = talleresDisponiblesDB.findIndex(t => t.id === editingWorkshopId);
            if(index !== -1) talleresDisponiblesDB[index] = { ...talleresDisponiblesDB[index], nombre, descripcion, costo };
        } else {
            const newTaller = { id: `taller-${Date.now()}`, nombre, descripcion, costo };
            talleresDisponiblesDB.push(newTaller);
        }
        
        saveDataToLocalStorage();
        renderTalleresDisponibles();
        closeModal(modal);
        showSuccess();
    });

    workshopListContainer.addEventListener('click', (e) => {
        const editButton = e.target.closest('.btn-edit');
        if (editButton) openModalForEdit(editButton.dataset.id);
    });

    document.querySelector('.workshops-nav').addEventListener('click', (e) => {
        if (e.target.matches('.nav-button')) {
            document.querySelectorAll('.workshops-nav .nav-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const view = e.target.dataset.view;
            document.getElementById('view-capacitaciones').classList.toggle('hidden', view !== 'capacitaciones');
            document.getElementById('view-historial').classList.toggle('hidden', view !== 'historial');
        }
    });

    document.querySelector('.filter-buttons').addEventListener('click', (e) => {
        if (e.target.matches('.filter-btn')) {
            document.querySelectorAll('.filter-buttons .filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderHistorialTalleres(e.target.dataset.filter);
        }
    });

    // CORRECCIÓN: Event listener para "Ver más" que actúa solo sobre el elemento clickeado.
    historyGridContainer.addEventListener('click', (e) => {
        const toggleLink = e.target.closest('.toggle-details-btn');
        const receiptLink = e.target.closest('.view-receipt');

        if (toggleLink) {
            e.preventDefault();
            // 1. Encuentra el contenido expandible DENTRO de la tarjeta clickeada
            const content = toggleLink.closest('.history-card').querySelector('.expandable-content');
            
            // 2. Alterna la clase 'expanded' SOLO en ese contenido
            content.classList.toggle('expanded');
            
            // 3. Cambia el texto del botón clickeado
            toggleLink.innerHTML = content.classList.contains('expanded') ? '▲ Ver menos' : '▼ Ver más';
        }

        if (receiptLink) {
            e.preventDefault();
            document.getElementById('receiptImage').src = receiptLink.dataset.imgSrc;
            openModal(receiptModal);
        }
    });
    
    // --- INICIALIZACIÓN ---
    const init = () => {
        loadDataFromLocalStorage();
        renderTalleresDisponibles();
        renderHistorialTalleres();
    };

    init();
});