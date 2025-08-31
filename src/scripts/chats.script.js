
import { initChatSocket, sendMessage, sendTyping, joinChatRoom } from './chat.socket.js';
import { getProfileData } from '../services/profile.service.js';

const API_URL = 'http://localhost:3000/api';
console.log('chats.script.js ejecutándose');
let currentUser = null;
let selectedUser = null;
let currentChatId = null;
let chatIds = [];
let chatReady = false;
const messageCache = new Map(); // key: otherUserId, value: { messages: [], hasMore, oldestTs, chatId }

const userListEl = document.getElementById('user-list');
const chatMessagesEl = document.getElementById('chat-messages');
const chatInputEl = document.getElementById('chat-input');
const sendBtnEl = document.getElementById('send-btn');
const typingIndicatorEl = document.getElementById('typing-indicator');

// Mapa chatId -> otherUserId para actualizaciones rápidas
const chatMap = new Map();

// Renderizar lista de conversaciones (sustituye lista de usuarios sueltos)
async function renderConversationList(preserveSelection = true) {
    const prevSelectedId = preserveSelection && selectedUser ? selectedUser.user_id : null;
    const token = localStorage.getItem('token');
    let conversations = [];
    try {
        const res = await fetch(`${API_URL}/chat/conversations`, { headers: { 'Authorization': `Bearer ${token}` } });
        conversations = await res.json();
    } catch (e) {
        console.error('Error obteniendo conversaciones:', e);
    }
    if (!Array.isArray(conversations)) conversations = [];
    if (!userListEl) return;
    userListEl.innerHTML = '';
    if (!conversations.length) {
        userListEl.innerHTML = '<div>No hay conversaciones</div>';
    updateSelectedHeaderStatus();
    return;
    }
    window.lastConversations = conversations;
    conversations.forEach(conv => {
        const chatId = conv.chatId || conv.chat_id; // backend devuelve chat_id
        const { otherUser, lastMessage, unreadCount } = conv;
        if (otherUser) chatMap.set(chatId, otherUser.user_id);
        const el = document.createElement('div');
        el.className = 'conversation-item';
        el.dataset.chatId = chatId;
        el.dataset.uid = otherUser ? otherUser.user_id : '';
        const avatarUrl = (otherUser && otherUser.profile_photo) || './src/images/default-avatar.png';
        const onlineStatus = window.onlineUsers && otherUser ? (window.onlineUsers.includes(otherUser.user_id) ? '🟢' : '⚪') : '';
        const time = lastMessage ? new Date(lastMessage.sent_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const snippetRaw = lastMessage ? lastMessage.content : '';
        const snippet = snippetRaw.length > 40 ? snippetRaw.slice(0, 37) + '…' : snippetRaw;
        el.innerHTML = `
            <img src="${avatarUrl}" alt="${otherUser ? otherUser.first_name : ''}" class="conv-avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
            <div class="conv-main">
               <div class="conv-top"><span class="conv-name">${otherUser ? otherUser.first_name + ' ' + otherUser.last_name : 'Desconocido'}</span><span class="conv-time">${time}</span></div>
               <div class="conv-bottom"><span class="conv-last">${snippet}</span>${unreadCount ? `<span class="unread-badge">${unreadCount}</span>` : ''}</div>
            </div>
            <span class="conv-status">${onlineStatus}</span>
        `;
        el.onclick = () => selectConversation(conv);
        if (prevSelectedId && otherUser && otherUser.user_id === prevSelectedId) {
            el.classList.add('active');
        }
        userListEl.appendChild(el);
    });
    updateSelectedHeaderStatus();
}

function selectConversation(conv) {
    if (!conv) return;
    const chatId = conv.chatId || conv.chat_id;
    const { otherUser } = conv;
    // Simular antigua estructura user para reutilizar selectUser
    if (otherUser) {
        selectUser(otherUser, chatId);
    }
}

window.onUserOnline = (userId) => {
    userId = Number(userId);
    if (!Array.isArray(window.onlineUsers)) window.onlineUsers = [];
    if (!window.onlineUsers.includes(userId)) window.onlineUsers.push(userId);
    console.log('[ONLINE] user_online recibido', userId, 'lista:', window.onlineUsers);
    if (selectedUser && selectedUser.user_id === userId) {
        const chatUserInfoEl = document.querySelector('.chat-user-info');
        if (chatUserInfoEl) chatUserInfoEl.querySelector('p').textContent = '🟢 Online';
    }
    renderConversationList();
};

window.onUserOffline = (userId) => {
    userId = Number(userId);
    window.onlineUsers = (window.onlineUsers || []).filter(id => id !== userId);
    console.log('[ONLINE] user_offline recibido', userId, 'lista:', window.onlineUsers);
    if (selectedUser && selectedUser.user_id === userId) {
        const chatUserInfoEl = document.querySelector('.chat-user-info');
        if (chatUserInfoEl) chatUserInfoEl.querySelector('p').textContent = '⚪ Offline';
    }
    renderConversationList();
};

// Re-render for bulk update (initial online_users list)
window.refreshOnlineUsers = () => {
    renderConversationList();
    // actualizar header si hay usuario seleccionado
    updateSelectedHeaderStatus();
};

function updateSelectedHeaderStatus(){
    if (!selectedUser) return;
    const chatUserInfoEl = document.querySelector('.chat-user-info');
    if (!chatUserInfoEl) return;
    const onlineStatus = (window.onlineUsers || []).includes(Number(selectedUser.user_id)) ? '🟢 Online' : '⚪ Offline';
    chatUserInfoEl.innerHTML = `<h3>${selectedUser.first_name} ${selectedUser.last_name}</h3><p>${onlineStatus}</p>`;
}


// Seleccionar usuario y cargar historial
async function selectUser(user, preChatId = null) {
    selectedUser = user;
    chatReady = false;
    setSendEnabled(false);
    // Mostrar el avatar y el estado online/offline del usuario seleccionado en el chat
    const chatUserInfoEl = document.querySelector('.chat-user-info');
    const chatUserAvatarEl = document.querySelector('.chat-user-avatar');
    const avatarUrl = user.profile_photo || user.Profile?.profile_photo || './src/images/default-avatar.png';
    if (chatUserAvatarEl) {
        chatUserAvatarEl.innerHTML = `<img src="${avatarUrl}" alt="${user.first_name}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`;
    }
    let onlineStatus = window.onlineUsers && window.onlineUsers.includes(user.user_id) ? '🟢 Online' : '⚪ Offline';
    if (chatUserInfoEl) {
        chatUserInfoEl.innerHTML = `<h3>${user.first_name} ${user.last_name}</h3><p>${onlineStatus}</p>`;
    }
    // Hardening: asegurar el chatId vía REST antes de cargar historial o permitir mensajes
    if (preChatId) { // si ya conocemos el chat de la conversación
        currentChatId = preChatId;
        chatReady = true;
        setSendEnabled(true);
    } else {
        await ensureChat(currentUser.user_id, user.user_id);
    }
    if (chatReady && currentChatId) {
        joinChatRoom(currentChatId);
        await fetchMessagesForCurrentChat(user);
        markConversationReadInUI(currentChatId);
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
    if (!user) return;
    const token = localStorage.getItem('token');
    let cacheEntry = messageCache.get(user.user_id);
    if (!cacheEntry) {
        // Primera carga
        const res = await fetch(`${API_URL}/chat/messages/${user.user_id}?limit=30`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const messages = Array.isArray(data) ? data : data.messages || [];
        cacheEntry = {
            messages,
            hasMore: !Array.isArray(data) ? data.hasMore : false,
            oldestTs: messages.length ? messages[0].sent_date : null,
            chatId: !Array.isArray(data) ? data.chatId : null,
            otherUser: !Array.isArray(data) ? data.otherUser : null
        };
        messageCache.set(user.user_id, cacheEntry);
    }
    renderMessages(cacheEntry, user.user_id);
    currentChatId = cacheEntry.chatId || currentChatId;
    if (currentChatId) markChatRead(currentChatId);
}


// Enviar mensaje al usuario seleccionado
sendBtnEl.onclick = async () => {
    const content = chatInputEl.value.trim();
    if (!content || !selectedUser) return;
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
        // Actualizar cache local sin refetch completo
        let cacheEntry = messageCache.get(selectedUser.user_id);
        if (!cacheEntry) {
            cacheEntry = { messages: [], hasMore: false, oldestTs: null, chatId: currentChatId, otherUser: { first_name: selectedUser.first_name, last_name: selectedUser.last_name, profile_photo: selectedUser.profile_photo } };
            messageCache.set(selectedUser.user_id, cacheEntry);
        }
        cacheEntry.messages.push(msg);
        renderMessages(cacheEntry, selectedUser.user_id, true);
        // Emitir por socket (optimista)
        sendMessage(currentChatId, selectedUser.user_id, content);
        // Refrescar lista conversaciones para mover esta arriba
        renderConversationList();
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
    // Rejoin explícito por si llegó un chat nuevo tras reconexión
    joinChatRoom(currentChatId);
    }
    // Si el mensaje es del usuario seleccionado o del usuario actual
    if (selectedUser && (msg.user_id === selectedUser.user_id || msg.user_id === currentUser.user_id)) {
        // Append sin refetch
        let cacheEntry = messageCache.get(selectedUser.user_id);
        if (!cacheEntry) {
            cacheEntry = { messages: [], hasMore: false, oldestTs: null, chatId: msg.chat_id, otherUser: { first_name: selectedUser.first_name, last_name: selectedUser.last_name, profile_photo: selectedUser.profile_photo } };
            messageCache.set(selectedUser.user_id, cacheEntry);
        }
        // Evitar duplicados (por si vino por fetch y socket casi a la vez)
        if (!cacheEntry.messages.find(m => m.message_id === msg.message_id && msg.message_id)) {
            cacheEntry.messages.push(msg);
        }
        renderMessages(cacheEntry, selectedUser.user_id, true);
        markChatRead(currentChatId);
        markConversationReadInUI(currentChatId);
    }
    // Refrescar lista de conversaciones para actualizar snippet y contador
    renderConversationList();
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
    renderConversationList();
})();

// Reconexión exponencial simple para socket (si se pierde window.io conexión)
let reconnectAttempts = 0;
function scheduleReconnect(userId, chatIds) {
    const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
    setTimeout(() => {
        reconnectAttempts++;
        initChatSocket(userId, chatIds);
    }, delay);
}

// Hook básico (sobrescribe initChatSocket para añadir listeners de reconexión si se quiere extender)

function renderMessages(cacheEntry, otherUserId, append = false) {
    const { messages, otherUser } = cacheEntry;
    const wasAtBottom = Math.abs(chatMessagesEl.scrollHeight - chatMessagesEl.scrollTop - chatMessagesEl.clientHeight) < 50;
    if (!append) {
        chatMessagesEl.innerHTML = '';
        if (cacheEntry.hasMore) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.textContent = 'Cargar más';
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.onclick = () => loadOlderMessages(otherUserId);
            chatMessagesEl.appendChild(loadMoreBtn);
        }
    } else {
        // Actualizar botón load more (si recién se creó)
        const existingBtn = chatMessagesEl.querySelector('.load-more-btn');
        if (!existingBtn && cacheEntry.hasMore) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.textContent = 'Cargar más';
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.onclick = () => loadOlderMessages(otherUserId);
            chatMessagesEl.insertBefore(loadMoreBtn, chatMessagesEl.firstChild);
        }
    }
    const fragment = document.createDocumentFragment();
    messages.forEach(msg => {
        if (chatMessagesEl.querySelector(`[data-mid="${msg.message_id}"]`)) return; // ya dibujado
        const isOwn = msg.user_id === currentUser.user_id;
        const row = document.createElement('div');
        row.dataset.mid = msg.message_id || `${msg.chat_id}-${msg.sent_date}-${msg.user_id}`;
        row.className = 'msg-row ' + (isOwn ? 'sent' : 'received');
        const bubble = document.createElement('div');
        bubble.className = 'message ' + (isOwn ? 'sent' : 'received');
        const ts = new Date(msg.sent_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const readMark = isOwn ? (msg.read_at ? '<span class="tick-read">✓✓</span>' : '<span class="tick-delivered">✓</span>') : '';
        const author = isOwn ? 'Tú' : (otherUser ? otherUser.first_name : '');
        const otherAvatar = otherUser && otherUser.profile_photo ? otherUser.profile_photo : './src/images/default-avatar.png';
        const selfAvatar = currentUser.profile_photo || currentUser.Profile?.profile_photo || './src/images/default-avatar.png';
        bubble.innerHTML = `<span class="msg-content"><strong>${author ? author + ': ' : ''}</strong>${msg.content}</span><span class="msg-meta">${ts} ${readMark}</span>`;
        if (isOwn) {
            const avatar = document.createElement('img');
            avatar.src = selfAvatar;
            avatar.alt = 'Tú';
            avatar.className = 'msg-avatar self';
            row.appendChild(bubble);
            row.appendChild(avatar);
        } else {
            const avatar = document.createElement('img');
            avatar.src = otherAvatar;
            avatar.alt = author || 'Usuario';
            avatar.className = 'msg-avatar';
            row.appendChild(avatar);
            row.appendChild(bubble);
        }
        fragment.appendChild(row);
    });
    chatMessagesEl.appendChild(fragment);
    if (append && !wasAtBottom) {
        // No forzar scroll si el usuario está revisando mensajes viejos
    } else {
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }
}

async function loadOlderMessages(otherUserId) {
    const cacheEntry = messageCache.get(otherUserId);
    if (!cacheEntry || !cacheEntry.hasMore) return;
    const token = localStorage.getItem('token');
    const before = encodeURIComponent(cacheEntry.oldestTs);
    const res = await fetch(`${API_URL}/chat/messages/${otherUserId}?limit=30&before=${before}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    const older = Array.isArray(data) ? data : data.messages || [];
    if (older.length) {
        cacheEntry.messages = [...older, ...cacheEntry.messages];
        cacheEntry.oldestTs = cacheEntry.messages[0].sent_date;
        cacheEntry.hasMore = !Array.isArray(data) ? data.hasMore : false;
        // Re-render completo conservando scroll relativo
        const prevHeight = chatMessagesEl.scrollHeight;
        renderMessages(cacheEntry, otherUserId);
        const newHeight = chatMessagesEl.scrollHeight;
        chatMessagesEl.scrollTop = newHeight - prevHeight; // mantener posición
    } else {
        cacheEntry.hasMore = false;
        renderMessages(cacheEntry, otherUserId);
    }
}

async function markChatRead(chatId) {
    const token = localStorage.getItem('token');
    try { await fetch(`${API_URL}/chat/read/${chatId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); } catch {}
}

function markConversationReadInUI(chatId){
    if(!chatId) return;
    const el = userListEl.querySelector(`.conversation-item[data-chat-id="${chatId}"]`);
    if(el){
        const badge = el.querySelector('.unread-badge');
        if(badge) badge.remove();
    }
}
