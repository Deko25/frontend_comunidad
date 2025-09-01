export function setupSettingsPage(navigate) { 
    const editProfileBtn = document.getElementById('editProfileBtn');
    const toggleNotificationsBtn = document.getElementById('toggleNotificationsBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            navigate('/profile-setup');
        });
    }

    if (toggleNotificationsBtn) {
        toggleNotificationsBtn.addEventListener('click', () => {
            let notificationsEnabled = localStorage.getItem('notifications') === 'true';
            notificationsEnabled = !notificationsEnabled;
            localStorage.setItem('notifications', notificationsEnabled);
            alert(`Notificaciones ${notificationsEnabled ? 'activadas' : 'desactivadas'}.`);
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            alert('Redirigiendo a la página para cambiar la contraseña...');
            navigate('/change-password');
        });
    }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const result = await Swal.fire({
                    title: '¿Estás seguro?',
                    text: 'Se cerrará tu sesión.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#705FFF',
                    cancelButtonColor: '#f2f3f5',
                    confirmButtonText: 'Sí, cerrar sesión',
                    customClass: {
                        cancelButton: 'cancel-btn-class'
                    }
                });

                if (result.isConfirmed) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('profileExists');
                    navigate('/login');
                }
            });
        }
}