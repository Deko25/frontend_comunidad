import { updateProfilePhoto } from '../services/profile.service.js';

export function setupSettingsPage(navigate) {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const modal = document.getElementById('edit-profile-modal');
    
    // Si los elementos no existen, no continuamos.
    if (!editProfileBtn || !modal) {
        return;
    }

    const closeModalBtn = modal.querySelector('.modal-close-btn');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const photoForm = document.getElementById('profile-photo-form');
    const photoInput = document.getElementById('photoInputModal');
    const previewImage = document.getElementById('previewImageModal');
    const logoutBtn = document.getElementById('logout-settings-btn');

    const openModal = () => {
        modal.classList.remove('hidden');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        // Reseteamos el formulario y la vista previa al cerrar
        photoForm.reset();
        previewImage.style.display = 'none';
        previewImage.src = '#';
    };

    // Event Listeners para abrir y cerrar el modal
    editProfileBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        // Cierra el modal si se hace clic en el fondo oscuro
        if (e.target === modal) {
            closeModal();
        }
    });

    // Vista previa de la imagen seleccionada
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImage.src = event.target.result;
                previewImage.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Manejo del envío del formulario
    photoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();

        if (photoInput.files[0]) {
            formData.append('profilePhoto', photoInput.files[0]);
        } else {
            alert('Por favor, selecciona una imagen.');
            return;
        }

        try {
            const updatedProfile = await updateProfilePhoto(formData);
            alert('Foto de perfil actualizada con éxito.');
            closeModal();
            // Actualizamos la imagen del sidebar directamente
            const userAvatar = document.querySelector('.sidebar .user-avatar img');
            if (userAvatar && updatedProfile.profile_photo) {
                userAvatar.src = updatedProfile.profile_photo;
            }
        } catch (err) {
            console.error('Error al actualizar la foto de perfil:', err);
            alert(err.message || 'Error al actualizar la foto.');
        }
    });

    // Lógica para el botón de cerrar sesión de esta página
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('profileExists');
            navigate('/login');
        });
    }
}
