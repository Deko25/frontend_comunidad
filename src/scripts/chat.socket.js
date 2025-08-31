// chat.socket.js
// Script para manejar la lógica de chat en tiempo real
let socket;
let userId = null;

export async function initChatSocket(_userId, chatIds = []) {
  userId = _userId;
  if (!window.io) {
    console.error('Socket.io client not loaded');
    return;
  }
  socket = window.io('http://localhost:3000');
  console.log('[SOCKET] Conectado, userId:', userId, 'chatIds:', chatIds);
  socket.emit('joinChats', { userId, chatIds });

  socket.on('connect', () => {
    console.log('[SOCKET] Conexión establecida:', socket.id);
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
