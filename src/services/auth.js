// Servicio de autenticación usando axios
const API_URL = 'http://localhost:3000';

export async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/api/login`, { email, password });
    const data = response.data;
    // Guardar el token JWT en localStorage si existe
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

export async function register(userData) {
  try {
    const response = await axios.post(`${API_URL}/api/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}
