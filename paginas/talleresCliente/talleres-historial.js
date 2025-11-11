document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURACIÓN Y VERIFICACIÓN DE USUARIO ---
    const API_BASE_URL = "http://localhost:7000";
    const userId = sessionStorage.getItem('usuarioId');
    const userRol = sessionStorage.getItem('usuarioRol');

    if (!userId || !userRol) { 
        window.location.href = '/index.html'; 
        return; 
    }
    
    // Asumimos que el nombre ya está cargado o usamos un valor predeterminado
    const currentUser = { id: parseInt(userId), nombre: "Cliente ID " + userId }; 

    // --- ELEMENTOS DEL DOM ---
    const solicitudesView = document.getElementById('solicitudes-view');
    const historialView = document.getElementById('historial-view');
    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const historialCardsContainer = document.getElementById('historial-cards-container');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const viewComprobanteModal = document.getElementById('viewComprobanteModal');
    const comprobanteImage = document.getElementById('comprobanteImage');
    const closeComprobanteModal = document.getElementById('closeComprobanteModal');
    
    if (welcomeMessage) welcomeMessage.textContent = `Bienvenido, ${currentUser.nombre}`;
    
    // ===================================
    // --- LÓGICA DE LA API (FETCH) ---
    // ===================================

    /**
     * @returns {Promise<Array>} Lista de solicitudes de taller filtradas por userId.
     */
    async function getAllSolicitudes() {
        try {
            // CORRECCIÓN: Usar la nueva ruta segura y enviar el userId en la cabecera
            const response = await fetch(`${API_BASE_URL}/solicitudtaller/misolicitudes`, {
                method: 'GET',
                headers: {
                    'userId': userId // Enviar el ID de sesión para que la API filtre
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            // La API ya filtró, el front-end solo retorna lo recibido
            return await response.json(); 

        } catch (error) {
            console.error('Error al obtener solicitudes de taller:', error);
            listView.innerHTML = `<p class="error-message">Error al cargar las solicitudes: ${error.message}</p>`;
            return [];
        }
    }

    /**
     * Actualiza el estado de una solicitud usando PATCH.
     */
    async function updateSolicitudEstado(solicitudId, nuevoEstado) {
        try {
            const response = await fetch(`${API_BASE_URL}/solicitudtaller/${solicitudId}/${nuevoEstado}`, {
                method: 'PATCH',
                headers: {
                    // NOTA: Se recomienda enviar el Rol 1 (Agrónomo) en esta PATCH si es una acción restringida,
                    // pero lo dejamos sin Rol para la prueba.
                    'Content-Type': 'application/json' 
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Fallo al actualizar el estado: ${response.status} - ${errorText}`);
            }
            return true;
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert(`Error al actualizar el estado: ${error.message}`);
            return false;
        }
    }
    
    // =======================================
    // --- LÓGICA DE RENDERIZADO (ASYNC) --- (Resto del código sin cambios funcionales)
    // =======================================
    
    async function renderSolicitudesListView() {
        listView.innerHTML = '';
        const allSolicitudes = await getAllSolicitudes();
        
        const misSolicitudes = allSolicitudes.filter(s => s.estado !== 'Completado');

        if (misSolicitudes.length === 0) { 
            listView.innerHTML = '<p>No tienes solicitudes de talleres activas.</p>'; 
            return; 
        }

        misSolicitudes.forEach(solicitud => {
            const nombresTalleres = solicitud.talleres && Array.isArray(solicitud.talleres) ? 
                                    solicitud.talleres.map(t => t.nombre).join(', ') : 
                                    (solicitud.talleresIds || []).join(', '); 

            const estadoClass = solicitud.estado.toLowerCase().replace(/ /g, '-');
            const card = `
                <div class="solicitud-card">
                    <div class="card-info">
                        <div>
                            <h5>${nombresTalleres}</h5>
                            <div class="card-info-details">
                                <p><img src="/Imagenes/user.png" class="icon"> ${currentUser.nombre || 'Yo'}</p>
                                <p><img src="/Imagenes/location.png" class="icon"> ${solicitud.ubicacion}</p>
                                <p><img src="/Imagenes/calendar.png" class="icon"> ${solicitud.fechaDeseada}</p>
                            </div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-details" data-id="${solicitud.id}">Ver Detalles</button>
                        <div class="status-badge status-${estadoClass}">${solicitud.estado.replace(/-/g, ' ')}</div>
                    </div>
                </div>`;
            listView.innerHTML += card;
        });
    }

    async function renderDetailView(solicitudId) { 
        const allSolicitudes = await getAllSolicitudes(); 
        const solicitud = allSolicitudes.find(s => s.id == solicitudId);
        if (!solicitud) return;

        const fechaInicio = new Date(solicitud.fechaDeseada + 'T00:00:00');
        const fechaFinal = new Date(fechaInicio);
        fechaFinal.setDate(fechaInicio.getDate() + 7);
        const fechaFinalFormateada = fechaFinal.toISOString().split('T')[0];

        listView.classList.add('hidden');
        detailView.classList.remove('hidden');

        let procesoHTML = '';
        const estado = solicitud.estado;
        
        // --- CÓDIGO HTML DE ESTADOS (Mantenido) ---
        if (estado === 'Pendiente') {
            procesoHTML = `
                <div class="proceso-view">
                    <div class="proceso-header">
                        <div class="proceso-step active"><span class="step-number">1</span><span class="step-title">Solicitud Enviada</span></div>
                        <div class="proceso-step"><span class="step-number">2</span><span class="step-title">Confirmación</span></div>
                        <div class="proceso-step"><span class="step-number">3</span><span class="step-title">Taller Realizado</span></div>
                    </div>
                    <div class="proceso-content">
                        <h5>Estado: <span class="status-badge status-pendiente">Pendiente de Revisión</span></h5>
                        <p><strong>Hemos recibido tu solicitud y está en proceso de revisión por nuestro equipo.</strong></p>
                        <p>Te notificaremos cualquier actualización en un plazo de 1 día hábil a través de esta plataforma y tu correo electrónico.</p>
                        <div class="info-box"><p>Puedes seguir el estado de tu solicitud aquí en cualquier momento.</p></div>
                    </div>
                </div>`;
        } else if (estado === 'Confirmado-En espera') {
            procesoHTML = `
                <div class="proceso-view">
                    <div class="proceso-header">
                        <div class="proceso-step completed"><span class="step-number">✔</span><span class="step-title">Solicitud Enviada</span></div>
                        <div class="proceso-step active"><span class="step-number">2</span><span class="step-title">Confirmación</span></div>
                        <div class="proceso-step"><span class="step-number">3</span><span class="step-title">Taller Realizado</span></div>
                    </div>
                    <div class="proceso-content">
                        <h5>Estado: <span class="status-badge status-confirmado-en-espera">Confirmado - En Espera de Pago</span></h5>
                        <p><strong>¡Buenas noticias! Tu solicitud ha sido aprobada.</strong></p>
                        <p>Para confirmar tu lugar, por favor realiza el pago del anticipo y sube el comprobante a continuación.</p>
                        <div class="info-box"><p><strong>Cuenta a transferir:</strong> ${solicitud.cuentaTransferir || 'No especificada'}</p></div>
                        <input type="file" id="file-input-${solicitud.id}" class="hidden" accept="image/*">
                        <button class="btn-action-box" data-for-input="file-input-${solicitud.id}">📷 Subir Comprobante de Pago</button>
                        <div class="image-preview-container hidden"><img class="image-preview" src="" alt="Vista previa del comprobante"></div>
                        <button class="btn btn-update hidden" data-id="${solicitud.id}" data-new-state="Completado">Confirmar Pago y Finalizar</button>
                    </div>
                </div>`;
        } else if (estado === 'Rechazada') {
            procesoHTML = `
                <div class="proceso-view">
                    <div class="proceso-header">
                        <div class="proceso-step rejected"><span class="step-number">✖</span><span class="step-title">Solicitud Rechazada</span></div>
                    </div>
                    <div class="proceso-content">
                        <h5>Estado: <span class="status-badge status-rechazada">Solicitud Rechazada</span></h5>
                        <p><strong>Lamentamos informarte que tu solicitud no pudo ser aprobada en esta ocasión.</strong></p>
                        <div class="info-box">
                            <p><strong>Motivo:</strong> ${solicitud.motivoRechazo || 'No especificado.'}</p>
                        </div>
                        <p>Si tienes dudas, puedes contactar al agrónomo asignado:</p>
                        <div class="info-box">
                            <p><strong>Contacto del agrónomo:</strong></p>
                            <p>${(solicitud.contactoAgronomo && solicitud.contactoAgronomo.email) || 'No disponible'}</p>
                            <p>${(solicitud.contactoAgronomo && solicitud.contactoAgronomo.telefono) || ''}</p>
                        </div>
                        <button class="btn btn-secondary" onclick="window.location.href='/paginas/inicioCliente/inicioCliente.html'">Solicitar un nuevo taller</button>
                    </div>
                </div>`;
        } else if (estado === 'Completado') {
            procesoHTML = `
                <div class="proceso-view">
                    <div class="proceso-header">
                        <div class="proceso-step completed"><span class="step-number">✔</span><span class="step-title">Solicitud Enviada</span></div>
                        <div class="proceso-step completed"><span class="step-number">✔</span><span class="step-title">Confirmación</span></div>
                        <div class="proceso-step completed"><span class="step-number">✔</span><span class="step-title">Taller Realizado</span></div>
                    </div>
                    <div class="proceso-content">
                        <h5>Estado: <span class="status-badge status-completado">Taller Completado</span></h5>
                        <p><strong>¡Este taller ha sido completado con éxito!</strong></p>
                        <p>Esperamos que haya sido de gran ayuda para tu proyecto.</p>
                        <div class="info-box">
                            <p><strong>Impartido por:</strong> ${solicitud.impartio || 'No asignado'}</p>
                            <p><strong>Fecha de realización:</strong> ${solicitud.fechaDeseada}</p>
                        </div>
                        ${solicitud.comprobanteURL ? `<button class="btn-action-box" data-action="view-comprobante" data-url="${solicitud.comprobanteURL}">📄 Ver Comprobante de Pago</button>` : ''}
                    </div>
                </div>`;
        }
        
        const nombresTalleres = solicitud.talleres && Array.isArray(solicitud.talleres) ? 
                                solicitud.talleres.map(t => t.nombre).join(', ') : 
                                (solicitud.talleresIds || []).join(', ');

        detailView.innerHTML = `
            <button class="btn" id="backToListBtn">← Volver a la lista</button>
            <div class="detail-card">
                <div class="detail-column">
                    <div class="info-group"><label>Taller(es):</label><p>${nombresTalleres}</p></div>
                    <div class="info-group"><label>Ubicación:</label><p><img src="/Imagenes/location.png" class="icon"> ${solicitud.ubicacion}</p></div>
                    <div class="info-group"><label>Fecha de Inicio:</label><p>${solicitud.fechaDeseada}</p></div>
                    <div class="info-group"><label>Fecha de Final:</label><p>${fechaFinalFormateada}</p></div>
                </div>
                <div class="vertical-divider"></div>
                <div class="detail-column detail-actions">
                    ${procesoHTML}
                </div>
            </div>`;
    }
    
    async function renderHistorialView() {
        historialCardsContainer.innerHTML = '';
        const allSolicitudes = await getAllSolicitudes();
        const historialItems = allSolicitudes.filter(s => s.estado === 'Completado');

        if (historialItems.length === 0) {
            historialCardsContainer.innerHTML = '<p>No hay talleres completados en tu historial.</p>';
            return;
        }

        historialItems.forEach(item => {
            const fechaInicio = new Date(item.fechaDeseada + 'T00:00:00');
            const fechaFinal = new Date(fechaInicio);
            fechaFinal.setDate(fechaInicio.getDate() + 7);
            
            const nombresTalleres = item.talleres && Array.isArray(item.talleres) ? 
                                    item.talleres.map(t => t.nombre).join(', ') : 
                                    (item.talleresIds || []).join(', ');
            
            const card = `
                <div class="historial-card" data-id="${item.id}">
                    <div class="historial-card-body">
                        <p><strong>Taller:</strong> ${nombresTalleres}</p>
                        <p><img src="/Imagenes/user.png" class="icon"> <strong>Impartió:</strong> ${item.impartio || 'No asignado'}</p>
                        <p><img src="/Imagenes/location.png" class="icon"> <strong>Ubicación:</strong> ${item.ubicacion}</p>
                        <div class="expandable-content">
                            <div class="info-group"><p><strong>Fecha de Inicio:</strong> ${item.fechaDeseada}</p></div>
                            <div class="info-group"><p><strong>Fecha de Final:</strong> ${fechaFinal.toISOString().split('T')[0]}</p></div>
                            ${item.comprobanteURL ? `<a href="#" class="btn-ver-comprobante" data-url="${item.comprobanteURL}"><img src="/Imagenes/eye-icon.png" class="icon"> Ver comprobante</a>` : ''}
                        </div>
                    </div>
                    <a href="#" class="toggle-details">▼ Ver más</a>
                    <div class="historial-card-footer">
                        <button class="btn btn-status status-completado">✔ Completado</button>
                    </div>
                </div>`;
            historialCardsContainer.innerHTML += card;
        });
    }

    // --- MANEJO DE VISTAS Y EVENTOS (Mantenido) ---
    function showMainView(viewName) {
        detailView.classList.add('hidden'); 
        listView.classList.remove('hidden');

        if (viewName === 'solicitudes') {
            solicitudesView.classList.remove('hidden');
            historialView.classList.add('hidden');
            renderSolicitudesListView(); 
        } else {
            solicitudesView.classList.add('hidden');
            historialView.classList.remove('hidden');
            renderHistorialView();
        }
    }

    document.querySelector('.filter-buttons').addEventListener('click', (e) => {
        if (e.target.matches('.btn-filter')) {
            document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            showMainView(e.target.dataset.view);
        }
    });

    document.querySelector('.main-content').addEventListener('click', async (e) => {
        const detailsButton = e.target.closest('.btn-details');
        const backButton = e.target.closest('#backToListBtn');
        const actionBoxButton = e.target.closest('.btn-action-box[data-for-input]');
        const viewComprobanteButton = e.target.closest('.btn-action-box[data-action="view-comprobante"]') || e.target.closest('.btn-ver-comprobante');
        const updateButton = e.target.closest('.btn-update');

        if (detailsButton) { 
            renderDetailView(detailsButton.dataset.id); 
        }
        if (backButton) { 
            detailView.classList.add('hidden');
            const activeFilter = document.querySelector('.btn-filter.active');
            showMainView(activeFilter ? activeFilter.dataset.view : 'solicitudes'); 
        }
        if (actionBoxButton) { 
            document.getElementById(actionBoxButton.dataset.forInput).click(); 
        }
        if (viewComprobanteButton) {
            e.preventDefault();
            const url = viewComprobanteButton.dataset.url || viewComprobanteButton.dataset.url;
            comprobanteImage.src = url;
            viewComprobanteModal.classList.remove('hidden');
        }
        
        // Lógica de confirmación de pago (Actualización de estado)
        if (updateButton) {
            const solicitudId = updateButton.dataset.id;
            const nuevoEstado = updateButton.dataset.newState; // 'Completado'
            
            const previewImage = detailView.querySelector('.image-preview');
            const comprobanteURL = previewImage ? previewImage.src : null;
            
            if (!comprobanteURL || !comprobanteURL.startsWith('data:')) {
                alert('Por favor, sube primero el comprobante de pago.');
                return;
            }

            const isUpdated = await updateSolicitudEstado(solicitudId, nuevoEstado);

            if (isUpdated) {
                alert('¡Pago confirmado! Tu taller ha sido marcado como completado.');
                
                detailView.classList.add('hidden');
                listView.classList.remove('hidden');
                renderSolicitudesListView();
            }
        }
    });
    
    detailView.addEventListener('change', (e) => {
        if (e.target.matches('input[type="file"]')) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const previewContainer = e.target.nextElementSibling.nextElementSibling;
                    const previewImage = previewContainer.querySelector('.image-preview');
                    const updateButton = previewContainer.nextElementSibling;
                    
                    previewImage.src = event.target.result;
                    previewContainer.classList.remove('hidden');
                    updateButton.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        }
    });

    historialCardsContainer.addEventListener('click', (e) => {
        e.preventDefault();
        const toggleLink = e.target.closest('.toggle-details');
        if (toggleLink) {
            const card = toggleLink.closest('.historial-card');
            const content = card.querySelector('.expandable-content');
            content.classList.toggle('expanded');
            toggleLink.innerHTML = content.classList.contains('expanded') ? '▲ Ver menos' : '▼ Ver más';
        }
    });

    closeComprobanteModal.addEventListener('click', () => {
        viewComprobanteModal.classList.add('hidden');
    });

    // --- INICIALIZACIÓN ---
    showMainView('solicitudes');
});