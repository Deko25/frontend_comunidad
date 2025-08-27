// import { login, register } from '../services/auth.js';
// import { navigate } from './app.js';

// export function setupLoginForm() {
//   const form = document.querySelector('.login-form');
//   const errorDiv = document.getElementById('loginError');
//   const registerLink = document.querySelector('.form-options .link');
//   if (!form) return;

//   form.onsubmit = async (e) => {
//     e.preventDefault();
//     const email = form.email.value;
//     const password = form.password.value;
//     try {
//       const res = await login(email, password);
//       window.location.href = '/home';
//     } catch (err) {
//       if (errorDiv) errorDiv.textContent = err.message || 'Error de autenticación';
//     }
//   };

//   if (registerLink) {
//     registerLink.onclick = (e) => {
//       e.preventDefault();
//       window.history.pushState({}, '', '/register');
//       if (navigate) navigate('/register');
//     };
//   }
// }

// // Register adaptado a nuevo HTML
// export function setupRegisterForm() {
//   const form = document.querySelector('.registration-form');
//   // Si tienes un div para errores, usa su selector aquí
//   const errorDiv = document.getElementById('registerError');
//   const loginLink = document.querySelector('.login-link .link');
//   if (!form) return;
//   form.onsubmit = async (e) => {
//     e.preventDefault();
//     const userData = {
//       nombre: form['nombre'].value,
//       email: form['email'].value,
//       password: form['password'].value,
//       tipoUsuario: form['tipo-usuario'] ? form['tipo-usuario'].value : '',
//     };
//     try {
//       const res = await register(userData);
//       window.location.href = '/login';
//     } catch (err) {
//       if (errorDiv) errorDiv.textContent = err.message || 'Error de registro';
//     }
//   };

//   if (loginLink) {
//     loginLink.onclick = (e) => {
//       e.preventDefault();
//       window.history.pushState({}, '', '/login');
//       if (navigate) navigate('/login');
//     };
//   }
// }

