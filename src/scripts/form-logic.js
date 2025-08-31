import axios from 'axios';
import { login, register } from '../services/auth.js';
import { createProfile, getProfileData } from '../services/profile.service.js';

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
            // Manejo de errores con Swal.fire
            Swal.fire({
                icon: 'error',
                title: 'Error de autenticación',
                text: err.message || 'Credenciales inválidas. Intenta de nuevo.'
            });
        }
    };

    const registerLink = document.querySelector('.form-options .link[data-link]');
    if (registerLink) {
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
            Swal.fire({
                icon: 'warning',
                title: 'Advertencia',
                text: 'Por favor, selecciona un tipo de usuario.'
            });
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
            await Swal.fire({
                icon: 'success',
                title: 'Registro exitoso',
                text: '¡Por favor, inicia sesión para continuar!'
            });
            navigate('/login');
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error de registro',
                text: err.message || 'Ocurrió un error. Intenta de nuevo.'
            });
        }
    };
    
    const loginLink = document.querySelector('.login-link .link[data-link]');
    if (loginLink) {
    }
}

export async function setupProfileForm(navigate) { // <-- La función ahora es asíncrona
    const form = document.getElementById('profile-form');
    const photoInput = document.getElementById('photoInput');
    const previewImage = document.getElementById('previewImage');
    const bioTextarea = document.getElementById('bio');
    const submitButton = form.querySelector('button[type="submit"]');

    if (!form) return;


    try {
        const profile = await getProfileData();
        if (profile) {
            // Rellena el formulario con los datos existentes
            bioTextarea.value = profile.bio || '';
            if (profile.profile_photo) {
                previewImage.src = profile.profile_photo;
                previewImage.style.display = 'block';
            }
            // Cambia el texto del botón
            submitButton.textContent = 'ACTUALIZAR PERFIL';
        }
    } catch (error) {
        console.error('No se pudo cargar el perfil, asumiendo que es un perfil nuevo.');
        
    }

    // Vista previa de la foto de perfil
    photoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImage.src = event.target.result;
                previewImage.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    };

    form.onsubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('bio', bioTextarea.value);

        if (photoInput.files[0]) {
            formData.append('profilePhoto', photoInput.files[0]);
        }

        try {
            await createProfile(formData);
            navigate('/home');
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: '¡Perfil guardado exitosamente!'
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'Error al guardar el perfil.'
            });
        }
    };
}