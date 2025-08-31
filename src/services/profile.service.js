import axios from 'axios';

const API_URL = 'http://localhost:3000';

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


export const updateProfile = async (formData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found');

    try {
        const response = await axios.put(`${API_URL}/api/profile`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                // Axios y el navegador se encargarán de establecer el Content-Type correcto con FormData
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateProfilePhoto = async (formData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authentication token not found');

  try {
    const response = await axios.put(
      `${API_URL}/api/profile/photo`, // 👈 aquí agregamos /api
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
