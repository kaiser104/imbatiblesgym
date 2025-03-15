import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  Container,
  Stack
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Make sure the login form is properly handling authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Error al iniciar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container 
      maxWidth="100%" 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#000000',
        padding: 3
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          maxWidth: 400, 
          width: '100%',
          backgroundColor: '#121212',
          borderRadius: 2,
          border: '1px solid rgba(187, 255, 0, 0.2)'
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DirectionsRunIcon sx={{ color: '#BBFF00', fontSize: 40, mr: 1 }} />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#BBFF00',
                textTransform: 'uppercase'
              }}
            >
              Imbatibles
            </Typography>
          </Box>
          
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              color: '#FFFFFF',
              textAlign: 'center',
              mb: 2
            }}
          >
            Iniciar Sesión
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(187, 255, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(187, 255, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#BBFF00',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#BBFF00',
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(187, 255, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(187, 255, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#BBFF00',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#BBFF00',
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: '#BBFF00',
                color: '#000000',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#CCFF33',
                  boxShadow: '0 0 15px rgba(187, 255, 0, 0.7)'
                },
                '&:disabled': {
                  backgroundColor: '#333333',
                  color: '#666666'
                }
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Login;