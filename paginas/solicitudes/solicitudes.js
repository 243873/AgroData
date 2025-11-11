document.addEventListener('DOMContentLoaded', () => {
    // --- SIMULACIÓN DE DATOS RECIBIDOS DEL CLIENTE (localStorage) ---
    // En una aplicación real, se obtendrían con una llamada a la API.
    const getSolicitudesAsesorias = () => JSON.parse(localStorage.getItem('solicitudesAsesorias')) || [];
    const getSolicitudesTalleres = () => JSON.parse(localStorage.getItem('solicitudesTalleres')) || [];

    // --- ELEMENTOS DEL DOM ---
    const requestListContainer = document.getElementById('request-list');
    const rejectionModal = document.getElementById('rejectionModal');
    const receiptModal = document.getElementById('receiptModal');
    
    let currentSolicitud = { id: null, type: null }; // Para los modales de confirmación

    // --- FUNCIONES DE MANEJO DE DATOS ---
    const updateSolicitudStatus = (id, type, newStatus) => {
        if (type === 'asesoria') {
            let solicitudes = getSolicitudesAsesorias();
            const index = solicitudes.findIndex(s => s.id == id);
            if (index !== -1) {
                solicitudes[index].estado = newStatus;
                localStorage.setItem('solicitudesAsesorias', JSON.stringify(solicitudes));
            }
        } else { // taller
            let solicitudes = getSolicitudesTalleres();
            const index = solicitudes.findIndex(s => s.id == id);
            if (index !== -1) {
                solicitudes[index].estado = newStatus;
                localStorage.setItem('solicitudesTalleres', JSON.stringify(solicitudes));
            }
        }
        renderSolicitudes(); // Volver a dibujar todo para reflejar el cambio
    };

    // --- FUNCIONES DE RENDERIZADO ---
    const renderSolicitudes = () => {
        const filter = document.querySelector('.filter-btn.active').dataset.filter;
        requestListContainer.innerHTML = '';

        // Combinar ambas fuentes de solicitudes
        const asesorias = getSolicitudesAsesorias().map(s => ({ ...s, type: 'asesoria' }));
        const talleres = getSolicitudesTalleres().map(s => ({ ...s, type: 'taller' }));
        let allSolicitudes = [...asesorias, ...talleres];
        
        // Filtrar si no es "todos"
        if (filter !== 'all') {
            allSolicitudes = allSolicitudes.filter(s => s.type === filter);
        }

        if (allSolicitudes.length === 0) {
            requestListContainer.innerHTML = '<p>No hay solicitudes que coincidan con los filtros seleccionados.</p>';
            return;
        }

        allSolicitudes.forEach(solicitud => {
            const card = document.createElement('div');
            card.className = 'request-card';
            card.dataset.id = solicitud.id;
            card.dataset.type = solicitud.type;

            const summaryDetails = `
                <div class="info-item"><img src="/Imagenes/user.png" class="info-icon"> ${solicitud.userName}</div>
                <div class="info-item"><img src="/Imagenes/marker.png" class="info-icon"> ${solicitud.ubicacion || 'No especificada'}</div>
                <div class="info-item"><img src="/Imagenes/calendar.png" class="info-icon"> ${new Date(solicitud.fechaSolicitud || solicitud.fechaDeseada).toLocaleDateString()}</div>`;

            // Contenido específico para cada tipo de solicitud
            let tagsHTML = '';
            let detailsHTML = '';
            if (solicitud.type === 'asesoria') {
                tagsHTML = `<div class="summary-tags"><span>Cultivo:</span><span class="request-tag">${solicitud.cultivo}</span></div>`;
                detailsHTML = `
                    <div class="details-grid">
                        <div class="info-group"><label>Utiliza Maquinaria:</label><p>${solicitud.utilizaMaquinaria || 'No'}</p></div>
                        <div class="info-group"><label>Superficie Total (Hectáreas):</label><p>${solicitud.superficie || 'N/A'}</p></div>
                        ${solicitud.maquinariaDetalle ? `<div class="info-group"><label>Detalle Maquinaria:</label><p>${solicitud.maquinariaDetalle}</p></div>` : ''}
                        <div class="info-group"><label>Contacto:</label><p>${solicitud.contacto || 'N/A'}</p></div>
                        <div class="info-group"><label>Tiene Plaga Registrada:</label><p>${solicitud.tienePlaga || 'No'}</p></div>
                        ${solicitud.plagaDetalle ? `<div class="info-group"><label>Descripción Plaga:</label><p>${solicitud.plagaDetalle}</p></div>` : ''}
                        <div class="info-group motivo-box"><label>Motivo de la asesoría:</label><p>${solicitud.motivo || 'N/A'}</p></div>
                    </div>`;
            } else { // Taller
                tagsHTML = `<div class="summary-tags"><span>Talleres:</span>${solicitud.talleres.map(t => `<span class="request-tag">${t.nombre}</span>`).join('')}</div>`;
                if(solicitud.estado === 'Confirmado-En espera'){
                    detailsHTML = `<div class="taller-flow-box"><p>Esperando comprobante del cliente...</p></div>`;
                } else if (solicitud.estado === 'Comprobante-Subido') {
                    detailsHTML = `<div class="taller-flow-box">
                        <p>El cliente ha subido el comprobante:</p>
                        <img src="${solicitud.comprobanteURL}" alt="Comprobante">
                        <button class="btn btn-primary btn-verify" data-id="${solicitud.id}" data-type="${solicitud.type}">Verificar y Completar</button>
                    </div>`;
                }
            }
            
            // Botones de acción según el estado
            let actionsHTML = '';
            if (solicitud.estado === 'Pendiente') {
                actionsHTML = `<button class="btn btn-details">Ver más</button><button class="btn btn-accept">Aceptar</button><button class="btn btn-reject">Rechazar</button>`;
            } else {
                actionsHTML = `<button class="btn btn-details">Ver más</button><button class="btn btn-status-badge" disabled>${solicitud.estado.replace(/-/g, ' ')}</button>`;
            }

            card.innerHTML = `
                <div class="card-summary">
                    <div class="summary-info">
                        <h5>Solicitud de ${solicitud.type.charAt(0).toUpperCase() + solicitud.type.slice(1)}</h5>
                        <div class="summary-details">${summaryDetails}</div>
                        ${tagsHTML}
                    </div>
                    <div class="summary-actions">${actionsHTML}</div>
                </div>
                <div class="details-view">${detailsHTML}</div>`;
            
            requestListContainer.appendChild(card);
        });
    };

    // --- MANEJO DE EVENTOS ---
    document.querySelector('.filter-buttons').addEventListener('click', (e) => {
        if (e.target.matches('.filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderSolicitudes();
        }
    });

    requestListContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.request-card');
        if (!card) return;

        const solicitudId = card.dataset.id;
        const solicitudType = card.dataset.type;

        if (e.target.matches('.btn-details')) {
            card.classList.toggle('expanded');
            e.target.textContent = card.classList.contains('expanded') ? 'Ver menos' : 'Ver más';
        }
        if (e.target.matches('.btn-accept')) {
            const newStatus = solicitudType === 'taller' ? 'Confirmado-En espera' : 'Aceptada';
            updateSolicitudStatus(solicitudId, solicitudType, newStatus);
        }
        if (e.target.matches('.btn-reject')) {
            currentSolicitud = { id: solicitudId, type: solicitudType };
            rejectionModal.classList.remove('hidden');
        }
        if (e.target.matches('.btn-verify')) {
             updateSolicitudStatus(solicitudId, solicitudType, 'Completado');
        }
    });

    document.getElementById('cancelRejection').addEventListener('click', () => rejectionModal.classList.add('hidden'));
    document.getElementById('acceptRejection').addEventListener('click', () => {
        updateSolicitudStatus(currentSolicitud.id, currentSolicitud.type, 'Rechazada');
        rejectionModal.classList.add('hidden');
    });

    // --- INICIALIZACIÓN ---
    renderSolicitudes();
});