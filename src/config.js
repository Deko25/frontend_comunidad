// Centralización de configuración de URLs para API y Socket.
// Prioriza variables de entorno de Vite (despliegue / build) y luego variables globales inyectadas (fallback),
// finalmente localhost para entorno de desarrollo local.

export const API_BASE_URL = (
  import.meta?.env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
  'https://backend-comunidad-uyx5.onrender.com'
).replace(/\/$/, ''); // quitar slash final si existe

export const SOCKET_URL = (
  import.meta?.env?.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' && window.__SOCKET_URL__) ||
  API_BASE_URL
).replace(/\/$/, '');

// Helper para construir rutas a archivos almacenados en el backend cuando recibimos paths relativos
export function buildFileUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // ya es absoluta
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
}
