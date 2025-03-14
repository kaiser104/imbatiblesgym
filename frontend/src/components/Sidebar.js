import React from 'react';
import { 
  Drawer, 
  Box, 
  List,
  Divider,
  Typography,
  Stack,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BarChartIcon from '@mui/icons-material/BarChart';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import './Sidebar.css';

const Sidebar = ({ open, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Definir los elementos del menú
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/' 
    },
    { 
      text: 'Diseñador de Entrenamientos', 
      icon: <FitnessCenterIcon />, 
      path: '/training-plan-designer' 
    },
    { 
      text: 'Perfil de Usuario', 
      icon: <PersonIcon />, 
      path: '/profile' 
    },
    { 
      text: 'Biblioteca de Ejercicios', 
      icon: <MenuBookIcon />, 
      path: '/exercise-manager' 
    },
    { 
      text: 'Subir Ejercicio', 
      icon: <CloudUploadIcon />, 
      path: '/upload-exercise' 
    },
    { 
      text: 'Estadísticas', 
      icon: <BarChartIcon />, 
      path: '/statistics' 
    }
  ];
  
  return (
    <>
      {/* Botón para mostrar/ocultar sidebar */}
      <IconButton
        onClick={toggleSidebar}
        className="sidebar-toggle-button"
        sx={{
          position: 'fixed',
          left: open ? '240px' : '10px',
          top: '70px',
          zIndex: 1200,
          backgroundColor: '#121212',
          color: '#BBFF00',
          border: '1px solid rgba(187, 255, 0, 0.3)',
          transition: 'left 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(187, 255, 0, 0.1)',
            boxShadow: '0 0 10px rgba(187, 255, 0, 0.5)'
          }
        }}
      >
        {open ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>
      
      {/* Cambiado a variant="temporary" para dispositivos móviles y "permanent" para desktop */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'block', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            backgroundColor: '#121212',
            color: '#FFFFFF',
            borderRight: '1px solid rgba(187, 255, 0, 0.2)',
            transition: 'transform 0.3s ease',
            transform: open ? 'translateX(0)' : 'translateX(-100%)'
          }
        }}
      >
        <Box className="sidebar-logo">
          <Stack direction="row" spacing={1} alignItems="center">
            <DirectionsRunIcon className="logo-icon" />
            <Typography 
              variant="h6" 
              className="logo-text"
            >
              Imbatibles
            </Typography>
          </Stack>
        </Box>
        <Divider sx={{ backgroundColor: 'rgba(187, 255, 0, 0.2)' }} />
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem 
                button 
                key={item.text}
                onClick={() => navigate(item.path)}
                className={isActive ? 'menu-item menu-item-active' : 'menu-item'}
              >
                <Tooltip title={item.text} placement="right" arrow>
                  <ListItemIcon className="menu-icon">
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>
                <ListItemText 
                  primary={item.text} 
                  className="menu-text"
                />
              </ListItem>
            );
          })}
        </List>
      </Drawer>
    </>
  );
};

export default Sidebar;