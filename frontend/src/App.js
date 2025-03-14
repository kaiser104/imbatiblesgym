import React, { useState } from 'react';
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
import UploadExercise from './pages/UploadExercise';

function App() {
  // Estado para controlar la visibilidad de la sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Función para alternar la visibilidad de la sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Box sx={{ display: 'flex', flex: 1, position: 'relative' }}>
          <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
          
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3,
              transition: 'margin-left 0.3s ease',
              marginLeft: { sm: sidebarOpen ? '240px' : '0px' },
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/training-plan-designer" element={<TrainingPlanDesigner />} />
              <Route path="/exercise-manager" element={<ExerciseManager />} />
              <Route path="/upload-exercise" element={<UploadExercise />} />
              <Route path="/profile" element={<div>Perfil de Usuario</div>} />
              <Route path="/statistics" element={<div>Estadísticas</div>} />
            </Routes>
          </Box>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
