import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";  // ✅ Asegúrate de que el backend esté corriendo en este puerto

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error en la API:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
