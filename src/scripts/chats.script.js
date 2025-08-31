
import { initChatSocket, sendMessage, sendTyping, joinChatRoom } from './chat.socket.js';
import { getProfileData } from '../services/profile.service.js';

const API_URL = 'http://localhost:3000/api';
console.log('chats.script.js ejecutándose');
let currentUser = null;
let selectedUser = null;
let currentChatId = null;
let chatIds = [];
let chatReady = false;

const userListEl = document.getElementById('user-list');
const chatMessagesEl = document.getElementById('chat-messages');
const chatInputEl = document.getElementById('chat-input');
const sendBtnEl = document.getElementById('send-btn');
const typingIndicatorEl = document.getElementById('typing-indicator');

// Renderizar lista de usuarios disponibles
async function renderUserList() {
    console.log('renderUserList ejecutado');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/chat/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await res.json();
    console.log('Usuarios recibidos:', users);
    if (!userListEl) {
        console.error('No se encontró el elemento #user-list en el HTML');
        return;
    }
    userListEl.innerHTML = '';
    if (users.length === 0) {
        userListEl.innerHTML = '<div>No hay usuarios disponibles para chatear.</div>';
    } else {
        users.forEach(user => {
            const el = document.createElement('div');
            el.className = 'user-item';
            const avatarUrl = user.profile_photo || './src/images/default-avatar.png';
            let onlineStatus = window.onlineUsers && window.onlineUsers.includes(user.user_id) ? '🟢' : '⚪';
            el.innerHTML = `
                <img src="${avatarUrl}" alt="${user.first_name}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:8px;vertical-align:middle;">
                <span>${user.first_name} ${user.last_name}</span>
                <span style="float:right;">${onlineStatus}</span>
            `;
            el.onclick = () => selectUser(user);
            userListEl.appendChild(el);
        });
    }
    window.lastUserList = users;
}

window.onUserOnline = (userId) => {
    if (!window.onlineUsers.includes(userId)) window.onlineUsers.push(userId);
    if (selectedUser && selectedUser.user_id === userId) {
        const chatUserInfoEl = document.querySelector('.chat-user-info');
        if (chatUserInfoEl) chatUserInfoEl.querySelector('p').textContent = '🟢 Online';
    }
    actualizarListaOnlineOffline();
};

window.onUserOffline = (userId) => {
    window.onlineUsers = window.onlineUsers.filter(id => id !== userId);
    if (selectedUser && selectedUser.user_id === userId) {
        const chatUserInfoEl = document.querySelector('.chat-user-info');
        if (chatUserInfoEl) chatUserInfoEl.querySelector('p').textContent = '⚪ Offline';
    }
    actualizarListaOnlineOffline();
};

function actualizarListaOnlineOffline() {
    const userItems = document.querySelectorAll('.user-item');
    userItems.forEach(item => {
        const nameSpan = item.querySelector('span');
        const userName = nameSpan ? nameSpan.textContent.trim() : '';
        const user = window.lastUserList && window.lastUserList.find(u => `${u.first_name} ${u.last_name}` === userName);
        if (user) {
            const onlineStatus = window.onlineUsers && window.onlineUsers.includes(user.user_id) ? '🟢' : '⚪';
            const statusSpan = item.querySelector('span:last-child');
            if (statusSpan) statusSpan.textContent = onlineStatus;
        }
    });
}


// Seleccionar usuario y cargar historial
async function selectUser(user) {
    selectedUser = user;
    chatReady = false;
    setSendEnabled(false);
    // Mostrar el avatar y el estado online/offline del usuario seleccionado en el chat
    const chatUserInfoEl = document.querySelector('.chat-user-info');
    const chatUserAvatarEl = document.querySelector('.chat-user-avatar');
    const avatarUrl = user.profile_photo || './src/images/default-avatar.png';
    if (chatUserAvatarEl) {
        chatUserAvatarEl.innerHTML = `<img src="${avatarUrl}" alt="${user.first_name}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`;
    }
    let onlineStatus = window.onlineUsers && window.onlineUsers.includes(user.user_id) ? '🟢 Online' : '⚪ Offline';
    if (chatUserInfoEl) {
        chatUserInfoEl.innerHTML = `<h3>${user.first_name} ${user.last_name}</h3><p>${onlineStatus}</p>`;
    }
    // Hardening: asegurar el chatId vía REST antes de cargar historial o permitir mensajes
    await ensureChat(currentUser.user_id, user.user_id);
    if (chatReady && currentChatId) {
        joinChatRoom(currentChatId);
        await fetchMessagesForCurrentChat(user);
    }
}

// Hardening: función para asegurar el chatId vía REST
async function ensureChat(fromUserId, toUserId) {
    currentChatId = null;
    chatReady = false;
    setSendEnabled(false);
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/chat/ensure`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fromUserId, toUserId })
        });
        const data = await res.json();
        if (data.chatId) {
            currentChatId = data.chatId;
            chatReady = true;
            setSendEnabled(true);
        } else {
            throw new Error('No se pudo obtener chatId');
        }
    } catch (e) {
        alert('Error asegurando el chat: ' + (e.message || e));
        chatReady = false;
        setSendEnabled(false);
    }
}

async function fetchMessagesForCurrentChat(user = selectedUser) {
    chatMessagesEl.innerHTML = '';
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/chat/messages/${user.user_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const messages = await res.json();
    // No modificar currentChatId aquí, solo mostrar mensajes
    messages.forEach(msg => {
        const el = document.createElement('div');
        el.className = msg.user_id === currentUser.user_id ? 'message sent' : 'message received';
        el.textContent = msg.content;
        chatMessagesEl.appendChild(el);
    });
}


// Enviar mensaje al usuario seleccionado
sendBtnEl.onclick = async () => {
    const content = chatInputEl.value.trim();
    if (!content || !selectedUser) return;
    // Hardening: bloquear envío si no hay chatId válido
    if (!chatReady || !currentChatId) {
        alert('No se puede enviar el mensaje: chatId no disponible');
        return;
    }
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/chat/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ toUserId: selectedUser.user_id, content })
        });
        const msg = await res.json();
        await fetchMessagesForCurrentChat(selectedUser);
        sendMessage(currentChatId, selectedUser.user_id, content);
    } catch (e) {
        alert('Error enviando el mensaje: ' + (e.message || e));
    }
    chatInputEl.value = '';
};

// Hardening: desactivar input y botón hasta que haya chatId válido
function setSendEnabled(enabled) {
    sendBtnEl.disabled = !enabled;
    chatInputEl.disabled = !enabled;
}

// Evento de escribir
chatInputEl.oninput = () => {
    if (currentChatId) sendTyping(currentChatId);
};

// Eventos de socket
window.onlineUsers = [];

window.onNewMessage = (msg) => {
    console.log('[FRONT] onNewMessage:', msg, 'selectedUser:', selectedUser, 'currentUser:', currentUser, 'currentChatId:', currentChatId);
    // Actualizar el chatId siempre que llegue un mensaje
    if (msg.chat_id && msg.chat_id !== currentChatId) {
        currentChatId = msg.chat_id;
    }
    // Si el mensaje es del usuario seleccionado o del usuario actual
    if (selectedUser && (msg.user_id === selectedUser.user_id || msg.user_id === currentUser.user_id)) {
        // Refrescar historial de mensajes siempre que llegue un mensaje
        fetchMessagesForCurrentChat();
    }
};

window.onTyping = (userId) => {
    if (!selectedUser || userId !== selectedUser.user_id) return;
    if (typingIndicatorEl) {
        typingIndicatorEl.style.display = 'block';
        clearTimeout(window._typingTimeout);
        window._typingTimeout = setTimeout(() => {
            typingIndicatorEl.style.display = 'none';
        }, 1500);
    }
};

// (onUserOnline/onUserOffline ya definidos arriba)


// Inicializar chat directamente al importar el módulo
(async () => {
    currentUser = await getProfileData();
    console.log('[FRONT] currentUser:', currentUser);
    const userId = currentUser.User ? currentUser.User.user_id : currentUser.user_id || currentUser.user_id;
    // Obtener los chatIds del usuario actual (endpoint dedicado)
    const token = localStorage.getItem('token');
    let chatIds = [];
    try {
        const resIds = await fetch(`${API_URL}/chat/ids`, { headers: { 'Authorization': `Bearer ${token}` } });
        const dataIds = await resIds.json();
        chatIds = dataIds.chatIds || [];
    } catch (e) {
        console.error('Error obteniendo chat ids:', e);
    }
    initChatSocket(userId, chatIds);
    renderUserList();
})();
