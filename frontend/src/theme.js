import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#BBFF00', // Verde neón como en la fecha del reloj
      contrastText: '#000000',
    },
    secondary: {
      main: '#33AAFF', // Azul del indicador derecho
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF5533', // Rojo/naranja del indicador izquierdo
    },
    background: {
      default: '#121212',
      paper: '#000000', // Negro como el fondo de la esfera
    },
    text: {
      primary: '#FFFFFF', // Blanco como la hora principal
      secondary: '#BBFF00', // Verde neón
    },
  },
  typography: {
    fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(187, 255, 0, 0.25)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#BBFF00',
        },
      },
    },
  },
});

export default theme;