import { renderNotification, timeAgo, renderAllNotifications} from './renderNotification.js';
import sidebarRaw from '../components/sidebar.html?raw';
import { jwtDecode } from 'jwt-decode';
import { setupLoginForm, setupRegisterForm, setupProfileForm } from './form-logic.js';
import { checkProfileStatus, getProfileData } from '../services/profile.service.js';
import { setupSettingsPage } from './settings.js';
import { setupProfilePage } from './profile.page.js';
import { setupPostPage } from './post.js';
import { getNotifications } from '../services/notification.service.js';
import { initNotificationSocket } from './notification.socket.js';

const routes = {
    "/": "/pages/login.page.html",
    "/login": "/pages/login.page.html",
    "/register": "./pages/register.page.html",
    "/home": "/pages/home.page.html",
    "/notifications": "/pages/notifications.page.html",
    "/profile": "/pages/profile.page.html",
    "/chats": "/pages/chats.page.html",
    "/settings": "/pages/settings.page.html",
    "/profile-setup": "/pages/profile-setup.page.html"
};

const protectedRoutes = ["/home", "/notifications", "/profile", "/chats", "/settings", "/profile-setup"];

async function updateSidebar() {
    try {
        const profile = await getProfileData();
        const userImage = document.querySelector('.user-avatar img');
        const userName = document.querySelector('.user-info h3');
        const userEmail = document.querySelector('.user-info p');
    // URLs ahora centralizadas en config.js (API_BASE_URL)

        if (userImage && userName && userEmail) {
            userImage.src = profile.profile_photo ? profile.profile_photo : './src/images/default-avatar.png';
            userName.textContent = `${profile.User.first_name} ${profile.User.last_name}`;
            userEmail.textContent = profile.User.email;
        }
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
        injectSidebar();
        updateSidebar();
        setActiveNavItem(pathname);
        if (pathname === '/notifications') {
            renderAllNotifications(getNotifications);
        }
    }
        


        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const result = await Swal.fire({
                    title: '¿Estás seguro?',
                    text: 'Se cerrará tu sesión.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#705FFF',
                    cancelButtonColor: '#f2f3f5',
                    confirmButtonText: 'Sí, cerrar sesión',
                    customClass: {
                        cancelButton: 'cancel-btn-class'
                    }
                });

                if (result.isConfirmed) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('profileExists');
                    navigate('/login');
                }
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

// Marca el enlace activo en el sidebar basándose en la ruta actual
function setActiveNavItem(currentPath) {
    const navItems = document.querySelectorAll('.sidebar .nav-menu .nav-item');
    if (!navItems.length) return;
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPath) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
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
    } else if (pathname === '/chats') {
        import('./chats.script.js');
    } else if (pathname === '/profile') {
        setupProfilePage();
    } else if (pathname === '/settings') {
        setupSettingsPage(navigate); 
    }
}

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

function injectSidebar() {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;
    let container = appContainer.querySelector('.container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'container';
        while (appContainer.firstChild) {
            container.appendChild(appContainer.firstChild);
        }
        appContainer.appendChild(container);
    }
    if (container.querySelector('.sidebar')) return; // ya insertado (p.ej. settings.page.html lo trae inline)
    const sidebarHtml = extractSidebar(sidebarRaw);
    if (sidebarHtml) {
        container.insertAdjacentHTML('afterbegin', sidebarHtml);
    } else {
        console.warn('[SIDEBAR] No se pudo extraer el bloque .sidebar del HTML raw');
    }
}

function extractSidebar(raw) {
    if (!raw) return '';
    // El archivo incluye un wrapper .container externo; recorta desde <div class="sidebar" ... hasta su cierre
    const start = raw.indexOf('<div class="sidebar"');
    if (start === -1) return raw; // fallback
    // Buscar el cierre del primer nivel de sidebar: contamos aperturas/cierres de <div>
    let depth = 0; let i = start; const len = raw.length;
    while (i < len) {
        if (raw.slice(i).startsWith('<div')) { depth++; i += 4; }
        else if (raw.slice(i).startsWith('</div')) { depth--; i += 5; if (depth === 0) { // fin de sidebar
                // incluir este cierre
                return raw.slice(start, i + 1);
            } }
        else { i++; }
    }
    return raw.slice(start); // fallback si no cerró
}

