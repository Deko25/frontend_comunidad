import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const API_URL = `${API_BASE_URL}/api`;

const getToken = () => localStorage.getItem('token');

// Función para crear un post con FormData
export async function createPost(postData) {
    try {
        const response = await axios.post(`${API_URL}/posts`, postData, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Función para obtener todos los posts
export async function getPosts() {
    try {
        const response = await axios.get(`${API_URL}/posts`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// ** Nueva función para eliminar un post **
export async function deletePost(postId) {
    try {
        const response = await axios.delete(`${API_URL}/posts/${postId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// ** Nueva función para actualizar un post **
export async function updatePost(postId, postData) {
    try {
        const response = await axios.put(`${API_URL}/posts/${postId}`, postData, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                // Aseguramos multipart para backend que espera form-data
                'Content-Type': 'multipart/form-data'
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export async function createComment(postId, content) {
    try {
        const response = await axios.post(`${API_URL}/posts/${postId}/comments`, { content }, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export async function createReaction(postId, reactionType) {
    try {
        const response = await axios.post(`${API_URL}/posts/${postId}/reactions`, { reaction_type: reactionType }, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
