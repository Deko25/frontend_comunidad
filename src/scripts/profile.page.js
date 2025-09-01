import { getProfileData } from '../services/profile.service.js';

// Carga dinámica de datos del perfil (foto, nombre y descripción)
export async function setupProfilePage() {
  try {
    const profile = await getProfileData();
    if (!profile) return;

    const imgEl = document.querySelector('.profile-image');
    if (imgEl) {
      imgEl.src = profile.profile_photo || '/src/images/logo.png';
      imgEl.alt = `${profile.User?.first_name || ''} ${profile.User?.last_name || ''}`.trim();
    }

    const nameEl = document.querySelector('.profile-name');
    if (nameEl && profile.User) {
      const first = (profile.User.first_name || '').toUpperCase();
      const last = (profile.User.last_name || '').toUpperCase();
      const fullName = `${first} ${last}`.trim();
      nameEl.textContent = fullName;
      nameEl.title = fullName; // tooltip para nombre truncado
    }

    const bioEl = document.querySelector('.description-text');
    if (bioEl) {
      bioEl.textContent = profile.bio && profile.bio.trim() !== '' ? profile.bio : 'Sin descripción.';
    }
  } catch (err) {
    console.error('Error cargando datos del perfil:', err);
  }
}

// Auto-ejecución si el script se carga directamente (por precaución)
if (window.location.pathname === '/profile') {
  setupProfilePage();
}
