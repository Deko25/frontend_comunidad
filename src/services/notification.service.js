export async function getNotifications(token) {
  try {
    const response = await fetch('http://localhost:3000/api/notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Error al obtener notificaciones');
    return await response.json();
  } catch (error) {
    console.error('Error en getNotifications:', error);
    return [];
  }
}
