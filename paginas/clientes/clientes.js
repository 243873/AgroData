document.addEventListener('DOMContentLoaded', () => {
    // --- SIMULACIÓN DE DATOS DE API ---
    // En un futuro, esta información vendrá de una base de datos.
    const clientesData = [
        {
            id: 1,
            nombre: 'Juan Pérez',
            ubicacion: 'San Miguel, Chiapas',
            correo: 'juan.perez@email.com',
            telefono: '967 123 4567',
            cultivos: ['Papa', 'Chayote', 'Calabaza'],
            proyecto: 'Producción de Maíz',
            area: 3.24
        },
        {
            id: 2,
            nombre: 'María García',
            ubicacion: 'Comitán, Chiapas',
            correo: 'maria.garcia@email.com',
            telefono: '963 987 6543',
            cultivos: ['Café'],
            proyecto: 'Cosecha Orgánica de Altura',
            area: 5.0
        },
        {
            id: 3,
            nombre: 'Carlos López',
            ubicacion: 'Ocosingo, Chiapas',
            correo: 'carlos.lopez@email.com',
            telefono: '919 456 1234',
            cultivos: ['Frijol', 'Maíz'],
            proyecto: 'Policultivo Sustentable',
            area: 2.5
        }
    ];

    // --- ELEMENTOS DEL DOM ---
    const clientGrid = document.getElementById('client-grid');
    const clientCountElement = document.getElementById('client-count');
    const welcomeMessage = document.getElementById('welcomeMessage');

    // --- Cargar datos del agrónomo actual ---
    const currentUser = JSON.parse(localStorage.getItem('usuarioActual'));
    if (currentUser) {
        welcomeMessage.textContent = `Bienvenido, ${currentUser.nombre}`;
    }

    // --- FUNCIÓN PARA RENDERIZAR CLIENTES ---
    const renderClientes = (clientes) => {
        // Limpiar la cuadrícula antes de agregar nuevos elementos
        clientGrid.innerHTML = '';

        if (clientes.length === 0) {
            clientGrid.innerHTML = '<p>No tienes clientes asignados por el momento.</p>';
            clientCountElement.textContent = '0 clientes encontrados';
            return;
        }
        
        // Actualizar el contador de clientes
        clientCountElement.textContent = `Tienes un total de ${clientes.length} clientes.`;

        clientes.forEach(cliente => {
            // Generar las etiquetas de cultivo
            const cultivosHtml = cliente.cultivos.map(cultivo => `<span class="cultivo-tag">${cultivo}</span>`).join('');

            // Crear el elemento de la tarjeta
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-card-header">
                    <h5>${cliente.nombre}</h5>
                </div>
                <div class="client-info">
                    <p><img src="/Imagenes/marker.png" class="info-icon"> ${cliente.ubicacion}</p>
                    <p><img src="/Imagenes/envelope.png" class="info-icon"> ${cliente.correo}</p>
                    <p><img src="/Imagenes/phone-flip.png" class="info-icon"> ${cliente.telefono}</p>
                </div>
                <div class="more-details">
                    <p><strong>Cultivos principales:</strong></p>
                    <div class="cultivos-list">${cultivosHtml}</div>
                    <p><strong>Proyecto actual:</strong> ${cliente.proyecto}</p>
                    <p><strong>Área total:</strong> ${cliente.area} Hectáreas</p>
                </div>
                <div class="toggle-details">
                    <img src="/Imagenes/angle-small-down.png" class="toggle-icon">
                    <span>Ver más</span>
                </div>
            `;
            clientGrid.appendChild(card);
        });
    };

    // --- MANEJO DE EVENTOS (EVENT DELEGATION) ---
    // Se agrega un solo listener al contenedor padre para mayor eficiencia.
    clientGrid.addEventListener('click', (event) => {
        const toggleButton = event.target.closest('.toggle-details');

        if (toggleButton) {
            const card = toggleButton.closest('.client-card');
            const toggleText = toggleButton.querySelector('span');

            card.classList.toggle('open');

            if (card.classList.contains('open')) {
                toggleText.textContent = 'Ver menos';
            } else {
                toggleText.textContent = 'Ver más';
            }
        }
    });

    // --- INICIALIZACIÓN ---
    // Renderizar los clientes al cargar la página
    renderClientes(clientesData);
});