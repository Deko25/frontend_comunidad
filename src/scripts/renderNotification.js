import { buildFileUrl } from '../config.js';

// Renderizar una notificación individual
export function renderNotification(notification) {
    console.log('Notificación recibida:', notification);
    const container = document.querySelector('.notifications-container');
    if (!container) return;
    const card = document.createElement('div');
    card.className = 'card left';

    // Intentar extraer snapshot desde message si viene como JSON serializado
    let snapshot = null;
    if (notification.message) {
        try { snapshot = JSON.parse(notification.message); } catch (_) {}
    }

    const derivedName = snapshot?.actorName || notification.actor_name
        || (notification.Post?.Profile?.User ? `${notification.Post.Profile.User.first_name} ${notification.Post.Profile.User.last_name}`.trim() : '')
        || (notification.post?.Profile?.User ? `${notification.post.Profile.User.first_name} ${notification.post.Profile.User.last_name}`.trim() : '')
        || notification.user_name
        || (notification.Profile?.User ? `${notification.Profile.User.first_name} ${notification.Profile.User.last_name}`.trim() : '');

    const profilePhotoRaw = snapshot?.actorPhoto || notification.actor_photo
        || notification.Post?.Profile?.profile_photo
        || notification.post?.Profile?.profile_photo
        || notification.post?.profile_photo
        || notification.Profile?.profile_photo
        || './src/images/default-avatar.png';
    const profilePhoto = buildFileUrl(profilePhotoRaw);

    // Mensaje personalizado según el tipo de notificación
    let message = '';
    switch (notification.type) {
        case 'post':
            message = snapshot?.display || `${derivedName} hizo una nueva publicación`;
            break;
        case 'reaction':
            message = `${derivedName} reaccionó a tu publicación`;
            break;
        case 'comment':
            message = `${derivedName} comentó tu publicación`;
            break;
        default:
            message = notification.message || 'Tienes una nueva notificación';
    }

    card.innerHTML = `
    <img src="${profilePhoto}" alt="${derivedName || 'Usuario'}" class="avatar">
        <div class="info">
            <div class="top">
                <span class="name">${derivedName}</span>
                <div class="meta">
                    <span>${timeAgo(notification.date)}</span>
                    <span class="verified-badge">✓</span>
                </div>
            </div>
            <div class="comment">${message}</div>
        </div>
    `;
    container.appendChild(card);
}

// Renderizar todas las notificaciones al cargar la vista
export async function renderAllNotifications(getNotifications) {
    try {
        const notifications = await getNotifications();
        const container = document.querySelector('.notifications-container');
        if (container) {
            container.innerHTML = '';
            const title = document.createElement('div');
            title.className = 'notifications-title';
            title.textContent = 'NOTIFICATIONS';
            container.appendChild(title);
            notifications.forEach(renderNotification);
        }
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
    }
}

// Función para mostrar el tiempo relativo
export function timeAgo(date) {
            const now = new Date();
            const past = new Date(date);
            const diff = Math.floor((now - past) / 1000);
            if (diff < 60) return `${diff} segundos ago`;
            if (diff < 3600) return `${Math.floor(diff / 60)} minutos ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)} horas ago`;
            return `${Math.floor(diff / 86400)} días ago`;
        }
