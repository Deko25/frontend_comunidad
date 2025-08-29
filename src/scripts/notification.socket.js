import { getNotifications } from '../services/notification.service.js';

let socket;

export function initNotificationSocket(profileId, onNewNotification) {
    if (!window.io) {
        console.error('Socket.io client not loaded');
        return;
    }
    socket = window.io('http://localhost:3000');

    socket.on('connect', () => {
        socket.emit('joinNotifications', { profileId });
    });

    // Escuchar el evento correcto y filtrar por el usuario actual
    socket.on('new_notification', (notification) => {
        if (typeof onNewNotification === 'function') {
            onNewNotification(notification);
        }
    });
}

export function disconnectNotificationSocket() {
    if (socket) {
        socket.disconnect();
    }
}
