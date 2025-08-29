// Renderizar una notificación individual
export function renderNotification(notification) {
    const container = document.querySelector('.notifications-container');
    if (!container) return;
    const API_URL = 'http://localhost:3000/';
    const card = document.createElement('div');
    card.className = 'card left';
    card.innerHTML = `
    <div class="notifications-title">NOTIFICATIONS</div>
        <img src="${notification.profile_photo ? API_URL + notification.profile_photo : './src/images/default-avatar.png'}" alt="${notification.user_name || 'Usuario'}" class="avatar">
        <div class="info">
            <div class="top">
                <span class="name">${notification.user_name || ''}</span>
                <div class="meta">
                    <span>${timeAgo(notification.date)}</span>
                    <span class="verified-badge">✓</span>
                </div>
            </div>
            <div class="comment">${notification.message}</div>
        </div>
    `;
    container.prepend(card);
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
