document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM Y ESTADO ---
    const projectsListContainer = document.getElementById('projects-list-container');
    const deleteModal = document.getElementById('delete-modal');
    let projectIdToDelete = null;

    // --- LÓGICA DE DATOS ---
    function getAllProjects() {
        const projects = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('project_')) {
                projects.push(JSON.parse(localStorage.getItem(key)));
            }
        }
        return projects;
    }

    // --- LÓGICA DE RENDERIZADO ---
    function renderProjects(filter = 'all') {
        projectsListContainer.innerHTML = '';
        let projects = getAllProjects();
        
        if (filter !== 'all') {
            projects = projects.filter(p => p.estado === filter);
        }

        if (projects.length === 0) {
            projectsListContainer.innerHTML = '<p>No hay proyectos que coincidan con el filtro.</p>';
            return;
        }

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="card-info">
                    <h5>Plan de Cultivo: ${project.nombre}</h5>
                    <div class="card-details">
                        <span class="info-item"><img src="/Imagenes/user.png" class="icon">${project.clienteNombre || 'Cliente no asignado'}</span>
                        <span class="info-item"><img src="/Imagenes/marker.png" class="icon">${project.info.ubicacion}</span>
                        <span class="info-item"><img src="/Imagenes/calendar.png" class="icon">${project.info.fechaInicio}</span>
                    </div>
                    <div class="card-tags">
                        ${project.cultivos.map(c => `<span class="cultivo-tag">${c}</span>`).join('')}
                    </div>
                </div>
                <div class="card-actions">
                    <a href="proyecto-detalle.html?id=${project.id}" class="btn-details">Ver Detalles</a>
                    <button class="btn btn-danger btn-delete" data-id="${project.id}">Eliminar</button>
                </div>`;
            projectsListContainer.appendChild(card);
        });
    }

    // --- MANEJO DE EVENTOS ---
    document.querySelector('.filter-buttons').addEventListener('click', e => {
        if (e.target.matches('.filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderProjects(e.target.dataset.filter);
        }
    });

    projectsListContainer.addEventListener('click', e => {
        if (e.target.matches('.btn-delete')) {
            projectIdToDelete = e.target.dataset.id;
            deleteModal.classList.remove('hidden');
        }
    });

    document.getElementById('cancel-delete-btn').addEventListener('click', () => deleteModal.classList.add('hidden'));
    document.getElementById('accept-delete-btn').addEventListener('click', () => {
        if (projectIdToDelete) {
            localStorage.removeItem(`project_${projectIdToDelete}`);
            renderProjects(document.querySelector('.filter-btn.active').dataset.filter);
            projectIdToDelete = null;
        }
        deleteModal.classList.add('hidden');
    });

    // --- INICIALIZACIÓN ---
    renderProjects();
});