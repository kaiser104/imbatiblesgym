// src/services/api.js
import axios from 'axios';

// Se configura una instancia de axios con la URL base del backend Django.
// Asegúrate de que el servidor Django esté corriendo en http://127.0.0.1:8000
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

export default api;
