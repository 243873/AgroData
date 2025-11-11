document.addEventListener('DOMContentLoaded', () => {
    // --- 1. VERIFICACIÓN DE USUARIO Y ESTADO DE LA APLICACIÓN ---
    const currentUser = JSON.parse(localStorage.getItem('usuarioActual'));
    if (!currentUser) { window.location.href = '/index.html'; return; }

    let currentProject = {};
    let currentActivityId = null;
    let newActivityImageBase64 = null;
    let newPlagaImageBase64 = null;

    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const projectContainer = document.querySelector('.project-container');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const projectTitle = document.getElementById('project-title');
    const projectGeneralInfo = document.getElementById('project-general-info');
    const cropTabNavigation = document.getElementById('crop-tab-navigation');
    const cropTabContent = document.getElementById('crop-tab-content');
    
    const editActivityModal = document.getElementById('edit-activity-modal');
    const imageViewerModal = document.getElementById('image-viewer-modal');
    const plagaReportModal = document.getElementById('plaga-report-modal');
    const successModal = document.getElementById('success-modal');
    
    const modalActivityTitle = document.getElementById('modal-activity-title');
    const activityComment = document.getElementById('activity-comment');
    const activityImageInput = document.getElementById('activity-image-input');
    const uploadImageButton = document.getElementById('upload-image-button');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveActivityBtn = document.getElementById('save-activity-btn');
    
    const viewerModalTitle = document.getElementById('viewer-modal-title');
    const modalReportImage = document.getElementById('modal-report-image');
    const closeImageViewerBtn = document.getElementById('close-image-viewer-btn');

    const btnUploadPlaga = document.getElementById('btn-upload-plaga');
    const plagaImageInput = document.getElementById('plaga-image-input');
    const plagaPreviewContainer = document.getElementById('plaga-preview-container');
    const plagaPreview = document.getElementById('plaga-preview');
    const cancelPlagaBtn = document.getElementById('cancel-plaga-btn');
    const savePlagaBtn = document.getElementById('save-plaga-btn');

    // --- 3. LÓGICA DE DATOS ---
    function getProjectData(projectId) {
        return JSON.parse(localStorage.getItem(`project_${projectId}`)) || null;
    }
    function saveProjectData() {
        if (currentProject && currentProject.id) {
            localStorage.setItem(`project_${currentProject.id}`, JSON.stringify(currentProject));
        }
    }

    // --- 4. LÓGICA DE RENDERIZADO PRINCIPAL ---
    function renderProject() {
        if (!currentProject || !currentProject.id) {
            projectContainer.innerHTML = `
                <div style="background-color: #FFFFFF; border-radius: 12px; padding: 40px; text-align: center; color: #666;">
                    <h2>Proyecto no encontrado</h2>
                    <p>Asegúrate de que el proyecto exista y la URL sea correcta (ej: ...?id=1).</p>
                    <p>Puedes crear datos de prueba usando la consola del navegador.</p>
                    <a href="proyectos-lista.html" class="btn btn-primary" style="margin-top: 20px;">Volver a la lista</a>
                </div>`;
            return;
        }

        projectTitle.textContent = `Plan de Cultivo: ${currentProject.nombre}`;
        renderGeneralInfo();
        renderCropTabs();
    }
    
    function renderGeneralInfo() {
        const { info } = currentProject;
        projectGeneralInfo.querySelector('.info-grid').innerHTML = `
            <div>
                <div class="info-group"><label>Superficie Total:</label><p>${info.superficie}</p></div>
                <div class="info-group"><label>Ubicación:</label><p>${info.ubicacion}</p></div>
                <div class="info-group"><label>Contacto:</label><p>${info.contacto}</p></div>
                <div class="info-group"><label>Motivo de la Asesoría:</label><p>${info.motivo}</p></div>
            </div>
        `;
    }

    function renderCropTabs() {
        cropTabNavigation.innerHTML = '';
        cropTabContent.innerHTML = '';

        if (!currentProject.cultivos || currentProject.cultivos.length === 0) {
            cropTabContent.innerHTML = '<p>Este proyecto no tiene cultivos asignados.</p>';
            return;
        }

        currentProject.cultivos.forEach((cultivo, index) => {
            const normalized = cultivo.nombre.replace(/\s+/g, '-');

            // Crear botón de la pestaña
            const tabButton = document.createElement('button');
            tabButton.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            tabButton.dataset.target = `crop-tab-${normalized}`;
            tabButton.textContent = cultivo.nombre;
            cropTabNavigation.appendChild(tabButton);

            // Crear el panel de contenido de la pestaña
            const pane = document.createElement('div');
            pane.id = `crop-tab-${normalized}`;
            pane.className = `tab-pane ${index === 0 ? 'active' : ''}`;
            pane.innerHTML = renderCropDetails(cultivo);
            cropTabContent.appendChild(pane);
        });

        addTabListeners();
    }

    function renderCropDetails(cultivo) {
        let actividadesHTML = '';
        if (cultivo.actividades && cultivo.actividades.length > 0) {
            actividadesHTML = cultivo.actividades.map(act => {
                const estadoClass = `status-${act.estado.toLowerCase()}`;
                const evidenceHTML = act.evidenciaUrl ? `<a href="#" class="view-evidence" data-url="${act.evidenciaUrl}">Ver Imagen</a>` : 'Sin evidencia';
                return `
                    <div class="activity-card">
                        <div class="activity-header">
                            <h5>${act.titulo}</h5>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <div class="status-badge ${estadoClass}">${act.estado}</div>
                                <button class="btn btn-primary btn-edit" data-id="${act.id}">Editar</button>
                            </div>
                        </div>
                        <p>${act.descripcion}</p>
                        <div class="activity-dates">
                            <span><strong>Inicio:</strong> ${act.fechaInicio}</span>
                            <span><strong>Fin:</strong> ${act.fechaFin}</span>
                        </div>
                        <div class="evidence-box">
                            <span><strong>Evidencia (Comentario):</strong> ${act.comentarioCliente || 'Sin comentario'}</span>
                            ${evidenceHTML}
                        </div>
                    </div>`;
            }).join('');
        } else {
            actividadesHTML = '<p>Aún no hay actividades planificadas para este cultivo.</p>';
        }

        let plagaHTML = '';
        if (cultivo.plagaReporte) {
            plagaHTML = `
                <div class="info-group"><label>Fecha de reporte:</label><p>${cultivo.plagaReporte.fecha}</p></div>
                <div class="info-group"><label>Tipo de plaga:</label><p>${cultivo.plagaReporte.tipo}</p></div>
                <div class="info-group"><label>Descripción:</label><p>${cultivo.plagaReporte.descripcion}</p></div>
                <button class="btn btn-secondary view-plaga-image" data-url="${cultivo.plagaReporte.imagenUrl}">Ver Imagen del Reporte</button>`;
        } else {
            plagaHTML = `<button class="btn btn-primary btn-add-plaga" data-crop="${cultivo.nombre}">Crear Reporte de Plaga</button>`;
        }

        return `
            <h4>Actividades</h4>
            <div class="activities-list">${actividadesHTML}</div>
            
            <h4>Reporte de Plaga</h4>
            <div class="plaga-report-section">${plagaHTML}</div>
            
            <h4>Rendimiento</h4>
            <div class="rendimiento-section">
                <p>${cultivo.rendimiento || 'El agrónomo aún no ha añadido el rendimiento final.'}</p>
            </div>
        `;
    }
    
    function addTabListeners() {
        const buttons = cropTabNavigation.querySelectorAll('.tab-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const allBtns = cropTabNavigation.querySelectorAll('.tab-btn');
                const allPanes = cropTabContent.querySelectorAll('.tab-pane');
                allBtns.forEach(b => b.classList.remove('active'));
                allPanes.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const targetId = btn.dataset.target;
                const pane = document.getElementById(targetId);
                if (pane) pane.classList.add('active');
            });
        });
    }
    
    // --- 5. MANEJO DE EVENTOS ---
    document.querySelector('.main-content').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const viewEvidenceLink = e.target.closest('.view-evidence');
        const viewPlagaImageBtn = e.target.closest('.view-plaga-image');
        const addPlagaBtn = e.target.closest('.btn-add-plaga');

        if (editBtn) {
            currentActivityId = editBtn.dataset.id;
            // Buscar la actividad en todos los cultivos
            let activity = null;
            for (const cultivo of currentProject.cultivos) {
                activity = cultivo.actividades.find(a => a.id == currentActivityId);
                if (activity) break;
            }
            if (activity) {
                modalActivityTitle.textContent = activity.titulo;
                activityComment.value = activity.comentarioCliente || '';
                imagePreview.src = activity.evidenciaUrl || '';
                imagePreviewContainer.classList.toggle('hidden', !activity.evidenciaUrl);
                newActivityImageBase64 = null;
                activityImageInput.value = '';
                editActivityModal.classList.remove('hidden');
            }
        }
        if (viewEvidenceLink) { e.preventDefault(); viewerModalTitle.textContent = "Evidencia de Actividad"; modalReportImage.src = viewEvidenceLink.dataset.url; imageViewerModal.classList.remove('hidden'); }
        if (viewPlagaImageBtn) { viewerModalTitle.textContent = "Reporte de Plaga"; modalReportImage.src = viewPlagaImageBtn.dataset.url; imageViewerModal.classList.remove('hidden'); }
        if (addPlagaBtn) {
            plagaReportModal.dataset.cropName = addPlagaBtn.dataset.crop; // Guardar el nombre del cultivo
            plagaReportModal.classList.remove('hidden');
        }
    });

    saveActivityBtn.addEventListener('click', () => {
        let activityIndex = -1;
        let cultivoIndex = -1;
        for (let i = 0; i < currentProject.cultivos.length; i++) {
            const index = currentProject.cultivos[i].actividades.findIndex(a => a.id == currentActivityId);
            if (index !== -1) {
                activityIndex = index;
                cultivoIndex = i;
                break;
            }
        }

        if (cultivoIndex > -1 && activityIndex > -1) {
            currentProject.cultivos[cultivoIndex].actividades[activityIndex].comentarioCliente = activityComment.value;
            if (newActivityImageBase64) {
                currentProject.cultivos[cultivoIndex].actividades[activityIndex].evidenciaUrl = newActivityImageBase64;
            }
            if (currentProject.cultivos[cultivoIndex].actividades[activityIndex].evidenciaUrl || activityComment.value.trim() !== "") {
                currentProject.cultivos[cultivoIndex].actividades[activityIndex].estado = 'Completada';
            }
            saveProjectData();
            renderCropTabs(); // Recargar solo las pestañas para actualizar
        }
        editActivityModal.classList.add('hidden');
        successModal.classList.remove('hidden');
        setTimeout(() => successModal.classList.add('hidden'), 2000);
    });
    
    uploadImageButton.addEventListener('click', () => activityImageInput.click());
    activityImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => { newActivityImageBase64 = event.target.result; imagePreview.src = newActivityImageBase64; imagePreviewContainer.classList.remove('hidden'); };
        reader.readAsDataURL(file);
    });

    btnUploadPlaga.addEventListener('click', () => plagaImageInput.click());
    plagaImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => { newPlagaImageBase64 = event.target.result; plagaPreview.src = newPlagaImageBase64; plagaPreviewContainer.classList.remove('hidden'); };
        reader.readAsDataURL(file);
    });

    savePlagaBtn.addEventListener('click', () => {
        const cropName = plagaReportModal.dataset.cropName;
        const cultivo = currentProject.cultivos.find(c => c.nombre === cropName);
        if (cultivo) {
            cultivo.plagaReporte = {
                fecha: document.getElementById('plaga-fecha').value,
                tipo: document.getElementById('plaga-tipo').value,
                descripcion: document.getElementById('plaga-descripcion').value,
                imagenUrl: newPlagaImageBase64
            };
            saveProjectData();
            renderCropTabs(); // Recargar para mostrar el nuevo reporte
            plagaReportModal.classList.add('hidden');
            successModal.classList.remove('hidden');
            setTimeout(() => successModal.classList.add('hidden'), 2000);
        }
    });

    cancelEditBtn.addEventListener('click', () => editActivityModal.classList.add('hidden'));
    closeImageViewerBtn.addEventListener('click', () => imageViewerModal.classList.add('hidden'));
    cancelPlagaBtn.addEventListener('click', () => plagaReportModal.classList.add('hidden'));

    // --- 6. INICIALIZACIÓN ---
    welcomeMessage.textContent = `Bienvenido, ${currentUser.nombre}`;
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (projectId) {
        currentProject = getProjectData(projectId);
        renderProject();
    } else {
        window.location.href = 'proyectos-lista.html';
    }
    
    projectContainer.classList.remove('content-hidden');
});