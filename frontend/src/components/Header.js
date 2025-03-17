import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar 
} from '@mui/material';
import { AccountCircle, Logout, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      console.log("Usuario autenticado:", user);
      setCurrentUser(user);
    });
    
    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, []);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleLogout = () => {
    // Implementar cierre de sesión
    auth.signOut()
      .then(() => {
        navigate('/login');
      })
      .catch(error => {
        console.error("Error al cerrar sesión:", error);
      });
    handleMenuClose();
  };

  // Función simplificada para obtener las iniciales del usuario
  const getUserInitials = () => {
    if (currentUser) {
      if (currentUser.displayName) {
        const nameParts = currentUser.displayName.split(' ');
        if (nameParts.length >= 2) {
          return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        }
        return nameParts[0][0].toUpperCase();
      }
      if (currentUser.email) {
        return currentUser.email[0].toUpperCase();
      }
    }
    return 'U';
  };

  return (
    <AppBar position="fixed" className="header" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box className="logo-container">
          <img src="/logo.png" alt="Logo" className="logo" />
          <Typography variant="h6" component="div" className="title">
            Imbatibles Gym
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {currentUser && (
            <Typography variant="body2" sx={{ mr: 1 }}>
              {currentUser.displayName || currentUser.email || 'Usuario'}
            </Typography>
          )}
          
          <IconButton
            edge="end"
            aria-label="cuenta del usuario"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            {currentUser && currentUser.photoURL ? (
              <Avatar 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || 'Usuario'}
                sx={{ width: 32, height: 32, border: '2px solid white' }}
              />
            ) : (
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'secondary.main',
                  color: 'white',
                  fontWeight: 'bold',
                  border: '2px solid white'
                }}
              >
                {getUserInitials()}
              </Avatar>
            )}
          </IconButton>
        </Box>
        
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleProfileClick}>
            <Person sx={{ mr: 1 }} /> Perfil
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} /> Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
