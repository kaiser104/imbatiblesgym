// frontend/src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

// Import components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Import pages
import Dashboard from './pages/Dashboard';
import Gimnasios from './pages/Gimnasios';
import Entrenadores from './pages/Entrenadores';
import Trainees from './pages/Trainees';
import ExerciseManager from './pages/ExerciseManager';
import UploadExercise from './pages/UploadExercise';
import EditExercise from './pages/EditExercise';
import TrainingPlanDesigner from './pages/TrainingPlanDesigner';
import './App.css';

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10b981', // Verde como color primario
      dark: '#145214', // Verde oscuro
      light: '#28A745', // Verde brillante para hover
    },
    secondary: {
      main: '#145214', // Verde oscuro como color secundario
    },
    background: {
      default: '#121212', // Negro profundo
      paper: '#1e1e1e', // Gris oscuro
    },
    text: {
      primary: '#F5F5F5', // Blanco suave
      secondary: 'rgba(245, 245, 245, 0.7)', // Gris claro
    },
    success: {
      main: '#10b981', // Verde para éxito
    },
    // Mantenemos los colores estándar de MUI para error y advertencia
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#28A745', // Verde brillante para hover en botones
          },
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: 'gold', // Dorado para estrellas de calificación
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: '#3A3A3A', // Gris para bordes
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#F5F5F5', // Aseguramos que el texto de la sidebar sea blanco suave
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#10b981', // Aseguramos que los iconos tengan el color primario
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline /> {/* Normalize CSS */}
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Box sx={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Imbatibles Gym
            </Typography>
            
            <Container sx={{ backgroundColor: 'background.paper', borderRadius: 2, p: 3, boxShadow: 3 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/gimnasios" element={<Gimnasios />} />
                <Route path="/entrenadores" element={<Entrenadores />} />
                <Route path="/trainees" element={<Trainees />} />
                <Route path="/library" element={<ExerciseManager />} />
                <Route path="/upload" element={<UploadExercise />} />
                <Route path="/edit/:id" element={<EditExercise />} />
                <Route path="/training-plan" element={<TrainingPlanDesigner />} />
              </Routes>
            </Container>
          </Box>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
