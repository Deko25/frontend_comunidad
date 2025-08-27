// src/scripts/form-logic.js
import axios from 'axios';
import { login, register } from '../services/auth.js';

// Nuevo servicio para obtener los roles
const API_URL = 'http://localhost:3000';

async function getRoles() {
    try {
        const response = await axios.get(`${API_URL}/api/roles`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
}

// Función para llenar el select de roles dinámicamente
async function fetchAndPopulateRoles() {
    const roleSelect = document.getElementById('role-select');
    if (!roleSelect) {
        console.error('Elemento con ID "role-select" no encontrado.');
        return;
    }

    try {
        const roles = await getRoles();
        
        // Limpiamos las opciones existentes
        roleSelect.innerHTML = '';
        
        // Creamos la opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Selecciona un rol';
        defaultOption.value = '';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        roleSelect.appendChild(defaultOption);

        // Llenamos el select con los roles de la base de datos
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.role_id;
            option.textContent = role.role_name;
            roleSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error al obtener los roles:', error);
        roleSelect.innerHTML = '<option value="">Error al cargar roles</option>';
    }
}


export function setupLoginForm(navigate) {
    const form = document.querySelector('.login-form');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const email = form.email.value;
        const password = form.password.value;
        try {
        const res = await login(email, password);
        // Redirección con navigate para evitar recargar la página
        navigate('/home'); 
        } catch (err) {
        // Manejo de errores en el front
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) errorDiv.textContent = err.message || 'Error de autenticación';
        alert(err.message || 'Error de autenticación');
        }
    };

    const registerLink = document.querySelector('.form-options .link[data-link]');
    if (registerLink) {
        // El enrutador ya maneja el clic, no necesitas un `onclick` adicional
        // Solo asegúrate de que el HTML tenga `data-link` en el enlace
    }
}

export function setupRegisterForm(navigate) {
    const form = document.querySelector('.registration-form');
    if (!form) return;
    
    // Llamamos a la función para llenar el select de roles
    fetchAndPopulateRoles();
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const roleId = form['role-select'].value;
        if (!roleId) {
            alert('Por favor, selecciona un tipo de usuario.');
            return;
        }

        const userData = {
            first_name: form['first-name'].value,
            last_name: form['last-name'].value,
            email: form['email'].value,
            password: form['password'].value,
            role_id: roleId
        };
        
        try {
            await register(userData);
            navigate('/login');
            alert('¡Registro exitoso! Por favor, inicia sesión.');
        } catch (err) {
            const errorDiv = document.getElementById('registerError');
            if (errorDiv) errorDiv.textContent = err.message || 'Error de registro';
            alert(err.message || 'Error de registro');
        }
    };
    
    const loginLink = document.querySelector('.login-link .link[data-link]');
    if (loginLink) {
        // El enrutador ya maneja el clic
    }
}
