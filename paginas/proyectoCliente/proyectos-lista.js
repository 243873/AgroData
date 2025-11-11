document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('usuarioActual'));
    if (!currentUser) { window.location.href = '/index.html'; return; }

    const projectsListContainer = document.getElementById('projects-list-container');
    const welcomeMessage = document.getElementById('welcomeMessage');

    welcomeMessage.textContent = `Bienvenido, ${currentUser.nombre}`;

    function getAllProjectsForCurrentUser() {
        const projects = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('project_')) {
                const project = JSON.parse(localStorage.getItem(key));
                if (project.clienteId === currentUser.id) {
                    projects.push(project);
                }
            }
        }
        return projects;
    }

    function renderProjects() {
        projectsListContainer.innerHTML = '';
        const myProjects = getAllProjectsForCurrentUser();
        
        if (myProjects.length === 0) {
            projectsListContainer.innerHTML = '<div class="empty-state-message"><p>Aún no tienes proyectos asignados.</p></div>';
            return;
        }

        myProjects.forEach(project => {
            // CORRECCIÓN: Se usa la nueva estructura de tarjeta
            const card = `
                <a href="proyectoCliente.html?id=${project.id}" class="project-card">
                    <div class="card-info">
                        <h5>Plan de Cultivo: ${project.nombre}</h5>
                        <div class="card-info-details">
                            <p><img src="/Imagenes/user.png" class="icon"> ${currentUser.nombre}</p>
                            <p><img src="/Imagenes/location.png" class="icon"> ${project.info.ubicacion}</p>
                            <p><img src="/Imagenes/tree-sapling.png" class="icon"> Cultivo: ${project.nombre}</p>
                        </div>
                    </div>
                    <div class="card-actions">
                        <span class="btn-details">Ver Detalles</span>
                    </div>
                </a>`;
            projectsListContainer.innerHTML += card;
        });
    }

    renderProjects();
});