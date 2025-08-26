// Rutas para las 7 vistas
const routes = {
  "/": "/src/pages/login.page.html",
  "/login": "./src/pages/login.page.html",
  "/register": "/src/pages/register.page.html",
  "/home": "/src/pages/home.page.html",
  "/notifications": "/src/pages/notifications.page.html",
  "/profile": "/src/pages/profile.page.html",
  "/chats": "/src/pages/chats.page.html",
  "/settings": "/src/pages/settings.page.html"
};

// Navegación SPA básica
async function navigate(pathname, addToHistory = true) {
  const route = routes[pathname] || routes["/"];
  const html = await fetch(route).then(res => res.text());
  
  // Sidebar solo en vistas 3 a 7
  if (["/home","/notifications","/profile","/chats","/settings"].includes(pathname)) {
    const sidebar = await fetch("/src/components/sidebar.html").then(res => res.text());
    document.getElementById("app").innerHTML = sidebar + html;
  } else {
    document.getElementById("app").innerHTML = html;
  }

  if (addToHistory) {
    history.pushState({}, "", pathname);
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

// Inicialización
navigate(location.pathname, false);
