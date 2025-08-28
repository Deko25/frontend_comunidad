import { jwtDecode } from 'jwt-decode';
import { setupLoginForm, setupRegisterForm, setupProfileForm } from './form-logic.js';
import { checkProfileStatus, getProfileData } from '../services/profile.service.js'; // Importa getProfileData
import { setupPostPage } from './post.js';

const routes = {
  "/": "/src/pages/login.page.html",
  "/login": "/src/pages/login.page.html",
  "/register": "/src/pages/register.page.html",
  "/home": "/src/pages/home.page.html",
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
            userImage.src = profile.profile_photo ? `${API_URL}${profile.profile_photo}` : './src/images/default-avatar.png'; // Usa una imagen por defecto
            userName.textContent = `${profile.User.first_name} ${profile.User.last_name}`;
            userEmail.textContent = profile.User.email;
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
            } catch (err) {
                console.error('Error loading sidebar:', err);
            }
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