import { setupLoginForm, setupRegisterForm } from './form-logic.js';

const routes = {
  "/": "/src/pages/login.page.html",
  "/login": "/src/pages/login.page.html",
  "/register": "/src/pages/register.page.html",
  // ... agrega el resto de tus rutas aquí
  "/home": "/src/pages/home.page.html"
};

const protectedRoutes = ["/home", "/notifications", "/profile", "/chats", "/settings"];

async function navigate(pathname, addToHistory = true) {
  const token = localStorage.getItem('token');
  const isAuthenticated = token !== null;

  if (protectedRoutes.includes(pathname) && !isAuthenticated) {
    console.warn('Acceso denegado. Redirigiendo a login.');
    return navigate('/login');
  }

  const route = routes[pathname] || routes["/"];
  try {
    const html = await fetch(route).then(res => res.text());
    
    // Inyecta el HTML en el contenedor principal
    document.getElementById("app").innerHTML = html;

    // Cargar el sidebar solo en las rutas específicas
    const sidebarRoutes = ["/home", "/notifications", "/profile", "/settings"];
    if (sidebarRoutes.includes(pathname)) {
      try {
        const sidebarHtml = await fetch("/src/components/sidebar.html").then(res => res.text());
        // Si usas el grid .container, inserta el sidebar antes del main-content
        const appContainer = document.getElementById("app");
        // Crear un contenedor si no existe
        let container = appContainer.querySelector('.container');
        if (!container) {
          container = document.createElement('div');
          container.className = 'container';
          // Mover el contenido actual al container
          while (appContainer.firstChild) {
            container.appendChild(appContainer.firstChild);
          }
          appContainer.appendChild(container);
        }
        // Insertar el sidebar al inicio del container si no existe
        if (!container.querySelector('.sidebar')) {
          container.insertAdjacentHTML('afterbegin', sidebarHtml);
        }
      } catch (err) {
        console.error('Error al cargar el sidebar:', err);
      }
    }

    if (addToHistory) {
      history.pushState({}, "", pathname);
    }
    
    // Ejecutar la lógica de la página después de inyectar el HTML
    runPageScripts(pathname);

  } catch (error) {
    console.error('Error al cargar la página:', error);
  }
}

// Esta función se encarga de ejecutar la lógica específica de cada página
function runPageScripts(pathname) {
  if (pathname === '/login' || pathname === '/') {
    setupLoginForm(navigate);
  } else if (pathname === '/register') {
    setupRegisterForm(navigate);
  }
  // Puedes agregar más else if para otras páginas
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

// Inicialización de la SPA al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  navigate(location.pathname, false);
});

// Exporta la función navigate para que otros módulos la puedan usar
export { navigate };