import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }
  
  // If authenticated, render the children components
  return children;
};

export default PrivateRoute;