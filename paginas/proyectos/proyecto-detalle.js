document.addEventListener('DOMContentLoaded', () => {
    // --- 1. VERIFICACIÓN INICIAL Y CARGA DE DATOS ---
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    // **CORRECCIÓN DEL FLICKER**: Si no hay ID o el proyecto no existe, redirige INMEDIATAMENTE.
    if (!projectId || !localStorage.getItem(`project_${projectId}`)) {
        window.location.href = 'proyectos.html';
        return; 
    }

    let currentProject = JSON.parse(localStorage.getItem(`project_${projectId}`));
    let activityToModifyId = null;

    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const projectContainer = document.getElementById('project-container');
    const projectTitle = document.getElementById('project-title');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const infoView = document.getElementById('info-view');
    const actividadesView = document.getElementById('actividades-view');
    const reporteView = document.getElementById('reporte-view');
    
    // Modales
    const infoModal = document.getElementById('info-modal');
    const activityModal = document.getElementById('activity-modal');
    const deleteActivityModal = document.getElementById('delete-activity-modal');
    const successModal = document.getElementById('success-modal');

    // Formularios de modales
    const infoForm = document.getElementById('info-form');
    const activityForm = document.getElementById('activity-form');
    
    // --- 3. LÓGICA DE DATOS ---
    const saveProjectData = () => {
        localStorage.setItem(`project_${currentProject.id}`, JSON.stringify(currentProject));
    };

    // --- 4. LÓGICA DE RENDERIZADO ---
    const renderAllTabs = () => {
        projectTitle.textContent = `Plan de Cultivo: ${currentProject.nombre}`;
        renderInfoTab();
        renderActividadesTab();
        renderReporteTab();
    };
    
    const renderInfoTab = () => {
        const { info, plagaReporte } = currentProject;
        const completadas = currentProject.actividades.filter(a => a.estado === 'Completada').length;
        const total = currentProject.actividades.length;
        const progreso = total > 0 ? (completadas / total) * 100 : 0;

        infoView.innerHTML = `
            <div class="info-section">
                <div class="section-header"><h5>Información General</h5><button class="btn btn-secondary btn-edit-info">Editar</button></div>
                <div class="info-grid">
                    <div class="info-group"><label>Objetivo del Proyecto:</label><p>${info.objetivo || 'No definido'}</p></div>
                    <div class="info-group"><label>Cliente:</label><p><img src="/Imagenes/user.png" class="icon">${currentProject.clienteNombre}</p></div>
                    <div class="info-group"><label>Ubicación:</label><p><img src="/Imagenes/marker.png" class="icon">${info.ubicacion}</p></div>
                    <div class="info-group"><label>Área:</label><p>${info.superficie}</p></div>
                    <div class="info-group"><label>Fecha de Inicio:</label><p>${info.fechaInicio}</p></div>
                    <div class="info-group"><label>Cosecha Esperada:</label><p>${info.cosechaEsperada || 'No definida'}</p></div>
                </div>
                <div class="progress-bar-container">
                    <label>Progreso del Proyecto: ${Math.round(progreso)}% (${completadas} de ${total} Tareas completadas)</label>
                    <div class="progress-bar"><div class="progress-bar-fill" style="width: ${progreso}%;"></div></div>
                </div>
            </div>
            <div class="info-section">
                <div class="section-header"><h5>Reporte de Plaga (Cliente)</h5></div>
                ${plagaReporte ? `<div class="info-grid"><div class="info-group"><label>Fecha:</label><p>${plagaReporte.fecha}</p></div><div class="info-group"><label>Tipo:</label><p>${plagaReporte.tipo}</p></div><div class="info-group" style="grid-column: 1 / -1;"><label>Descripción:</label><p>${plagaReporte.descripcion}</p></div></div>` : '<p>El cliente no ha reportado ninguna plaga.</p>'}
            </div>`;
    };

    const renderActividadesTab = () => {
        actividadesView.innerHTML = `<button class="btn btn-add-activity">+ Agregar nueva actividad</button>`;
        currentProject.actividades.forEach(act => {
            const card = document.createElement('div');
            card.className = 'activity-card';
            card.innerHTML = `
                <div class="activity-header">
                    <h5>${act.titulo}</h5>
                    <div class="activity-actions">
                        <button class="btn btn-secondary btn-edit-activity" data-id="${act.id}">Editar</button>
                        <button class="btn btn-danger btn-delete-activity" data-id="${act.id}">Eliminar</button>
                    </div>
                </div>
                <div class="activity-body">
                    <p>${act.descripcion}</p>
                    <div class="activity-dates"><span><strong>Inicio:</strong> ${act.fechaInicio}</span><span><strong>Fin:</strong> ${act.fechaFin}</span></div>
                    ${act.comentarioCliente ? `<div class="evidence-section"><strong>Evidencia (Comentario del Cliente):</strong><div class="evidence-content">${act.comentarioCliente}</div></div>` : ''}
                </div>`;
            actividadesView.appendChild(card);
        });
    };

    const renderReporteTab = () => {
        reporteView.innerHTML = `<div class="report-section"><h5>Reporte Final</h5><p>${currentProject.rendimientoFinal || 'El reporte final aún no ha sido generado.'}</p></div>`;
    };

    // --- 5. LÓGICA DE MODALES ---
    const openModal = (modal) => modal.classList.remove('hidden');
    const closeModal = (modal) => modal.classList.add('hidden');
    const showSuccess = () => { openModal(successModal); setTimeout(() => closeModal(successModal), 2000); };

    const openInfoModal = () => {
        infoForm.elements['info-objetivo'].value = currentProject.info.objetivo || '';
        infoForm.elements['info-cosecha'].value = currentProject.info.cosechaEsperada || '';
        openModal(infoModal);
    };

    const openActivityModal = (activityId) => {
        activityToModifyId = activityId;
        const modalTitle = activityModal.querySelector('#activity-modal-title');
        if (activityId) {
            const activity = currentProject.actividades.find(a => a.id == activityId);
            modalTitle.textContent = "Editar Actividad";
            activityForm.elements['activity-name'].value = activity.titulo;
            activityForm.elements['activity-desc'].value = activity.descripcion;
            activityForm.elements['activity-start'].value = activity.fechaInicio;
            activityForm.elements['activity-end'].value = activity.fechaFin;
        } else {
            modalTitle.textContent = "Agregar Nueva Actividad";
            activityForm.reset();
        }
        openModal(activityModal);
    };

    // --- 6. MANEJO DE EVENTOS ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
            button.classList.add('active');
            document.getElementById(`${button.dataset.tab}-view`).classList.remove('hidden');
        });
    });

    projectContainer.addEventListener('click', e => {
        const target = e.target;
        if (target.matches('.btn-edit-info')) openInfoModal();
        if (target.matches('.btn-add-activity')) openActivityModal(null);
        if (target.matches('.btn-edit-activity')) openActivityModal(target.dataset.id);
        if (target.matches('.btn-delete-activity')) {
            activityToModifyId = target.dataset.id;
            openModal(deleteActivityModal);
        }
    });

    // Eventos de los modales
    document.getElementById('cancel-info-btn').addEventListener('click', () => closeModal(infoModal));
    document.getElementById('save-info-btn').addEventListener('click', () => {
        currentProject.info.objetivo = infoForm.elements['info-objetivo'].value;
        currentProject.info.cosechaEsperada = infoForm.elements['info-cosecha'].value;
        saveProjectData();
        renderAllTabs();
        closeModal(infoModal);
        showSuccess();
    });

    document.getElementById('cancel-activity-btn').addEventListener('click', () => closeModal(activityModal));
    document.getElementById('save-activity-btn').addEventListener('click', () => {
        const name = activityForm.elements['activity-name'].value;
        const desc = activityForm.elements['activity-desc'].value;
        const start = activityForm.elements['activity-start'].value;
        const end = activityForm.elements['activity-end'].value;

        if (!name || !desc || !start || !end) {
            alert("Todos los campos son obligatorios.");
            return;
        }

        if (activityToModifyId) { // Editando
            const activity = currentProject.actividades.find(a => a.id == activityToModifyId);
            activity.titulo = name;
            activity.descripcion = desc;
            activity.fechaInicio = start;
            activity.fechaFin = end;
        } else { // Creando
            const newActivity = {
                id: `act${Date.now()}`,
                titulo: name,
                descripcion: desc,
                fechaInicio: start,
                fechaFin: end,
                estado: "Pendiente",
                comentarioCliente: "",
                evidenciaUrl: null
            };
            currentProject.actividades.push(newActivity);
        }
        saveProjectData();
        renderAllTabs();
        closeModal(activityModal);
        showSuccess();
    });

    document.getElementById('cancel-delete-btn').addEventListener('click', () => closeModal(deleteActivityModal));
    document.getElementById('accept-delete-btn').addEventListener('click', () => {
        currentProject.actividades = currentProject.actividades.filter(a => a.id != activityToModifyId);
        saveProjectData();
        renderAllTabs();
        closeModal(deleteActivityModal);
    });

    // --- 7. INICIALIZACIÓN ---
    renderAllTabs();
});