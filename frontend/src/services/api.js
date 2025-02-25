// src/services/api.js
import axios from 'axios';

// Configuramos una instancia de axios con la URL base del backend Django.
// Asegúrate de que el backend esté corriendo (por ejemplo, en http://127.0.0.1:8000)
// y que hayas configurado las rutas de la API (por ejemplo, con Django REST Framework).
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Ajusta esta URL según tus endpoints.
});

export default api;
