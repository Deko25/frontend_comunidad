import { getNotifications } from '../services/notification.service.js';

export async function renderNotifications(token) {
  const container = document.getElementById('notification-list');
  container.innerHTML = '<p>Cargando notificaciones...</p>';

  const notifications = await getNotifications(token);

  if (notifications.length === 0) {
    container.innerHTML = '<p>No tienes notificaciones aún.</p>';
    return;
  }

  container.innerHTML = `
    <ul>
      ${notifications.map(n => `
        <li>
          <strong>${n.type}</strong>: ${n.message}
          <br><small>${new Date(n.date).toLocaleString()}</small>
        </li>
      `).join('')}
    </ul>
  `;
}
