import { renderNotification, timeAgo } from './renderNotification.js';
import { jwtDecode } from 'jwt-decode';
import { setupLoginForm, setupRegisterForm, setupProfileForm } from './form-logic.js';
import { checkProfileStatus, getProfileData } from '../services/profile.service.js'; // Importa getProfileData
import { setupPostPage } from './post.js';
import { getNotifications } from '../services/notification.service.js';
import { initNotificationSocket } from './notification.socket.js';

const routes = {
    "/": "/src/pages/login.page.html",
    "/login": "/src/pages/login.page.html",
    "/register": "/src/pages/register.page.html",
    "/home": "/src/pages/home.page.html",
    "/notifications": "/src/pages/notifications.page.html",
    "/profile": "/src/pages/profile.page.html",
    "/chats": "/src/pages/chats.page.html",
    "/profile-setup": "/src/pages/profile-setup.page.html"
};

const protectedRoutes = ["/home", "/notifications", "/profile", "/chats", "/settings", "/profile-setup"];

// Función para actualizar el sidebar con los datos del perfil
async function updateSidebar() {
    try {
        const profile = await getProfileData();
        const userImage = document.querySelector('.user-avatar img');
        const userName = document.querySelector('.user-info h3');
        const userEmail = document.querySelector('.user-info p');
        const API_URL = 'http://localhost:3000/';

        if (userImage && userName && userEmail) {
            userImage.src = profile.profile_photo ? profile.profile_photo : './src/images/default-avatar.png'; // Usa una imagen por defecto
            userName.textContent = `${profile.User.first_name} ${profile.User.last_name}`;
            userEmail.textContent = profile.User.email;
        }
        // Inicializar socket de notificaciones
        if (profile.profile_id) {
            initNotificationSocket(profile.profile_id, (notification) => {
                renderNotification(notification);
            });
        }
    } catch (error) {
        console.error('Failed to update sidebar with profile data:', error);
    }
}

async function navigate(pathname, addToHistory = true) {
    const token = localStorage.getItem('token');
    let isAuthenticated = false;

    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            if (decodedToken.exp * 1000 > Date.now()) {
                isAuthenticated = true;
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('profileExists');
            }
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('profileExists');
        }
    }

    if (isAuthenticated) {
        const profileExists = await checkProfileStatus();

        if (!profileExists && pathname !== '/profile-setup') {
            return navigate('/profile-setup');
        }

        if ((pathname === '/login' || pathname === '/register' || pathname === '/')) {
            return navigate('/home');
        }

    } else {
        if (protectedRoutes.includes(pathname)) {
            return navigate('/login');
        }
    }

    const route = routes[pathname] || routes["/"];
    try {
        const html = await fetch(route).then(res => res.text());

        document.getElementById("app").innerHTML = html;

        const sidebarRoutes = ["/home", "/notifications", "/profile", "/settings", "/chats"];
        if (sidebarRoutes.includes(pathname)) {
            try {
                const sidebarHtml = await fetch("/src/components/sidebar.html").then(res => res.text());
                const appContainer = document.getElementById("app");
                let container = appContainer.querySelector('.container');
                if (!container) {
                    container = document.createElement('div');
                    container.className = 'container';
                    while (appContainer.firstChild) {
                        container.appendChild(appContainer.firstChild);
                    }
                    appContainer.appendChild(container);
                }
                if (!container.querySelector('.sidebar')) {
                    container.insertAdjacentHTML('afterbegin', sidebarHtml);
                }
                updateSidebar(); // <-- Llama a esta función después de que el sidebar esté en el DOM
                // Si está en la vista de notificaciones, renderiza las notificaciones actuales
                if (pathname === '/notifications') {
                    renderAllNotifications();
                }
            } catch (err) {
                console.error('Error loading sidebar:', err);
            }
        }
// Renderizar todas las notificaciones al cargar la vista
async function renderAllNotifications() {
    try {
        const notifications = await getNotifications();
        const container = document.querySelector('.notifications-container');
        if (container) {
            container.innerHTML = '<div class="notifications-title">NOTIFICATIONS</div>';
            notifications.forEach(renderNotification);
        }
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
    }
}

// Renderizar una notificación individual
function renderNotification(notification) {
    const container = document.querySelector('.notifications-container');
    if (!container) return;
    const API_URL = 'http://localhost:3000/';
    const card = document.createElement('div');
    card.className = 'card left';
    card.innerHTML = `
    <img src="${notification.Profile?.profile_photo ? notification.Profile.profile_photo : './src/images/default-avatar.png'}" alt="${notification.Profile?.User?.first_name || 'Usuario'}" class="avatar">
        <div class="info">
            <div class="top">
                <span class="name">${notification.Profile?.User?.first_name || ''} ${notification.Profile?.User?.last_name || ''}</span>
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
function timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);
    if (diff < 60) return `${diff} segundos ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutos ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} horas ago`;
    return `${Math.floor(diff / 86400)} días ago`;
}

const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('profileExists');
            navigate('/login');
    });
    }

    if (addToHistory) {
    history.pushState({}, "", pathname);
    }

    runPageScripts(pathname);

    } catch (error) {
    console.error('Error al cargar la página:', error);
    }
}

function runPageScripts(pathname) {
    if (pathname === '/login' || pathname === '/') {
        setupLoginForm(navigate);
    } else if (pathname === '/register') {
        setupRegisterForm(navigate);
    } else if (pathname === '/home') {
        setupPostPage(navigate);
    } else if (pathname === '/profile-setup') {
        setupProfileForm(navigate);
    }
};

document.body.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if (link) {
        e.preventDefault();
        const path = link.getAttribute("href");
        navigate(path);
    }
});

window.addEventListener("popstate", () => {
    navigate(location.pathname, false);
});

document.addEventListener("DOMContentLoaded", () => {
    navigate(location.pathname, false);
});

export { navigate };