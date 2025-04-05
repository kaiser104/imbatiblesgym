import React, { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import './Sidebar.css';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import RoomIcon from '@mui/icons-material/Room';
import {
  PeopleAlt,
  ManageAccounts,
  AdminPanelSettings
} from '@mui/icons-material';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Sidebar = ({ open, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Escuchar cambios en el estado de autenticación - similar al Header
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      console.log("Sidebar - Usuario autenticado:", user);
      setCurrentUser(user);

      if (user) {
        try {
          console.log("Sidebar - Buscando en Firestore el usuario con UID:", user.uid);

          // Buscar en trainees
          const traineeQuery = query(collection(db, "trainees"), where("uid", "==", user.uid));
          const traineeSnapshot = await getDocs(traineeQuery);
          if (!traineeSnapshot.empty) {
            console.log("Sidebar - Usuario encontrado en 'trainees'");
            setUserRole('deportista');
            setLoading(false);
            return;
          }

          // Buscar en entrenadores
          const trainerQuery = query(collection(db, "entrenadores"), where("uid", "==", user.uid));
          const trainerSnapshot = await getDocs(trainerQuery);
          if (!trainerSnapshot.empty) {
            console.log("Sidebar - Usuario encontrado en 'entrenadores'");
            setUserRole('entrenador');
            setLoading(false);
            return;
          }

          // Buscar en gimnasios - usando adminId en lugar de uid
          const gymQuery = query(collection(db, "gimnasios"), where("adminId", "==", user.uid));
          const gymSnapshot = await getDocs(gymQuery);
          console.log("Sidebar - Resultado búsqueda gimnasios por adminId:", gymSnapshot.empty ? "No encontrado" : "Encontrado");
          
          if (!gymSnapshot.empty) {
            console.log("Sidebar - Usuario encontrado en 'gimnasios' como administrador");
            setUserRole('gimnasio');
            setLoading(false);
            return;
          }
          
          // Buscar en gimnasios por uid (por si acaso)
          const gymUidQuery = query(collection(db, "gimnasios"), where("uid", "==", user.uid));
          const gymUidSnapshot = await getDocs(gymUidQuery);
          if (!gymUidSnapshot.empty) {
            console.log("Sidebar - Usuario encontrado en 'gimnasios' por uid");
            setUserRole('gimnasio');
            setLoading(false);
            return;
          }

          // Buscar en usuarios
          const userQuery = query(collection(db, "usuarios"), where("uid", "==", user.uid));
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            console.log("Sidebar - Usuario encontrado en 'usuarios':", userData);

            // Determinar el rol basado en el campo "role"
            if (userData.role) {
              console.log("Sidebar - Rol encontrado:", userData.role);
              setUserRole(userData.role.toLowerCase());
            } else {
              setUserRole('usuario');
            }
            setLoading(false);
            return;
          }

          // Búsqueda adicional - listar todos los gimnasios para depuración
          console.log("Sidebar - Realizando búsqueda adicional en gimnasios...");
          try {
            const allGymsQuery = query(collection(db, "gimnasios"));
            const allGymsSnapshot = await getDocs(allGymsQuery);
            
            allGymsSnapshot.forEach(doc => {
              const data = doc.data();
              
              // Verificar si algún campo coincide con el usuario actual
              if (
                doc.id === user.uid || 
                data.adminId === user.uid || 
                data.uid === user.uid || 
                data.email === user.email ||
                data.correo === user.email
              ) {
                console.log("Sidebar - ¡Coincidencia encontrada en gimnasio!");
                setUserRole('gimnasio');
                setLoading(false);
                return;
              }
            });
          } catch (error) {
            console.error("Sidebar - Error al listar todos los gimnasios:", error);
          }
          
          setUserRole('usuario');
          setLoading(false);
        } catch (error) {
          console.error("Sidebar - Error al buscar el usuario en Firestore:", error);
          setUserRole('usuario');
          setLoading(false);
        }
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Definir los elementos del menú
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/' 
    },
    { 
      text: 'Training Plan Designer', 
      icon: <FitnessCenterIcon />, 
      path: '/training-plan-designer' 
    },
    { 
      text: 'User Profile', 
      icon: <PersonIcon />, 
      path: '/profile' 
    },
    { 
      text: 'Library', // Cambiado de "Biblioteca de Ejercicios" a "Library"
      icon: <MenuBookIcon />, 
      path: '/exercise-manager' 
    },
    // Se eliminó la opción "Subir Ejercicio"
    { 
      text: 'Gyms', // Cambiado de "Gimnasios" a "Gyms"
      icon: <LocationOnIcon />, 
      path: '/gimnasios' 
    },
    // Se eliminó el elemento de Trainees
    // Nuevo elemento para Gestión de Salas (solo visible para gimnasios)
    { 
      text: 'Room Management', // Cambiado de "Gestión de Salas" a "Room Management"
      icon: <RoomIcon />, 
      path: '/rooms-management',
      roles: ['gimnasio'] // Solo visible para usuarios con rol de gimnasio
    },
    // Nuevo elemento para Gestión de Usuarios
    {
      text: 'User Management', // Cambiado de "Gestión de Usuarios" a "User Management"
      icon: userRole === 'super-administrador' ? <AdminPanelSettings /> : 
            userRole === 'gimnasio' ? <PeopleAlt /> : <ManageAccounts />,
      path: '/gestion-usuarios',
      roles: ['super-administrador', 'gimnasio', 'entrenador'],
      className: 'admin-link'
    }
    // Se eliminó el elemento de Estadísticas
  ];
  
  // Filtrar elementos del menú según el rol del usuario
  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || (userRole && item.roles.includes(userRole))
  );
  
  console.log("Sidebar - Rol del usuario:", userRole);
  console.log("Sidebar - Elementos de menú filtrados:", filteredMenuItems.map(item => item.text));
  
  return (
    <>
      {/* Botón para mostrar/ocultar sidebar */}
      <IconButton
        onClick={toggleSidebar}
        className="sidebar-toggle-button"
        sx={{
          position: 'fixed',
          left: open ? '220px' : '10px',
          top: '90px',
          zIndex: 1300, // Aumentado el z-index para que esté por encima de la sidebar (que tiene 1200)
          backgroundColor: '#121212',
          color: '#BBFF00',
          border: '1px solid rgba(187, 255, 0, 0.3)',
          transition: 'left 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          overflow: 'hidden', // Esto evita que el efecto se salga del círculo
          '&:hover': {
            backgroundColor: 'rgba(187, 255, 0, 0.1)',
            boxShadow: '0 0 10px rgba(187, 255, 0, 0.5)',
            transform: 'scale(1.1)', // Efecto de escala al hacer hover
          },
          // Eliminar el efecto de ripple cuadrado
          '& .MuiTouchRipple-root': {
            borderRadius: '50%'
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
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem 
                button 
                key={item.text}
                onClick={() => navigate(item.path)}
                className={`sidebar-item ${isActive ? 'active' : ''} ${item.className || ''}`}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  position: 'relative',
                  '&.active': {
                    backgroundColor: 'rgba(187, 255, 0, 0.15)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      backgroundColor: '#BBFF00',
                      borderRadius: '0 4px 4px 0'
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(187, 255, 0, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#BBFF00' : '#FFFFFF', minWidth: '40px' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#BBFF00' : '#FFFFFF'
                    } 
                  }}
                />
                {item.path === '/gestion-usuarios' && userRole !== 'super-administrador' && (
                  <span className="notification-badge">Nuevo</span>
                )}
              </ListItem>
            );
          })}
        </List>
      </Drawer>
    </>
  );
};

export default Sidebar;
