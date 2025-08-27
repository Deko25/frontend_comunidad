import { createPost, getPosts } from '../services/post.service.js';

function renderPost(post) {
    // Esta función crea el HTML para un solo post
    const postElement = document.createElement('div');
    postElement.classList.add('post');

    const authorName = post.Profile.User.first_name + ' ' + post.Profile.User.last_name;

    let mediaContent = '';
    if (post.image_url) {
        mediaContent = `<img src="http://localhost:3000/${post.image_url}" alt="Post Image" class="post-image">`;
    } else if (post.code_url) {
        mediaContent = `<pre><code class="language-javascript">...</code></pre><p>Archivo de código: <a href="http://localhost:3000/${post.code_url}">Descargar</a></p>`;
    } else if (post.file_url) {
        mediaContent = `<p>Archivo adjunto: <a href="http://localhost:3000/${post.file_url}">Descargar</a></p>`;
    }

    postElement.innerHTML = `
        <div class="post-header">
            <img src="assets/default-user.png" alt="User Avatar" class="post-avatar">
            <div class="post-info">
                <span class="post-author">${authorName}</span>
                <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
            </div>
        </div>
        <div class="post-content">
            <p>${post.text_content}</p>
            ${mediaContent}
        </div>
        <div class="post-actions">
            </div>
    `;
    return postElement;
}

async function fetchAndRenderPosts() {
    try {
        const posts = await getPosts();
        const feedContainer = document.getElementById('feed');
        if (feedContainer) {
            feedContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = renderPost(post);
                feedContainer.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

export function setupPostPage() {
    const postBtn = document.getElementById('postBtn');
    const postTextarea = document.getElementById('postText');
    const privacySelect = document.getElementById('privacy');

    // Manejadores de eventos para los inputs de archivo
    const imageInput = document.getElementById('imageInput');
    const codeInput = document.getElementById('codeInput');
    const fileInput = document.getElementById('fileInput');

    if (postBtn && postTextarea) {
        postBtn.addEventListener('click', async () => {
            const postContent = postTextarea.value;
            const privacy = privacySelect.value;
            const formData = new FormData();

            // Agregar contenido de texto y privacidad
            formData.append('text_content', postContent);
            formData.append('privacy', privacy);

            // Agregar el archivo subido al FormData
            if (imageInput.files.length > 0) {
                formData.append('postFile', imageInput.files[0]);
            } else if (codeInput.files.length > 0) {
                formData.append('postFile', codeInput.files[0]);
            } else if (fileInput.files.length > 0) {
                formData.append('postFile', fileInput.files[0]);
            }

            try {
                await createPost(formData);
                console.log('Post creado con éxito');
                postTextarea.value = '';
                imageInput.value = '';
                codeInput.value = '';
                fileInput.value = '';
                fetchAndRenderPosts();
            } catch (err) {
                console.error('Error al crear el post:', err);
                alert('Error al crear el post: ' + (err.message || 'Inténtalo de nuevo.'));
            }
        });
    }

    fetchAndRenderPosts();
}