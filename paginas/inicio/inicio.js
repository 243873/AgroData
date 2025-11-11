
document.addEventListener('DOMContentLoaded', () => {
    // ---- Lógica del Modal de Confirmación ----
    const modal = document.getElementById('confirmationModal');
    const cancelButton = document.getElementById('cancelButton');
    const acceptButton = document.getElementById('acceptButton');
    let notificationToRemove = null;

    const openConfirmationModal = (element) => {
        notificationToRemove = element;
        modal.classList.remove('hidden');
    };

    const closeConfirmationModal = () => {
        notificationToRemove = null;
        modal.classList.add('hidden');
    };
    
    // Asignar evento a todos los botones de descartar
    document.querySelectorAll('.btn-discard').forEach(button => {
        button.addEventListener('click', (event) => {
            const notificationItem = event.target.closest('.notification-item');
            if (notificationItem) {
                openConfirmationModal(notificationItem);
            }
        });
    });

    acceptButton.addEventListener('click', () => {
        if (notificationToRemove) {
            notificationToRemove.remove();
        }
        closeConfirmationModal();
    });

    cancelButton.addEventListener('click', closeConfirmationModal);
});

