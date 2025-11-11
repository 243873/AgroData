document.addEventListener('DOMContentLoaded', () => {
    // --- OBTENER ELEMENTOS DEL DOM ---
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const logoutButton = document.getElementById('logoutButton');
    const uploadButton = document.getElementById('uploadButton');
    const imageInput = document.getElementById('imageInput');
    const profileImage = document.getElementById('profileImage');
    
    const successModal = document.getElementById('successModal');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const acceptLogoutBtn = document.getElementById('acceptLogout');

    const welcomeMessage = document.getElementById('welcomeMessage');

    const viewModeElements = document.querySelectorAll('.view-mode');
    const editModeElements = document.querySelectorAll('.edit-mode');

    const userTitleView = document.getElementById('userTitleView');
    const viewCorreo = document.getElementById('viewCorreo');
    const viewTelefono = document.getElementById('viewTelefono');

    const editNombre = document.getElementById('editNombre');
    const emailInput = document.getElementById('emailInput');
    const contactInput = document.getElementById('contactInput');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // --- ESTADO DE LA APLICACIÓN ---
    let currentUser = JSON.parse(localStorage.getItem('usuarioActual'));
    let allUsers = JSON.parse(localStorage.getItem('usuarios')) || [];
    let newProfilePicBase64 = null;

    // --- LÓGICA PRINCIPAL ---

    if (!currentUser) {
        alert("No se ha iniciado sesión. Redirigiendo...");
        // Ajusta esta ruta si es necesario para la estructura de carpetas del agrónomo
        window.location.href = '../../index.html'; 
        return;
    }

    const loadUserData = () => {
        welcomeMessage.textContent = `Bienvenido, ${currentUser.nombre}`;
        
        // MODIFICACIÓN SUGERIDA: Personalizar el título basado en el rol del usuario
        let title = `${currentUser.nombre} ${currentUser.apellidoPaterno}`;
        if (currentUser.rol === 'agronomo') { // Asumiendo que guardas un 'rol' en el objeto de usuario
            title = `ING. AGRONOMO: ${title}`;
        }
        userTitleView.textContent = title;

        viewCorreo.textContent = currentUser.correo;
        viewTelefono.textContent = currentUser.telefono;
        if (currentUser.profilePicture) {
            profileImage.src = currentUser.profilePicture;
        }
        
        editNombre.value = `${currentUser.nombre} ${currentUser.apellidoPaterno}`;
        emailInput.value = currentUser.correo;
        contactInput.value = currentUser.telefono;
    };

    const setEditMode = (isEditing) => {
        viewModeElements.forEach(el => el.classList.toggle('hidden', isEditing));
        editModeElements.forEach(el => el.classList.toggle('hidden', !isEditing));
        
        editButton.classList.toggle('hidden', isEditing);
        saveButton.classList.toggle('hidden', !isEditing);
        uploadButton.classList.toggle('hidden', !isEditing);
    };

    const saveChanges = () => {
        const newFullName = editNombre.value.trim().split(' ');
        const newNombre = newFullName[0] || '';
        const newApellidoPaterno = newFullName.slice(1).join(' ') || '';
        const newCorreo = emailInput.value.trim();
        const newTelefono = contactInput.value.trim();
        const currentPass = currentPasswordInput.value;
        const newPass = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;

        let isValid = true;
        
        if (newPass !== '') {
            if (currentPass !== currentUser.contrasena) {
                alert('Error: La contraseña actual es incorrecta.');
                isValid = false;
            } else if (newPass !== confirmPass) {
                alert('Error: Las nuevas contraseñas no coinciden.');
                isValid = false;
            }
        }
        
        if (newCorreo !== currentUser.correo && allUsers.some(user => user.correo === newCorreo && user.id !== currentUser.id)) {
            alert('Error: El correo electrónico ya está en uso por otra cuenta.');
            isValid = false;
        }

        if (!isValid) return;

        currentUser.nombre = newNombre;
        currentUser.apellidoPaterno = newApellidoPaterno;
        currentUser.correo = newCorreo;
        currentUser.telefono = newTelefono;
        if (newPass !== '') {
            currentUser.contrasena = newPass;
        }
        if (newProfilePicBase64) {
            currentUser.profilePicture = newProfilePicBase64;
        }

        const userIndex = allUsers.findIndex(user => user.id === currentUser.id);
        if (userIndex !== -1) {
            allUsers[userIndex] = currentUser;
        }

        localStorage.setItem('usuarioActual', JSON.stringify(currentUser));
        localStorage.setItem('usuarios', JSON.stringify(allUsers));
        
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        
        loadUserData();
        successModal.classList.remove('hidden');
        setTimeout(() => {
            successModal.classList.add('hidden');
            setEditMode(false);
        }, 2000);
    };

    // --- ASIGNACIÓN DE EVENTOS ---
    editButton.addEventListener('click', () => setEditMode(true));
    saveButton.addEventListener('click', saveChanges);

    uploadButton.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profileImage.src = e.target.result;
                newProfilePicBase64 = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    logoutButton.addEventListener('click', () => logoutModal.classList.remove('hidden'));
    cancelLogoutBtn.addEventListener('click', () => logoutModal.classList.add('hidden'));
    acceptLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuarioActual');
        window.location.href = '../../index.html'; // Asegúrate que esta ruta es correcta
    });
    
    // --- INICIALIZACIÓN ---
    loadUserData();
    setEditMode(false);
});