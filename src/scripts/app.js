import { jwtDecode } from 'jwt-decode';
import { setupLoginForm, setupRegisterForm } from './form-logic.js';

const routes = {
  "/": "/src/pages/login.page.html",
  "/login": "/src/pages/login.page.html",
  "/register": "/src/pages/register.page.html",
  "/home": "/src/pages/home.page.html",
  "/profile-setup": "/src/pages/profile-setup.page.html"
};

const protectedRoutes = ["/home", "/notifications", "/profile", "/chats", "/settings", "/profile-setup"];

async function navigate(pathname, addToHistory = true) {
    const token = localStorage.getItem('token');
    let isAuthenticated = false;

    // First, validate the token
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

    const profileExists = localStorage.getItem('profileExists') === 'true';

    // Handle user status based on authentication and profile existence
    if (isAuthenticated) {
        // If authenticated but profile doesn't exist, redirect to profile setup
        if (!profileExists && pathname !== '/profile-setup') {
            return navigate('/profile-setup');
        }

        // If authenticated and trying to access a public page, redirect to home
        if ((pathname === '/login' || pathname === '/register' || pathname === '/')) {
            return navigate('/home');
        }

    } else { // User is NOT authenticated
        // If they try to access a protected route, redirect them to login
        if (protectedRoutes.includes(pathname)) {
            return navigate('/login');
        }
    }

    // If no redirection is needed, load the page
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
    // You may have other functions here
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