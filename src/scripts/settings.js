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
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token'); 
            localStorage.removeItem('profileExists');
            navigate('/login');
        });
    }
}