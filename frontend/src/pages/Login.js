import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
// Remove the CSS import that's causing the error
// import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const auth = getAuth();
  
  // Estado para el formulario de login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para el modal de restablecimiento de contraseña
  const [openResetModal, setOpenResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Manejar envío del formulario de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError('Error al iniciar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para manejar el restablecimiento de contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(false);
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
      // Opcional: cerrar el modal después de un tiempo
      setTimeout(() => {
        setOpenResetModal(false);
        setResetEmail('');
        setResetSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error al enviar correo de restablecimiento:", error);
      setResetError(error.message);
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="xs" className="login-container">
      <Paper elevation={3} className="login-paper">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 4
          }}
        >
          <Typography component="h1" variant="h5" className="login-title">
            Iniciar Sesión
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Correo Electrónico"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
            
            {/* Enlace para restablecer contraseña */}
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button 
                variant="text" 
                color="primary"
                size="small"
                onClick={(e) => {
                  e.preventDefault(); // Prevenir comportamiento por defecto
                  setOpenResetModal(true);
                }}
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Modal para restablecer contraseña */}
      <Dialog open={openResetModal} onClose={() => setOpenResetModal(false)}>
        <DialogTitle>Restablecer contraseña</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </Typography>
          <TextField
            fullWidth
            label="Correo electrónico"
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            margin="normal"
            required
          />
          {resetError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {resetError}
            </Alert>
          )}
          {resetSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Se ha enviado un correo de restablecimiento a {resetEmail}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetModal(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleResetPassword} 
            variant="contained" 
            color="primary"
            disabled={resetLoading || !resetEmail}
          >
            {resetLoading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Enviando...
              </>
            ) : (
              "Enviar correo"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;