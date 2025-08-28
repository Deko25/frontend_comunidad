
import { createPost, getPosts, deletePost, updatePost } from '../services/post.service.js';
import { getProfileData } from '../services/profile.service.js';

let currentEditingPostId = null;

// Función para renderizar cada post en el feed
function renderPost(post, currentProfileId) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');

    const API_URL = 'http://localhost:3000/';

    // Accede a los datos del perfil y usuario de forma segura
    const authorName = post.Profile && post.Profile.User
        ? `${post.Profile.User.first_name} ${post.Profile.User.last_name}`
        : 'Usuario Desconocido'; 

    const profilePhotoUrl = post.Profile && post.Profile.profile_photo
        ? `${API_URL}${post.Profile.profile_photo}`
        : 'assets/default-user.png';
    
    // Contenido multimedia
    let mediaContent = '';
    if (post.image_url) {
        mediaContent = `<img src="${API_URL}${post.image_url}" alt="Post Image" class="post-image">`;
    } else if (post.code_url) {
        mediaContent = `<pre><code class="language-javascript">...</code></pre><p>Archivo de código: <a href="${API_URL}${post.code_url}">Descargar</a></p>`;
    } else if (post.file_url) {
        mediaContent = `<p>Archivo adjunto: <a href="${API_URL}${post.file_url}">Descargar</a></p>`;
    }

    // Emoji de privacidad
    let privacyEmoji = '';
    if (post.privacy === 'Public') {
        privacyEmoji = '🌍';
    } else if (post.privacy === 'Friends') {
        privacyEmoji = '👥';
    } else if (post.privacy === 'Only Me') {
        privacyEmoji = '🔒';
    }
    
    // Añadir botones de editar y eliminar solo si el post es del usuario logueado
    let actionButtons = '';
    if (post.profile_id === currentProfileId) {
        actionButtons = `
            <button class="edit-btn" data-post-id="${post.post_id}">Editar</button>
            <button class="delete-btn" data-post-id="${post.post_id}">Eliminar</button>
        `;
    }

    postElement.innerHTML = `
        <div class="post-header">
            <img src="${profilePhotoUrl}" alt="User Avatar" class="post-avatar">
            <div class="post-info">
                <span class="post-author">${authorName}</span>
                <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
                <span class="post-privacy">${privacyEmoji} ${post.privacy}</span>
            </div>
        </div>
        <div class="post-content">
            <p>${post.text_content}</p>
            ${mediaContent}
        </div>
        <div class="post-actions">
            ${actionButtons}
        </div>
    `;

    // Manejadores de eventos para los botones de acción
    const deleteBtn = postElement.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
                try {
                    await deletePost(post.post_id);
                    console.log('Post eliminado con éxito');
                    fetchAndRenderPosts(); // Recargar el feed
                } catch (error) {
                    console.error('Error al eliminar el post:', error);
                    alert('No se pudo eliminar la publicación.');
                }
            }
        });
    }

    const editBtn = postElement.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            setEditMode(post);
            document.querySelector('.post-creator').scrollIntoView({ behavior: 'smooth' });
        });
    }

    return postElement;
}

// Función para obtener y renderizar todos los posts
async function fetchAndRenderPosts() {
    try {
        const profile = await getProfileData();
        const currentProfileId = profile.profile_id;
        const posts = await getPosts();
        const feedContainer = document.getElementById('feed');
        if (feedContainer) {
            feedContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = renderPost(post, currentProfileId);
                feedContainer.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

// Función para previsualizar los archivos
function setupFilePreview() {
    const imageInput = document.getElementById('imageInput');
    const codeInput = document.getElementById('codeInput');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('preview-area');

    const handleFileChange = (event) => {
        previewArea.innerHTML = '';
        const file = event.target.files[0];
        if (file) {
            const fileURL = URL.createObjectURL(file);
            const fileType = file.type;

            if (fileType.startsWith('image/')) {
                previewArea.innerHTML = `<img src="${fileURL}" alt="Preview" class="preview-image">`;
            } else if (fileType.includes('text') || file.name.endsWith('.js') || file.name.endsWith('.py')) {
                previewArea.innerHTML = `<div class="preview-code"><p>Archivo de código seleccionado: <strong>${file.name}</strong></p></div>`;
            } else {
                previewArea.innerHTML = `<div class="preview-file"><p>Archivo seleccionado: <strong>${file.name}</strong></p></div>`;
            }
        }
    };

    imageInput.addEventListener('change', handleFileChange);
    codeInput.addEventListener('change', handleFileChange);
    fileInput.addEventListener('change', handleFileChange);
}

// Función para actualizar la foto de perfil en el creador de posts
async function updatePostCreatorProfilePhoto() {
    try {
        const profile = await getProfileData();
        const postAvatarImg = document.querySelector('.post-creator .post-avatar');
        if (postAvatarImg && profile.profile_photo) {
            const API_URL = 'http://localhost:3000/';
            postAvatarImg.src = `${API_URL}${profile.profile_photo}`;
        }
    } catch (error) {
        console.error('Error al actualizar la foto de perfil del creador de posts:', error);
    }
}

// Función para limpiar el formulario de creación de post
function clearPostForm() {
    document.getElementById('postText').value = '';
    document.getElementById('imageInput').value = '';
    document.getElementById('codeInput').value = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('preview-area').innerHTML = '';
    document.getElementById('privacy').value = 'Public';
}

// Función para entrar en modo de edición
function setEditMode(post) {
    currentEditingPostId = post.post_id;
    const postTextarea = document.getElementById('postText');
    const privacySelect = document.getElementById('privacy');
    const postBtn = document.getElementById('postBtn');
    const clearBtn = document.getElementById('clearBtn');
    const previewArea = document.getElementById('preview-area');
    
    // Rellenar el formulario
    postTextarea.value = post.text_content;
    privacySelect.value = post.privacy;
    
    // Cambiar el botón para el modo de actualización
    postBtn.textContent = 'Actualizar Post';
    postBtn.dataset.mode = 'update';
    if (clearBtn) clearBtn.style.display = 'none';

    // Mostrar la previsualización del archivo o imagen actual
    previewArea.innerHTML = '';
    const API_URL = 'http://localhost:3000/';
    if (post.image_url) {
        previewArea.innerHTML = `<img src="${API_URL}${post.image_url}" alt="Preview" class="preview-image">`;
    } else if (post.code_url) {
        previewArea.innerHTML = `<div class="preview-code"><p>Archivo de código actual: <strong>${post.code_url.split('/').pop()}</strong></p></div>`;
    } else if (post.file_url) {
        previewArea.innerHTML = `<div class="preview-file"><p>Archivo actual: <strong>${post.file_url.split('/').pop()}</strong></p></div>`;
    }
}

// Función para volver al modo de creación
function setCreateMode() {
    currentEditingPostId = null;
    const postBtn = document.getElementById('postBtn');
    const clearBtn = document.getElementById('clearBtn');

    // Restaurar el botón de POST
    postBtn.textContent = 'POST';
    postBtn.dataset.mode = 'create';
    if (clearBtn) clearBtn.style.display = 'inline-block';
    clearPostForm();
}


// Función principal de configuración de la página de posts
export function setupPostPage() {
    const postBtn = document.getElementById('postBtn');
    const clearBtn = document.getElementById('clearBtn');
    const postTextarea = document.getElementById('postText');
    const privacySelect = document.getElementById('privacy');
    
    if (postBtn) {
        postBtn.addEventListener('click', async () => {
            const postContent = postTextarea.value;
            const privacy = privacySelect.value;
            const formData = new FormData();
            
            formData.append('text_content', postContent);
            formData.append('privacy', privacy);
            
            const imageInput = document.getElementById('imageInput');
            const codeInput = document.getElementById('codeInput');
            const fileInput = document.getElementById('fileInput');
            
            if (imageInput.files.length > 0) {
                formData.append('postFile', imageInput.files[0]);
            } else if (codeInput.files.length > 0) {
                formData.append('postFile', codeInput.files[0]);
            } else if (fileInput.files.length > 0) {
                formData.append('postFile', fileInput.files[0]);
            }
            
            try {
                if (postBtn.dataset.mode === 'update') {
                    await updatePost(currentEditingPostId, formData);
                    console.log('Post actualizado con éxito');
                    setCreateMode();
                } else {
                    await createPost(formData);
                    console.log('Post creado con éxito');
                    clearPostForm();
                }
                fetchAndRenderPosts();
            } catch (err) {
                console.error('Error al procesar el post:', err);
                alert('Error al procesar el post: ' + (err.message || 'Inténtalo de nuevo.'));
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearPostForm();
        });
    }

    // Llamadas a las funciones de inicialización
    setupFilePreview();
    updatePostCreatorProfilePhoto();
    fetchAndRenderPosts();
}