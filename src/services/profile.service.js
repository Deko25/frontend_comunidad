import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const API_URL = API_BASE_URL;

export const createProfile = async (profileData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found');

    try {
        const response = await axios.put(`${API_URL}/api/profile`, profileData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const checkProfileStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await axios.get(`${API_URL}/api/profile/status`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.profileExists;
    } catch (error) {
        return false;
    }
};

export const getProfileData = async () => { // <-- Agrega esta nueva función
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found');

    try {
        const response = await axios.get(`${API_URL}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching profile data:", error);
        throw error;
    }
};