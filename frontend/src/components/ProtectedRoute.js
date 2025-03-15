import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  // Añade un console.log para depurar
  console.log("Estado de autenticación:", { currentUser, loading });
  
  // Si está cargando, muestra un indicador de carga
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Si no hay usuario autenticado, redirige al login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Si hay un usuario autenticado, muestra el contenido protegido
  return children;
};

export default ProtectedRoute;