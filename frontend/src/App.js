import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { Box } from '@mui/material';

// Importa tus componentes
import Dashboard from './pages/Dashboard';
import TrainingPlanDesigner from './pages/TrainingPlanDesigner';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ExerciseManager from './pages/ExerciseManager';
import UploadExercise from './components/exercises/UploadExercise';
import Gimnasios from './pages/Gimnasios';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
// Eliminar esta importación
// import Entrenadores from './pages/Entrenadores';
import PrivateRoute from './components/PrivateRoute';
// import Trainees from './pages/Trainees';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';

// Importar el componente RoomManagement
import RoomManagement from './components/gym/RoomManagement';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      // Guardar el ID del usuario
      setUserId(user ? user.uid : null);
      
      // Aquí puedes verificar si el usuario es admin
      if (user) {
        // Por ejemplo, si tienes un claim de admin en el token
        user.getIdTokenResult().then((idTokenResult) => {
          setIsAdmin(idTokenResult.claims.admin === true);
          // Aquí podrías establecer el rol del usuario si lo tienes en los claims
          if (idTokenResult.claims.role) {
            setUserRole(idTokenResult.claims.role);
          }
        });
      } else {
        setIsAdmin(false);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: '64px' }}>
        {isAuthenticated && <Header toggleSidebar={toggleSidebar} sx={{ position: 'fixed', top: 0, width: '100%', zIndex: 1100 }} />}
        <Box sx={{ display: 'flex', flex: 1 }}>
          {isAuthenticated && <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} userRole={userRole} />}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3,
              marginLeft: sidebarOpen ? '240px' : '0',
              transition: 'margin-left 0.3s ease'
            }}
          >
            <Routes>
              {/* Eliminar esta ruta */}
              {/* <Route path="/entrenadores" element={<PrivateRoute><Entrenadores /></PrivateRoute>} /> */}
              
              {/* Mantener todas las demás rutas */}
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/training-plan-designer" element={<PrivateRoute><TrainingPlanDesigner /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/exercise-manager" element={<PrivateRoute><ExerciseManager /></PrivateRoute>} />
              <Route path="/upload-exercise" element={<PrivateRoute><UploadExercise /></PrivateRoute>} />
              <Route path="/gimnasios" element={<PrivateRoute><Gimnasios /></PrivateRoute>} />
              {/* Elimina o comenta esta ruta */}
              {/* <Route path="/trainees" element={<Trainees />} /> */}
              
              {/* Mantener todas las demás rutas */}
              <Route path="/gestion-usuarios" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
              <Route path="/rooms-management" element={<PrivateRoute><RoomManagement /></PrivateRoute>} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Box>
        </Box>
        {isAuthenticated && <Footer />}
      </Box>
    </ThemeProvider>
  );
}

export default App;