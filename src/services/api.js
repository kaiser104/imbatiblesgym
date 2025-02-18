// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Error en la API:', error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

export default api;
