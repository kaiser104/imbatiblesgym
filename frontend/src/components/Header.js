import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Chip
} from '@mui/material';
import { AccountCircle, Logout, Person, FitnessCenter, SportsMartialArts, DirectionsRun } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      console.log("Usuario autenticado:", user);
      console.log("UID del usuario:", user ? user.uid : "No hay usuario");
      setCurrentUser(user);

      if (user) {
        try {
          console.log("Buscando en Firestore el usuario con UID:", user.uid);

          // Buscar en trainees
          const traineeQuery = query(collection(db, "trainees"), where("uid", "==", user.uid));
          const traineeSnapshot = await getDocs(traineeQuery);
          if (!traineeSnapshot.empty) {
            console.log("Usuario encontrado en 'trainees'");
            setUserRole('deportista');
            return;
          }

          // Buscar en entrenadores
          const trainerQuery = query(collection(db, "entrenadores"), where("uid", "==", user.uid));
          const trainerSnapshot = await getDocs(trainerQuery);
          if (!trainerSnapshot.empty) {
            console.log("Usuario encontrado en 'entrenadores'");
            setUserRole('entrenador');
            return;
          }

          // Buscar en gimnasios
          // Buscar en gimnasios - usando adminId en lugar de uid
          const gymQuery = query(collection(db, "gimnasios"), where("adminId", "==", user.uid));
          const gymSnapshot = await getDocs(gymQuery);
          console.log("Resultado búsqueda gimnasios por adminId:", gymSnapshot.empty ? "No encontrado" : "Encontrado");
          
          if (!gymSnapshot.empty) {
            console.log("Usuario encontrado en 'gimnasios' como administrador");
            setUserRole('gimnasio');
            return;
          }
          
          // Buscar en gimnasios por uid (por si acaso)
          const gymUidQuery = query(collection(db, "gimnasios"), where("uid", "==", user.uid));
          const gymUidSnapshot = await getDocs(gymUidQuery);
          if (!gymUidSnapshot.empty) {
            console.log("Usuario encontrado en 'gimnasios' por uid");
            setUserRole('gimnasio');
            return;
          }

          // Buscar en usuarios
          const userQuery = query(collection(db, "usuarios"), where("uid", "==", user.uid));
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            console.log("Usuario encontrado en 'usuarios':", userData);

            // Determinar el rol basado en el campo "role"
            if (userData.role) {
              console.log("Rol encontrado:", userData.role);
              setUserRole(userData.role.toLowerCase());
            } else {
              setUserRole('usuario');
            }
            return;
          }

          console.log("Usuario no encontrado en ninguna colección específica");
          
          // Búsqueda adicional - listar todos los gimnasios para depuración
          console.log("Realizando búsqueda adicional en gimnasios...");
          try {
            const allGymsQuery = query(collection(db, "gimnasios"));
            const allGymsSnapshot = await getDocs(allGymsQuery);
            console.log("Total de gimnasios en la colección:", allGymsSnapshot.size);
            
            allGymsSnapshot.forEach(doc => {
              const data = doc.data();
              console.log("ID del documento:", doc.id);
              console.log("Datos del gimnasio:", data);
              
              // Verificar si algún campo coincide con el usuario actual
              if (
                doc.id === user.uid || 
                data.adminId === user.uid || 
                data.uid === user.uid || 
                data.email === user.email ||
                data.correo === user.email
              ) {
                console.log("¡Coincidencia encontrada en gimnasio!");
                setUserRole('gimnasio');
                return;
              }
            });
          } catch (error) {
            console.error("Error al listar todos los gimnasios:", error);
          }
          
          setUserRole('usuario');
        } catch (error) {
          console.error("Error al buscar el usuario en Firestore:", error);
          setUserRole('usuario');
        }
      } else {
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Función para obtener el icono según el rol
  const getRoleIcon = () => {
    if (!userRole) return <Person fontSize="small" />;
    
    switch(userRole) {
      case 'gimnasio':
        return <FitnessCenter fontSize="small" />;
      case 'entrenador':
        return <SportsMartialArts fontSize="small" />;
      case 'deportista':
        return <DirectionsRun fontSize="small" />;
      default:
        return <Person fontSize="small" />;
    }
  };

  // Función para obtener el texto del rol en español
  const getRoleText = () => {
    if (!userRole) return 'Usuario';
    
    switch(userRole) {
      case 'gimnasio':
        return 'Gimnasio';
      case 'entrenador':
        return 'Entrenador';
      case 'deportista':
        return 'Deportista';
      default:
        return 'Usuario';
    }
  };

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
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          ImbatiblesGym
        </Typography>
        
        {currentUser && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              icon={getRoleIcon()}
              label={getRoleText()}
              size="small"
              color="secondary"
              sx={{ marginRight: 2 }}
            />
            <IconButton
              size="large"
              edge="end"
              aria-label="cuenta del usuario"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {getUserInitials()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleProfileClick}>
                <Person sx={{ mr: 1 }} /> Perfil
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} /> Cerrar sesión
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
