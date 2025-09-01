import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const API_URL = `${API_BASE_URL}/api`;

const getToken = () => localStorage.getItem('token');

export async function getNotifications() {
    try {
        const response = await axios.get(`${API_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
}

export async function markAsRead(notificationId) {
    try {
        const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
}
