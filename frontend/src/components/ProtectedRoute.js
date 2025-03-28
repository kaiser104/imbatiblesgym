import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CircularProgress, Box, Typography } from '@mui/material';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Verificar si es super-administrador
        const adminQuery = query(
          collection(db, 'usuarios'),
          where('uid', '==', currentUser.uid),
          where('role', '==', 'super-administrador')
        );
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          setUserRole('super-administrador');
          setLoading(false);
          return;
        }
        
        // Verificar si es gimnasio
        const gymQuery = query(
          collection(db, 'gimnasios'),
          where('adminUid', '==', currentUser.uid)
        );
        const gymSnapshot = await getDocs(gymQuery);
        
        if (!gymSnapshot.empty) {
          setUserRole('gimnasio');
          setLoading(false);
          return;
        }
        
        // Verificar si es entrenador
        const trainerQuery = query(
          collection(db, 'entrenadores'),
          where('uid', '==', currentUser.uid)
        );
        const trainerSnapshot = await getDocs(trainerQuery);
        
        if (!trainerSnapshot.empty) {
          setUserRole('entrenador');
          setLoading(false);
          return;
        }
        
        // Si no es ninguno de los anteriores
        setUserRole('usuario');
        setLoading(false);
      } catch (err) {
        console.error('Error al verificar rol de usuario:', err);
        setLoading(false);
      }
    };

    checkUserRole();
  }, [currentUser]);

  useEffect(() => {
    if (!loading && userRole) {
      // Si hay roles requeridos y el usuario no tiene uno de ellos
      if (
        requiredRoles.length > 0 && 
        !requiredRoles.includes(userRole)
      ) {
        setAccessDenied(true);
      }
    }
  }, [loading, userRole, requiredRoles]);

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#121212'
        }}
      >
        <CircularProgress sx={{ color: '#BBFF00' }} />
        <Typography variant="body1" sx={{ mt: 2, color: '#FFFFFF' }}>
          Verificando permisos...
        </Typography>
      </Box>
    );
  }

  if (accessDenied) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#121212',
          color: '#FFFFFF',
          padding: 3
        }}
      >
        <Typography variant="h4" sx={{ color: '#f44336', mb: 2 }}>
          Acceso Denegado
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          No tienes permisos para acceder a esta sección.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.history.back()}
          sx={{ 
            backgroundColor: '#BBFF00', 
            color: '#121212',
            '&:hover': {
              backgroundColor: '#a0d800'
            }
          }}
        >
          Volver
        </Button>
      </Box>
    );
  }

  // Para la ruta de gestión de usuarios, verificar roles específicos
  if (window.location.pathname === '/gestion-usuarios') {
    const allowedRoles = ['super-administrador', 'gimnasio', 'entrenador'];
    if (!allowedRoles.includes(userRole)) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#121212',
            color: '#FFFFFF',
            padding: 3
          }}
        >
          <Typography variant="h4" sx={{ color: '#f44336', mb: 2 }}>
            Acceso Denegado
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            No tienes permisos para acceder a la gestión de usuarios.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.history.back()}
            sx={{ 
              backgroundColor: '#BBFF00', 
              color: '#121212',
              '&:hover': {
                backgroundColor: '#a0d800'
              }
            }}
          >
            Volver
          </Button>
        </Box>
      );
    }
  }

  return children;
};

export default ProtectedRoute;