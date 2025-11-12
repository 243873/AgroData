document.addEventListener('DOMContentLoaded', async () => {
    // 1. CONFIGURACIÓN INICIAL Y VERIFICACIÓN DE SESIÓN
    
    const API_BASE_URL = "http://localhost:8000"; 

    const userId = localStorage.getItem('usuarioId');
    const userRol = localStorage.getItem('usuarioRol');
    const authToken = localStorage.getItem('authToken');

    console.log(userId, userRol, authToken);
    if (!userId || !userRol || !authToken) {
        console.error("No se encontró ID, Rol o Token de usuario. Redirigiendo a login.");
        sessionStorage.clear();
        window.location.href = '/index.html';
        return;
    }

    let currentUser = null;
    let catalogoCultivos = [];
    let catalogoTalleres = [];
    let catalogoRiego = [];

    async function fetchWithCors(url, options = {}) {
        // Preparar headers por defecto
        const defaultHeaders = {
            'Authorization': `Bearer ${authToken}`,
            'confirmado': 'true'
        };

        // Si options.headers existe, fusionarlo con los headers por defecto
        let finalHeaders = defaultHeaders;
        if (options.headers && typeof options.headers === 'object') {
            finalHeaders = {
                ...defaultHeaders,
                ...options.headers
            };
        }

        // Crear las opciones finales
        const finalOptions = {
            ...options,
            headers: finalHeaders
        };

        console.log("Fetch request:", {
            url: url,
            method: finalOptions.method || 'GET',
            headers: finalHeaders
        });

        const response = await fetch(url, finalOptions);
        return response;
    }

    // 2. RECUPERAR DATOS (USUARIO Y CATÁLOGOS)
    try {
        
        console.log("Iniciando carga de datos...");
        
        // ⭐ Cargar perfil de usuario
        const responseUser = await fetch(`${API_BASE_URL}/perfil/${userId}`, {  
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            }
        });

        console.log("Response de perfil:", responseUser.status, responseUser.statusText);

        if (!responseUser.ok) {
            throw new Error(`Error de API al cargar perfil: ${responseUser.status} ${responseUser.statusText}`);
        }
        
        currentUser = await responseUser.json();
        currentUser.id = currentUser.idUsuario || userId;

        console.log("✓ Perfil de usuario cargado:", currentUser);

        // === CARGAR CATÁLOGOS ===
        await loadCatalogos();

    } catch (error) {
        console.error('❌ Error en la inicialización:', error);
        //alert('Error al conectar con la API para cargar tus datos. Revisa la consola.\n\nError: ' + error.message);
        sessionStorage.clear();
        window.location.href = '/index.html';
        return;
    }

    // --- FUNCIÓN PARA CARGAR CATÁLOGOS ---
    async function loadCatalogos() {
        try {
            console.log("Cargando catálogos...");

            // Cargar Cultivos (API pública)
            try {
                const resCultivos = await fetch(`${API_BASE_URL}/catalogo/cultivos`);
                if (resCultivos.ok) {
                    catalogoCultivos = await resCultivos.json();
                    console.log("✓ Cultivos cargados:", catalogoCultivos.length);
                    renderCultivosList();
                } else {
                    console.warn("No se pudieron cargar los cultivos. Status:", resCultivos.status);
                }
            } catch (err) {
                console.warn("Error al cargar cultivos:", err);
            }

            // Cargar Talleres (API protegida)
            try {
                const resTalleres = await fetch(`${API_BASE_URL}/talleres`, {
                    method: 'GET',
                    headers: {'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`}
                });
                console.log(resTalleres.json());
                
                if (resTalleres.ok) {
                    catalogoTalleres = await resTalleres.json();
                    console.log("✓ Talleres cargados:", catalogoTalleres.length);
                } else {
                    console.warn("No se pudieron cargar los talleres. Status:", resTalleres.status);
                }
            } catch (err) {
                console.warn("Error al cargar talleres:", err);
            }

            // Cargar Tipos de Riego (API pública)
            try {
                const resRiego = await fetch(`${API_BASE_URL}/catalogo/tipoterreno`);
                if (resRiego.ok) {
                    catalogoRiego = await resRiego.json();
                    console.log("✓ Tipos de riego cargados:", catalogoRiego.length);
                } else {
                    console.warn("No se pudieron cargar los tipos de riego. Status:", resRiego.status);
                }
            } catch (err) {
                console.warn("Error al cargar tipos de riego:", err);
            }
            
        } catch (err) {
            console.error("Error general cargando catálogos:", err);
        }
    }

    /**
     * Renderiza la lista de cultivos para seleccionar en Asesorías
     */
    function renderCultivosList() {
        const container = document.querySelector('#asesoria-form-view .asesoria-selection-view .cultivos-list-container');
        if (!container) {
            console.warn("No se encontró '.cultivos-list-container' para renderizar cultivos.");
            return;
        }
        container.innerHTML = '';
        
        catalogoCultivos.forEach(cultivo => {
            container.innerHTML += `
                <div class="cultivo-option">
                    <input type="checkbox" name="cultivo-select" id="cultivo-${cultivo.idCultivo}" value="${cultivo.idCultivo}" data-nombre="${cultivo.nombreCultivo}">
                    <label for="cultivo-${cultivo.idCultivo}">${cultivo.nombreCultivo}</label>
                </div>
            `;
        });
    }

    // 3. ELEMENTOS DEL DOM Y LÓGICA DE VISTAS
    const initialView = document.getElementById('initial-view');
    const asesoriaFormView = document.getElementById('asesoria-form-view');
    const talleresFlowView = document.getElementById('talleres-flow-view');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const successModal = document.getElementById('successModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalAceptar = document.getElementById('modalAceptar');

    if (welcomeMessage && currentUser) {
        welcomeMessage.textContent = `Bienvenido, ${currentUser.nombre || 'Usuario'}`;
    }

    function showView(viewToShow) {
        [initialView, asesoriaFormView, talleresFlowView].forEach(v => {
            if (v) v.classList.add('hidden');
        });
        if (viewToShow) viewToShow.classList.remove('hidden');
    }

    document.querySelectorAll('.btn-discard').forEach(button => {
        button.addEventListener('click', (e) => {
            const item = e.target.closest('.notification-item');
            if (item) item.remove();
        });
    });

    // ===============================================
    // ======= ASESORÍAS (LÓGICA ACTUALIZADA) =========
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

    if (showAsesoriaFormBtn) {
        showAsesoriaFormBtn.addEventListener('click', () => {
            showView(asesoriaFormView);
            if (asesoriaSelectionView) asesoriaSelectionView.classList.remove('hidden');
            if (asesoriaFormDetailsView) asesoriaFormDetailsView.classList.add('hidden');
            renderCultivosList();
        });
    }

    if (cancelAsesoriaBtn) {
        cancelAsesoriaBtn.addEventListener('click', () => showView(initialView));
    }

    if (continueToAsesoriaFormBtn) {
        continueToAsesoriaFormBtn.addEventListener('click', () => {
            const checkboxes = asesoriaSelectionView.querySelectorAll('input[name="cultivo-select"]:checked');
            
            asesoriaSelectedCultivos = Array.from(checkboxes).map(cb => ({
                id: parseInt(cb.value),
                nombre: cb.dataset.nombre 
            }));

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
            const normalized = cultivo.nombre.replace(/\s+/g, '-');
            const cultivoKey = cultivo.nombre;

            const pane = document.createElement('div');
            pane.id = `asesoria-tab-${normalized}`;
            pane.className = `tab-pane ${index === 0 ? 'active' : ''}`;
            
            pane.innerHTML = createAsesoriaFormFields(normalized, cultivoKey);
            tabContent.appendChild(pane);

            const tabButton = document.createElement('button');
            tabButton.type = 'button';
            tabButton.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            tabButton.textContent = cultivo.nombre;
            
            tabButton.addEventListener('click', () => {
                tabNav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                tabContent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                tabButton.classList.add('active');
                pane.classList.add('active');
            });

            tabNav.appendChild(tabButton);

            asesoriaFormDataStore[cultivoKey] = { contacto: currentUser.telefono || '' };
        });

        addAsesoriaInputListeners();
    }

    function createAsesoriaFormFields(normalized, cultivoLabel) {
        const riegoOptions = catalogoRiego.map(riego => 
            `<option value="${riego.idRiego}">${riego.nombreRiego}</option>`
        ).join('');

        return `
            <div class="form-group">
                <label for="superficie-${normalized}">Superficie (Hectáreas):</label>
                <input type="text" id="superficie-${normalized}" placeholder="Ej: 5.5" required data-field="superficie" data-key="${cultivoLabel}">
            </div>
            <div class="form-group">
                <label for="ubicacion-${normalized}">Ubicación del Terreno:</label>
                <input type="text" id="ubicacion-${normalized}" placeholder="Ej: San Cristóbal, Chiapas" required data-field="ubicacion" data-key="${cultivoLabel}">
            </div>
            
            <div class="form-group">
                <label for="tipoRiego-${normalized}">Tipo de Riego:</label>
                <select id="tipoRiego-${normalized}" required data-field="tipoRiego" data-key="${cultivoLabel}">
                    <option value="">Seleccione...</option>
                    ${riegoOptions}
                </select>
            </div>

            <div class="form-group">
                <label>¿Utiliza maquinaria?</label>
                <div class="options-group">
                    <label class="option-control"><input type="radio" name="maquinaria-${normalized}" value="Si" data-key="${cultivoLabel}"><span class="visual"></span> Sí</label>
                    <label class="option-control"><input type="radio" name="maquinaria-${normalized}" value="No" checked data-key="${cultivoLabel}"><span class="visual"></span> No</label>
                </div>
            </div>
            <div id="maquinariaInfo-${normalized}" class="form-group hidden">
                <label for="maquinariaNombre-${normalized}">Nombre de la maquinaria:</label>
                <textarea id="maquinariaNombre-${normalized}" data-field="maquinariaDetalle" data-key="${cultivoLabel}"></textarea>
            </div>
            <div class="form-group">
                <label>¿Tiene alguna plaga registrada?</label>
                <div class="options-group">
                    <label class="option-control"><input type="radio" name="plaga-${normalized}" value="Si" data-key="${cultivoLabel}"><span class="visual"></span> Sí</label>
                    <label class="option-control"><input type="radio" name="plaga-${normalized}" value="No" checked data-key="${cultivoLabel}"><span class="visual"></span> No</label>
                </div>
            </div>
            <div id="plagaInfo-${normalized}" class="form-group hidden">
                <label for="plagaDescripcion-${normalized}">Descripción de la plaga:</label>
                <textarea id="plagaDescripcion-${normalized}" data-field="plagaDetalle" data-key="${cultivoLabel}"></textarea>
            </div>
            <div class="form-group">
                <label for="motivo-${normalized}">Motivo de la asesoría:</label>
                <textarea id="motivo-${normalized}" required data-field="motivo" data-key="${cultivoLabel}"></textarea>
            </div>
        `;
    }

    function addAsesoriaInputListeners() {
        const tabContent = asesoriaForm.querySelector('.tab-content');
        
        tabContent.addEventListener('input', (e) => {
            const key = e.target.dataset.key;
            const field = e.target.dataset.field;
            if (key && field) {
                if (!asesoriaFormDataStore[key]) asesoriaFormDataStore[key] = {};
                asesoriaFormDataStore[key][field] = e.target.value;
            }
        });

        tabContent.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            const pane = e.target.closest('.tab-pane');
            if (!pane || !key) return;

            if (e.target.name && e.target.name.startsWith('maquinaria-')) {
                const normalized = e.target.name.substring('maquinaria-'.length);
                const maquinariaInfo = pane.querySelector(`#maquinariaInfo-${normalized}`);
                if (maquinariaInfo) maquinariaInfo.classList.toggle('hidden', e.target.value !== 'Si');
                if (!asesoriaFormDataStore[key]) asesoriaFormDataStore[key] = {};
                asesoriaFormDataStore[key]['utilizaMaquinaria'] = e.target.value;
            }
            if (e.target.name && e.target.name.startsWith('plaga-')) {
                const normalized = e.target.name.substring('plaga-'.length);
                const plagaInfo = pane.querySelector(`#plagaInfo-${normalized}`);
                if (plagaInfo) plagaInfo.classList.toggle('hidden', e.target.value !== 'Si');
                if (!asesoriaFormDataStore[key]) asesoriaFormDataStore[key] = {};
                asesoriaFormDataStore[key]['tienePlaga'] = e.target.value;
            }
            if (e.target.dataset.field === 'tipoRiego') {
                if (!asesoriaFormDataStore[key]) asesoriaFormDataStore[key] = {};
                asesoriaFormDataStore[key]['tipoRiego'] = e.target.value;
            }
        });
    }

    function validateAsesoriaForms() {
        let allValid = true;
        const panes = asesoriaForm.querySelectorAll('.tab-pane');
        asesoriaForm.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

        panes.forEach(pane => {
            const normalizedId = pane.id.substring('asesoria-tab-'.length);

            const superficieInput = pane.querySelector(`#superficie-${normalizedId}`);
            const ubicacionInput = pane.querySelector(`#ubicacion-${normalizedId}`);
            const motivoInput = pane.querySelector(`#motivo-${normalizedId}`);
            const riegoInput = pane.querySelector(`#tipoRiego-${normalizedId}`);

            if (!superficieInput || !superficieInput.value.trim() || isNaN(parseFloat(superficieInput.value))) {
                superficieInput.classList.add('input-error'); allValid = false;
            }
            if (!ubicacionInput || !ubicacionInput.value.trim()) {
                ubicacionInput.classList.add('input-error'); allValid = false;
            }
            if (!motivoInput || !motivoInput.value.trim()) {
                motivoInput.classList.add('input-error'); allValid = false;
            }
            if (!riegoInput || !riegoInput.value.trim()) {
                riegoInput.classList.add('input-error'); allValid = false;
            }
        });

        if (!allValid) {
            alert('Por favor, completa todos los campos obligatorios (Superficie, Ubicación, Riego y Motivo) en todas las pestañas de cultivo.');
        }
        return allValid;
    }

    if (asesoriaForm) {
        asesoriaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateAsesoriaForms()) {
                return;
            }

            const primerCultivoKey = asesoriaSelectedCultivos.nombre;
            const dataBase = asesoriaFormDataStore[primerCultivoKey];

            const superficieTotal = asesoriaSelectedCultivos.reduce((total, cultivo) => {
                const data = asesoriaFormDataStore[cultivo.nombre];
                return total + parseFloat(data.superficie || 0);
            }, 0);

            const motivoAsesoria = asesoriaSelectedCultivos.map(cultivo => {
                const data = asesoriaFormDataStore[cultivo.nombre];
                return `${cultivo.nombre}: ${data.motivo || 'N/A'}`;
            }).join('; ');

            const cultivosParaApi = asesoriaSelectedCultivos.map(cultivo => ({
                idCultivo: cultivo.id
            }));

            const solicitudAPIS = {
                idAgricultor: parseInt(currentUser.id),
                idEstado: 1,
                fechaSolicitud: new Date().toISOString(),
                
                superficieTotal: superficieTotal,
                direccionTerreno: dataBase.ubicacion,
                motivoAsesoria: motivoAsesoria,
                tipoRiego: parseInt(dataBase.tipoRiego),

                usoMaquinaria: dataBase.utilizaMaquinaria === 'Si',
                tienePlaga: dataBase.tienePlaga === 'Si',

                nombreMaquinaria: (dataBase.utilizaMaquinaria === 'Si') ? dataBase.maquinariaDetalle : null,
                descripcionPlaga: (dataBase.tienePlaga === 'Si') ? dataBase.plagaDetalle : null,

                cultivos: cultivosParaApi
            };

            console.log("Enviando Payload de Asesoría:", JSON.stringify(solicitudAPIS, null, 2));

            try {
                const response = await fetchWithCors(`${API_BASE_URL}/solicitudasesoria`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(solicitudAPIS)
                });

                if (response.ok || response.status === 201) {
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
                modalMessage.textContent = 'No se pudo conectar con el servidor.';
            }

            if(successModal) successModal.classList.remove('hidden');
        });
    }

    // ===========================================
    // ======= TALLERES (LÓGICA ACTUALIZADA) =====
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

    function renderTalleresList() {
        if (!talleresListContainer) return;

        talleresListContainer.innerHTML = '';
        catalogoTalleres.forEach(taller => {
            const wrapper = document.createElement('div');
            wrapper.className = 'taller-card';
            wrapper.innerHTML = `
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="taller-${taller.idTaller}" data-id="${taller.idTaller}" class="taller-checkbox">
                    <label for="taller-${taller.idTaller}"></label>
                </div>
                <div class="taller-info">
                    <h4>${taller.nombreTaller}</h4> 
                    <p>${taller.descripcion}</p>
                    <span>Costo: $${taller.costo ? taller.costo.toLocaleString() : 'N/A'}</span>
                </div>
            `;
            talleresListContainer.appendChild(wrapper);
        });
    }

    function openTalleresFlow() {
        renderTalleresList();
        showView(talleresFlowView);
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

            selectedTalleres = catalogoTalleres.filter(t => ids.includes(String(t.idTaller)));

            const listaContainer = document.getElementById('talleres-seleccionados-lista');
            const montoTotalEl = document.getElementById('montoTotal');
            let montoTotal = 0;
            if (listaContainer) listaContainer.innerHTML = '';

            selectedTalleres.forEach(taller => {
                if (listaContainer) listaContainer.innerHTML += `<div class="taller-resumen-item">✔️ ${taller.nombreTaller}</div>`;
                montoTotal += taller.costo;
            });

            if (montoTotalEl) montoTotalEl.textContent = `Monto Total: $${montoTotal.toLocaleString()}`;

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
            
            const fechaInput = document.getElementById('fecha');
            const direccionInput = document.getElementById('ubicacion');
            const comentariosInput = document.getElementById('comentarios');

            if (!fechaInput.value || !direccionInput.value || !comentariosInput.value) {
                alert('Por favor, complete todos los campos (Fecha, Ubicación y Comentarios).');
                return;
            }
            if (selectedTalleres.length === 0) {
                alert('Error: no hay talleres seleccionados.');
                return;
            }

            let exitos = 0;
            let fallos = 0;

            for (const taller of selectedTalleres) {
                
                const solicitudAPIS = {
                    idAgricultor: parseInt(currentUser.id),
                    idTaller: taller.idTaller,
                    
                    direccion: direccionInput.value,
                    comentario: comentariosInput ? comentariosInput.value : '',
                    
                    fechaAplicarTaller: fechaInput.value,
                    fechaSolicitud: new Date().toISOString(),
                    
                    idEstado: 1,
                    estadoPagoImagen: null,
                    fechaFin: null,
                };

                try {
                    const response = await fetchWithCors(`${API_BASE_URL}/solicitudtaller`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'

                        },
                        body: JSON.stringify(solicitudAPIS),
                    });

                    if (response.ok || response.status === 201) {
                        exitos++;
                    } else {
                        fallos++;
                        console.error(`Error al enviar taller ${taller.nombreTaller}:`, await response.text());
                    }

                } catch (error) {
                    fallos++;
                    console.error(`Error de red al enviar taller ${taller.nombreTaller}:`, error);
                }
            }

            if (fallos === 0) {
                modalTitle.textContent = '¡Solicitudes Enviadas!';
                modalMessage.textContent = `Se enviaron ${exitos} solicitudes de taller correctamente.`;
            } else if (exitos > 0) {
                modalTitle.textContent = 'Solicitud Parcialmente Exitosa';
                modalMessage.textContent = `Se enviaron ${exitos} solicitudes, pero ${fallos} fallaron.`;
            } else {
                modalTitle.textContent = 'Error al Enviar Solicitudes';
                modalMessage.textContent = 'No se pudo enviar ninguna solicitud. Revisa la consola.';
            }
            
            if(successModal) successModal.classList.remove('hidden');
        });
    }

    // Lógica del Modal y Navegación
    if (modalAceptar) {
        modalAceptar.addEventListener('click', () => {
            if(successModal) successModal.classList.add('hidden');
            showView(initialView);
        });
    }

    const navInicioLink = document.getElementById('nav-link-inicio');
    if (navInicioLink) {
        navInicioLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView(initialView);
        });
    }

    showView(initialView);
});
