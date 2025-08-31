// chat.socket.js
// Script para manejar la lógica de chat en tiempo real
let socket;
let userId = null;

export async function initChatSocket(_userId, chatIds = []) {
  userId = Number(_userId);
  if (!window.io) {
    console.error('Socket.io client not loaded');
    return;
  }
  socket = window.io('http://localhost:3000', {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });
  console.log('[SOCKET] Inicializando socket para userId:', userId, 'chatIds:', chatIds);

  socket.on('connect', () => {
    console.log('[SOCKET] Conexión establecida:', socket.id);
    socket.emit('joinChats', { userId, chatIds });
  });

  socket.on('disconnect', (reason) => {
    console.warn('[SOCKET] Desconectado:', reason);
  });

  socket.io.on('reconnect_attempt', (attempt) => {
    console.log('[SOCKET] Intento de reconexión #' + attempt);
  });

  socket.io.on('reconnect', (attempt) => {
    console.log('[SOCKET] Reconexion exitosa tras intentos:', attempt);
    socket.emit('joinChats', { userId, chatIds });
  });

  socket.io.on('reconnect_failed', () => {
    console.error('[SOCKET] Reconexión fallida definitivamente.');
  });

  socket.on('new_message', (message) => {
    if (typeof window.onNewMessage === 'function') window.onNewMessage(message);
  });

  socket.on('typing', ({ userId }) => {
    if (typeof window.onTyping === 'function') window.onTyping(userId);
  });

  socket.on('user_online', (userId) => {
    if (typeof window.onUserOnline === 'function') window.onUserOnline(userId);
  });

  socket.on('user_offline', (userId) => {
    if (typeof window.onUserOffline === 'function') window.onUserOffline(userId);
  });

  socket.on('online_users', (userIds) => {
    if (!Array.isArray(userIds)) return;
    window.onlineUsers = userIds.map(id => Number(id));
    if (typeof window.refreshOnlineUsers === 'function') window.refreshOnlineUsers();
  });
}

export function joinChatRoom(chatId) {
  if (socket && chatId) {
    socket.emit('joinChat', { chatId });
  }
}

export function sendMessage(chatId, toUserId, content) {
  if (!socket) return;
  if (!chatId || !content) return;
  socket.emit('send_message', {
    chat_id: chatId,
    message: {
      chat_id: chatId,
      user_id: userId,
      to_user_id: toUserId,
      content,
      sent_date: new Date()
    }
  });
}

export function sendTyping(chatId) {
  if (socket && chatId) socket.emit('typing', { chatId, userId });
}
