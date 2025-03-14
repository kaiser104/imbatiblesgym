import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#BBFF00', // Verde neón
      light: '#CCFF33',
      dark: '#99CC00',
      contrastText: '#000000',
    },
    secondary: {
      main: '#33AAFF', // Azul
      light: '#66BBFF',
      dark: '#0088CC',
      contrastText: '#000000',
    },
    error: {
      main: '#FF5533', // Rojo/naranja
      light: '#FF7755',
      dark: '#CC3311',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFAA00',
      contrastText: '#000000',
    },
    info: {
      main: '#33AAFF',
      contrastText: '#000000',
    },
    success: {
      main: '#BBFF00',
      contrastText: '#000000',
    },
    background: {
      default: '#000000',
      paper: '#121212',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#BBBBBB',
    },
    divider: 'rgba(187, 255, 0, 0.2)',
  },
  typography: {
    fontFamily: "'Rajdhani', sans-serif",
    h1: {
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
    h2: {
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
    h3: {
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
    h4: {
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
    h5: {
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
    h6: {
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
    },
    button: {
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'uppercase',
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: '#BBFF00',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#CCFF33',
            boxShadow: '0 0 15px rgba(187, 255, 0, 0.7)',
          },
        },
        outlinedPrimary: {
          borderColor: '#BBFF00',
          color: '#BBFF00',
          '&:hover': {
            backgroundColor: 'rgba(187, 255, 0, 0.1)',
            borderColor: '#BBFF00',
            boxShadow: '0 0 10px rgba(187, 255, 0, 0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#121212',
          backgroundImage: 'none',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(187, 255, 0, 0.2)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#BBFF00',
          color: '#000000',
          fontWeight: 'bold',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(187, 255, 0, 0.05) !important',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: 'rgba(187, 255, 0, 0.1)',
          color: '#BBFF00',
          border: '1px solid rgba(187, 255, 0, 0.3)',
        },
        standardError: {
          backgroundColor: 'rgba(255, 85, 51, 0.1)',
          color: '#FF5533',
          border: '1px solid rgba(255, 85, 51, 0.3)',
        },
      },
    },
  },
});

export default theme;