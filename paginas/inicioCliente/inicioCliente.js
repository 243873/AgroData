document.addEventListener('DOMContentLoaded', async () => {
    // 1. CONFIGURACIÓN INICIAL Y VERIFICACIÓN DE SESIÓN
    const API_BASE_URL = "http://localhost:8000";

    const userId = sessionStorage.getItem('usuarioId');
    const userRol = sessionStorage.getItem('usuarioRol');
    const authToken = sessionStorage.getItem('authToken'); // 👈 NUEVO: Obtener el Token

    // ===== Verificar sesión activa (incluyendo el token) =====
    if (!userId || !userRol || !authToken) { // 👈 CRÍTICO: Verificar la existencia del token
        console.error("No se encontró ID, Rol o Token de usuario. Redirigiendo a login.");
        sessionStorage.clear(); // Limpiar sesión incompleta
        window.location.href = '/index.html';
        return;
    }

    let currentUser = null;

    // 2. RECUPERAR DATOS COMPLETOS DEL USUARIO (Usando GET /perfil/{id})
    try {
        const response = await fetch(`${API_BASE_URL}/perfil/${userId}`, {
            // 👈 CRÍTICO: Añadir el header Authorization para JWT
            headers: {
                'Authorization': `Bearer ${authToken}` 
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            currentUser.id = currentUser.idUsuario || userId; 
        } else {
            // Si la API rechaza el token (ej. 403 Forbidden o 401 Unauthorized)
            console.error('API Error al cargar perfil:', response.status);
            sessionStorage.clear(); 
            window.location.href = '/index.html';
            return;
        }

    } catch (error) {
        console.error('Error al conectar con la API para cargar tu perfil:', error);
        alert('Error al conectar con la API para cargar tu perfil.');
        sessionStorage.clear();
        window.location.href = '/index.html';
        return;
    }

    // El resto de la inicialización del DOM se mantiene
    // ===== Elementos globales (DOM) =====
    const initialView = document.getElementById('initial-view');
    const asesoriaFormView = document.getElementById('asesoria-form-view');
    const talleresFlowView = document.getElementById('talleres-flow-view');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const successModal = document.getElementById('successModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalAceptar = document.getElementById('modalAceptar');

    welcomeMessage.textContent = `Bienvenido, ${currentUser.nombre}`; 

    // Funciones de utilidad (se mantienen)
    function showView(viewToShow) {
        [initialView, asesoriaFormView, talleresFlowView].forEach(v => {
            if (v) v.classList.add('hidden');
        });
        if (viewToShow) viewToShow.classList.remove('hidden');
    }
    
    // limpiar notificaciones con botón "Descartar" si existen (se mantienen)
    document.querySelectorAll('.btn-discard').forEach(button => {
        button.addEventListener('click', (e) => {
            const item = e.target.closest('.notification-item');
            if (item) item.remove();
        });
    });

    // ===============================================
    // ======= ASESORÍAS (INTEGRACIÓN FETCH) =========
    // ===============================================
    
    const showAsesoriaFormBtn = document.getElementById('show-asesoria-form');
    const asesoriaSelectionView = document.querySelector('#asesoria-form-view .asesoria-selection-view');
    const asesoriaFormDetailsView = document.querySelector('#asesoria-form-view .asesoria-form-details-view');
    const continueToAsesoriaFormBtn = document.querySelector('#asesoria-form-view .continue-to-form');
    const backToAsesoriaSelectionBtn = document.querySelector('#asesoria-form-view .back-to-selection');
    const cancelAsesoriaBtn = document.querySelector('#asesoria-form-view .cancel-flow');
    const asesoriaForm = document.querySelector('#asesoria-form-view .asesoriaForm');

    let asesoriaSelectedCultivos = [];
    let asesoriaFormDataStore = {};

    // Lógica de Vistas (se mantiene)
    if (showAsesoriaFormBtn) {
        showAsesoriaFormBtn.addEventListener('click', () => {
            showView(asesoriaFormView);
            // reset vistas internas
            if (asesoriaSelectionView) {
                asesoriaSelectionView.classList.remove('hidden');
            }
            if (asesoriaFormDetailsView) {
                asesoriaFormDetailsView.classList.add('hidden');
            }
        });
    }

    if (cancelAsesoriaBtn) {
        cancelAsesoriaBtn.addEventListener('click', () => showView(initialView));
    }

    if (continueToAsesoriaFormBtn) {
        continueToAsesoriaFormBtn.addEventListener('click', () => {
            const checkboxes = asesoriaSelectionView.querySelectorAll('input[name="cultivo-select"]:checked');
            asesoriaSelectedCultivos = Array.from(checkboxes).map(cb => cb.value);
            if (asesoriaSelectedCultivos.length === 0 || asesoriaSelectedCultivos.length > 3) {
                alert('Debes seleccionar entre 1 y 3 cultivos.');
                return;
            }
            generateAsesoriaFormTabs();
            asesoriaSelectionView.classList.add('hidden');
            asesoriaFormDetailsView.classList.remove('hidden');
        });
    }

    if (backToAsesoriaSelectionBtn) {
        backToAsesoriaSelectionBtn.addEventListener('click', () => {
            // limpiar
            asesoriaFormDetailsView.classList.add('hidden');
            asesoriaSelectionView.classList.remove('hidden');
            const tabNav = asesoriaFormDetailsView.querySelector('.tab-nav');
            const tabContent = asesoriaForm.querySelector('.tab-content');
            if (tabNav) tabNav.innerHTML = '';
            if (tabContent) tabContent.innerHTML = '';
            asesoriaFormDataStore = {};
        });
    }

    function generateAsesoriaFormTabs() {
        const tabNav = asesoriaFormDetailsView.querySelector('.tab-nav');
        const tabContent = asesoriaForm.querySelector('.tab-content');
        tabNav.innerHTML = '';
        tabContent.innerHTML = '';
        asesoriaFormDataStore = {};

        asesoriaSelectedCultivos.forEach((cultivo, index) => {
            const normalized = cultivo.replace(/\s+/g, '-');

            // 1. Crear el panel de contenido primero
            const pane = document.createElement('div');
            pane.id = `asesoria-tab-${normalized}`;
            pane.className = `tab-pane ${index === 0 ? 'active' : ''}`;
            pane.innerHTML = createAsesoriaFormFields(normalized, cultivo);
            tabContent.appendChild(pane);

            // 2. Crear el botón de la pestaña
            const tabButton = document.createElement('button');
            tabButton.type = 'button';
            tabButton.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            tabButton.textContent = cultivo;
            
            // 3. Asignar el evento click directamente al botón
            tabButton.addEventListener('click', () => {
                // Desactivar todos los botones y paneles
                tabNav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                tabContent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Activar el botón y panel actuales
                tabButton.classList.add('active');
                pane.classList.add('active');
            });

            tabNav.appendChild(tabButton);

            // inicializar store
            asesoriaFormDataStore[cultivo] = { contacto: currentUser.telefono || '' };
        });

        addAsesoriaInputListeners();
    }

    function createAsesoriaFormFields(normalized, cultivoLabel) {
        // normalized usado en IDs, cultivoLabel contenido legible
        return `
            <div class="form-group">
                <label for="superficie-${normalized}">Superficie (Hectáreas):</label>
                <input type="text" id="superficie-${normalized}" placeholder="Ej: 5.5" required data-field="superficie">
            </div>
            <div class="form-group">
                <label for="ubicacion-${normalized}">Ubicación del Terreno:</label>
                <input type="text" id="ubicacion-${normalized}" placeholder="Ej: San Cristóbal, Chiapas" required data-field="ubicacion">
            </div>
            <div class="form-group">
                <label>¿Utiliza maquinaria?</label>
                <div class="options-group">
                    <label class="option-control"><input type="radio" name="maquinaria-${normalized}" value="Si"><span class="visual"></span> Sí</label>
                    <label class="option-control"><input type="radio" name="maquinaria-${normalized}" value="No" checked><span class="visual"></span> No</label>
                </div>
            </div>
            <div id="maquinariaInfo-${normalized}" class="form-group hidden">
                <label for="maquinariaNombre-${normalized}">Nombre la maquinaria:</label>
                <textarea id="maquinariaNombre-${normalized}" data-field="maquinariaDetalle"></textarea>
            </div>
            <div class="form-group">
                <label>¿Tiene alguna plaga registrada?</label>
                <div class="options-group">
                    <label class="option-control"><input type="radio" name="plaga-${normalized}" value="Si"><span class="visual"></span> Sí</label>
                    <label class="option-control"><input type="radio" name="plaga-${normalized}" value="No" checked><span class="visual"></span> No</label>
                </div>
            </div>
            <div id="plagaInfo-${normalized}" class="form-group hidden">
                <label for="plagaDescripcion-${normalized}">Descripción de la plaga:</label>
                <textarea id="plagaDescripcion-${normalized}" data-field="plagaDetalle"></textarea>
            </div>
            <div class="form-group">
                <label for="motivo-${normalized}">Motivo de la asesoría:</label>
                <textarea id="motivo-${normalized}" required data-field="motivo"></textarea>
            </div>
        `;
    }

    function addAsesoriaInputListeners() {
        const tabContent = asesoriaForm.querySelector('.tab-content');
        // input listener
        tabContent.addEventListener('input', (e) => {
            const pane = e.target.closest('.tab-pane');
            if (!pane) return;
            const paneId = pane.id; // e.g. asesoria-tab-Papa
            const cultivo = paneId.substring('asesoria-tab-'.length).replace(/-/g, ' ');
            const field = e.target.dataset.field;
            if (field) {
                if (!asesoriaFormDataStore[cultivo]) asesoriaFormDataStore[cultivo] = {};
                asesoriaFormDataStore[cultivo][field] = e.target.value;
            }
        });

        // change listener (radio)
        tabContent.addEventListener('change', (e) => {
            const pane = e.target.closest('.tab-pane');
            if (!pane) return;
            const paneId = pane.id;
            const cultivo = paneId.substring('asesoria-tab-'.length).replace(/-/g, ' ');
            
            // Lógica de Maquinaria
            if (e.target.name && e.target.name.startsWith('maquinaria-')) {
                const normalized = e.target.name.substring('maquinaria-'.length);
                const maquinariaInfo = pane.querySelector(`#maquinariaInfo-${normalized}`);
                if (maquinariaInfo) maquinariaInfo.classList.toggle('hidden', e.target.value !== 'Si');
                if (!asesoriaFormDataStore[cultivo]) asesoriaFormDataStore[cultivo] = {};
                asesoriaFormDataStore[cultivo]['utilizaMaquinaria'] = e.target.value;
            }
            // Lógica de Plaga
            if (e.target.name && e.target.name.startsWith('plaga-')) {
                const normalized = e.target.name.substring('plaga-'.length);
                const plagaInfo = pane.querySelector(`#plagaInfo-${normalized}`);
                if (plagaInfo) plagaInfo.classList.toggle('hidden', e.target.value !== 'Si');
                if (!asesoriaFormDataStore[cultivo]) asesoriaFormDataStore[cultivo] = {};
                asesoriaFormDataStore[cultivo]['tienePlaga'] = e.target.value;
            }
        });
    }

    function validateAsesoriaForms() {
        let allValid = true;
        const panes = asesoriaForm.querySelectorAll('.tab-pane');

        // Limpiar errores previos
        asesoriaForm.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

        panes.forEach(pane => {
            const paneId = pane.id;
            const cultivo = paneId.substring('asesoria-tab-'.length).replace(/-/g, ' ');

            const superficieInput = pane.querySelector(`#superficie-${cultivo.replace(/\s+/g, '-')}`);
            const ubicacionInput = pane.querySelector(`#ubicacion-${cultivo.replace(/\s+/g, '-')}`);
            const motivoInput = pane.querySelector(`#motivo-${cultivo.replace(/\s+/g, '-')}`);

            if (!superficieInput || !superficieInput.value.trim()) {
                superficieInput.classList.add('input-error');
                allValid = false;
            }
            if (!ubicacionInput || !ubicacionInput.value.trim()) {
                ubicacionInput.classList.add('input-error');
                allValid = false;
            }
            if (!motivoInput || !motivoInput.value.trim()) {
                motivoInput.classList.add('input-error');
                allValid = false;
            }
        });

        if (!allValid) {
            alert('Por favor, completa todos los campos obligatorios (Superficie, Ubicación y Motivo) en todas las pestañas de cultivo.');
        }
        
        return allValid;
    }

    if (asesoriaForm) {
        asesoriaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateAsesoriaForms()) {
                return;
            }

            // 1. Preparar datos para la API
            const solicitudAPIS = {
                userId: currentUser.id,
                fechaSolicitud: new Date().toISOString(),
                estado: 'Pendiente', 
                cultivos: asesoriaSelectedCultivos.map(cultivo => ({
                    nombre: cultivo,
                    superficie: parseFloat(asesoriaFormDataStore[cultivo].superficie || 0),
                    ubicacion: asesoriaFormDataStore[cultivo].ubicacion,
                    motivo: asesoriaFormDataStore[cultivo].motivo,
                    utilizaMaquinaria: asesoriaFormDataStore[cultivo]['utilizaMaquinaria'] === 'Si',
                    maquinariaDetalle: asesoriaFormDataStore[cultivo]['maquinariaDetalle'] || '',
                    tienePlaga: asesoriaFormDataStore[cultivo]['tienePlaga'] === 'Si',
                    plagaDetalle: asesoriaFormDataStore[cultivo]['plagaDetalle'] || '',
                    // ... otros campos que la API pueda esperar
                }))
            };

            // 2. Ejecutar la llamada a la API (POST /solicitudasesoria)
            try {
                const response = await fetch(`${API_BASE_URL}/solicitudasesoria`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 👈 CRÍTICO: Usar Token JWT para autorización
                        'Authorization': `Bearer ${authToken}` 
                        // Se remueven 'rol' y 'confirmado' ya que el middleware JWT los maneja.
                    },
                    body: JSON.stringify(solicitudAPIS)
                });

                if (response.ok || response.status === 201) { // 201 Created
                    modalTitle.textContent = '¡Solicitud de Asesoría Enviada!';
                    modalMessage.textContent = 'Tu solicitud ha sido recibida. Un agrónomo se pondrá en contacto contigo.';
                } else {
                    const errorText = await response.text();
                    modalTitle.textContent = 'Error al Enviar Solicitud';
                    modalMessage.textContent = `Hubo un error en la API: ${errorText || response.statusText}.`;
                }

            } catch (error) {
                console.error('Error de red al enviar solicitud de asesoría:', error);
                modalTitle.textContent = 'Error de Conexión';
                modalMessage.textContent = 'No se pudo conectar con el servidor. Verifica que la API esté corriendo.';
            }

            // Mostrar modal de resultado
            if(successModal) successModal.classList.remove('hidden');
        });
    }


    // ===========================================
    // ======= TALLERES (INTEGRACIÓN FETCH) ==========
    // ===========================================

    const showTalleresFlowBtn = document.getElementById('show-talleres-flow');
    const tallerSelectionView = document.getElementById('taller-selection-view');
    const tallerFormView = document.getElementById('taller-form-view');
    const talleresListContainer = document.getElementById('talleres-list-container');
    const continueToTallerFormBtn = document.getElementById('continueToTallerFormBtn');
    const btnCancelTaller = document.getElementById('btnCancelTaller');
    const btnBackToTallerSelection = document.getElementById('btnBackToTallerSelection');
    const tallerSolicitudForm = document.getElementById('tallerSolicitudForm');

    let selectedTalleres = [];

    // CATÁLOGO CORREGIDO: IDs numéricos para coincidir con la DB y evitar error de tipo
    const talleresDisponibles = [
        { id: 1, nombre: 'Manejo de Suelo', descripcion: 'Análisis del suelo, condiciones edafoclimáticas.', costo: 25000 },
        { id: 2, nombre: 'Control de Plagas', descripcion: 'Métodos de muestreo y control.', costo: 8000 },
        { id: 3, nombre: 'Fertilización', descripcion: 'Identificación de requerimientos nutricionales.', costo: 15000 },
        { id: 4, nombre: 'Ecotecnias', descripcion: 'Baños secos, cisternas y ecotecnias.', costo: 40000 }
    ];
    // Se corrige el campo 'nombre' repetido a 'descripcion' en el catálogo de talleres.

    function renderTalleresList() {
        if (!talleresListContainer) return;

        talleresListContainer.innerHTML = '';
        talleresDisponibles.forEach(taller => {
            const wrapper = document.createElement('div');
            wrapper.className = 'taller-card';
            wrapper.innerHTML = `
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="taller-${taller.id}" data-id="${taller.id}" class="taller-checkbox">
                    <label for="taller-${taller.id}"></label>
                </div>
                <div class="taller-info">
                    <h4>${taller.nombre}</h4>
                    <p>${taller.descripcion}</p>
                    <span>Costo: $${taller.costo.toLocaleString()}</span>
                </div>
            `;
            talleresListContainer.appendChild(wrapper);
        });
    }
    // Lógica para mostrar listas de talleres (se mantiene)
    function openTalleresFlow() {
        renderTalleresList();
        showView(talleresFlowView);
        // asegurar que vista selección esté visible
        if (tallerSelectionView) tallerSelectionView.classList.remove('hidden');
        if (tallerFormView) tallerFormView.classList.add('hidden');
    }

    if (showTalleresFlowBtn) {
        showTalleresFlowBtn.addEventListener('click', openTalleresFlow);
    }

    if (btnCancelTaller) {
        btnCancelTaller.addEventListener('click', () => showView(initialView));
    }

    if (continueToTallerFormBtn) {
        continueToTallerFormBtn.addEventListener('click', () => {
            const ids = Array.from(document.querySelectorAll('.taller-checkbox:checked')).map(cb => cb.dataset.id);
            if (ids.length === 0) {
                alert('Por favor, selecciona al menos un taller.');
                return;
            }

            // Aseguramos que los IDs sean números al filtrar
            selectedTalleres = talleresDisponibles.filter(t => ids.includes(String(t.id)));

            // mostrar resumen
            const listaContainer = document.getElementById('talleres-seleccionados-lista');
            const montoTotalEl = document.getElementById('montoTotal');
            let montoTotal = 0;
            if (listaContainer) listaContainer.innerHTML = '';

            selectedTalleres.forEach(taller => {
                if (listaContainer) listaContainer.innerHTML += `<div class="taller-resumen-item">✔️ ${taller.nombre}</div>`;
                montoTotal += taller.costo;
            });

            if (montoTotalEl) montoTotalEl.textContent = `Monto Total: $${montoTotal.toLocaleString()}`;

            // cambiar vistas
            if (tallerSelectionView) tallerSelectionView.classList.add('hidden');
            if (tallerFormView) tallerFormView.classList.remove('hidden');
        });
    }

    if (btnBackToTallerSelection) {
        btnBackToTallerSelection.addEventListener('click', () => {
            if (tallerFormView) tallerFormView.classList.add('hidden');
            if (tallerSelectionView) tallerSelectionView.classList.remove('hidden');
        });
    }

    if (tallerSolicitudForm) {
        tallerSolicitudForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // --- REFERENCIAS DE INPUTS ---
            const fechaInput = document.getElementById('fecha');
            const ubicacionInput = document.getElementById('ubicacion');
            const comentariosInput = document.getElementById('comentarios'); // Asumimos este ID existe

            // 1. Validación local (se mantiene)
            if (!fechaInput.value || !ubicacionInput.value) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            if (selectedTalleres.length === 0) {
                alert('Debe seleccionar al menos un taller.');
                return;
            }

            // Determinar el ID numérico del primer taller (el Repositorio solo puede manejar uno)
            const idTallerNumerico = parseInt(selectedTalleres[0].id); 
            
            // 2. Preparar datos para la API (se mantiene)
            const solicitudAPIS = {
                // IDs Y DATOS CLAVE
                idAgricultor: parseInt(currentUser.id), 
                idTaller: idTallerNumerico, 
                
                // DATOS DEL FORMULARIO
                ubicacion: ubicacionInput.value,
                comentario: comentariosInput ? comentariosInput.value : '', 
                cantidadPersonas: 1, 
                
                // FECHAS (Formato String para que Jackson intente parsear a Date)
                fechaAplicarTaller: fechaInput.value, 
                fechaSolicitud: new Date().toISOString().split('T')[0], 
                
                // CAMPOS REQUERIDOS POR EL MODELO JAVA 
                idEstado: 1, 
                estadoPagoImagen: null, 
                fechaFin: null, 
            };

            // 3. Ejecutar la llamada a la API (POST /solicitudtaller)
            try {
                const response = await fetch(`${API_BASE_URL}/solicitudtaller`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 👈 CRÍTICO: Usar Token JWT para autorización
                        'Authorization': `Bearer ${authToken}` 
                        // Se remueven 'rol' y 'confirmado' ya que el middleware JWT los maneja.
                    },
                    body: JSON.stringify(solicitudAPIS)
                });

                if (response.ok || response.status === 201) { // 201 Created
                    modalTitle.textContent = '¡Solicitud de Taller Enviada!';
                    modalMessage.textContent = 'Hemos recibido tu solicitud.';
                } else {
                    const errorText = await response.text();
                    modalTitle.textContent = 'Error al Enviar Solicitud';
                    modalMessage.textContent = `Hubo un error en la API: ${errorText || response.statusText}.`;
                }

            } catch (error) {
                console.error('Error de red al enviar solicitud de taller:', error);
                modalTitle.textContent = 'Error de Conexión';
                modalMessage.textContent = 'No se pudo conectar con el servidor. Verifica que la API esté corriendo.';
            }

            // Mostrar modal de resultado
            if(successModal) successModal.classList.remove('hidden');
        });
    }

    // Lógica del Modal y Navegación (se mantiene)
    if (modalAceptar) {
        modalAceptar.addEventListener('click', () => {
            if(successModal) successModal.classList.add('hidden');
            showView(initialView);
        });
    }

    // ===== Volver a inicio desde nav =====
    const navInicioLink = document.getElementById('nav-link-inicio');
    if (navInicioLink) {
        navInicioLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(initialView);
        });
    }

    // iniciar mostrando la vista inicial
    showView(initialView);
});