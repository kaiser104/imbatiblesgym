import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Box,
  InputAdornment
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

const TraineeEditForm = ({ open, onClose, traineeId, onSuccess }) => {
  const { currentUser } = useAuth();
  
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [genero, setGenero] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(null);
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [experiencia, setExperiencia] = useState('');
  
  // Estados para el manejo del formulario
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Cargar datos del trainee al abrir el formulario
  useEffect(() => {
    const fetchTraineeData = async () => {
      if (!open || !traineeId) return;
      
      try {
        setLoadingData(true);
        const traineeDoc = await getDoc(doc(db, 'trainees', traineeId));
        
        if (traineeDoc.exists()) {
          const traineeData = traineeDoc.data();
          
          // Establecer los valores en el formulario
          setNombre(traineeData.nombre || '');
          setCorreo(traineeData.correo || '');
          setWhatsapp(traineeData.whatsapp || '');
          setGenero(traineeData.genero || '');
          
          // Convertir la fecha de nacimiento si existe
          if (traineeData.fechaNacimiento) {
            const fechaNac = traineeData.fechaNacimiento instanceof Date 
              ? traineeData.fechaNacimiento 
              : new Date(traineeData.fechaNacimiento);
            setFechaNacimiento(fechaNac);
          } else {
            setFechaNacimiento(null);
          }
          
          setAltura(traineeData.altura || '');
          setPeso(traineeData.peso || '');
          setExperiencia(traineeData.experiencia || '');
        } else {
          setError('No se encontró la información del trainee');
        }
        
        setLoadingData(false);
      } catch (err) {
        console.error('Error al cargar datos del trainee:', err);
        setError('Error al cargar los datos: ' + err.message);
        setLoadingData(false);
      }
    };
    
    fetchTraineeData();
  }, [open, traineeId]);
  
  // Función para validar el formulario
  const validateForm = () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    
    if (!correo.trim()) {
      setError('El correo electrónico es obligatorio');
      return false;
    }
    
    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      setError('El formato del correo electrónico no es válido');
      return false;
    }
    
    // Validar que altura y peso sean números
    if (altura && isNaN(Number(altura))) {
      setError('La altura debe ser un número');
      return false;
    }
    
    if (peso && isNaN(Number(peso))) {
      setError('El peso debe ser un número');
      return false;
    }
    
    if (experiencia && isNaN(Number(experiencia))) {
      setError('La experiencia debe ser un número');
      return false;
    }
    
    return true;
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = async () => {
    // Limpiar mensajes previos
    setError('');
    setSuccess('');
    
    // Validar formulario
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Preparar datos para actualizar
      const traineeData = {
        nombre,
        correo,
        whatsapp: whatsapp || '',
        genero: genero || '',
        fechaNacimiento: fechaNacimiento,
        altura: altura || '',
        peso: peso || '',
        experiencia: experiencia || '',
        // No actualizamos campos como uid, gimnasioId, registradoPor, etc.
        // ya que esos no deberían cambiar
      };
      
      // Actualizar documento en Firestore
      await updateDoc(doc(db, 'trainees', traineeId), traineeData);
      
      setSuccess('Información del trainee actualizada correctamente');
      setLoading(false);
      
      // Esperar un momento antes de cerrar el diálogo
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error al actualizar trainee:', err);
      setError('Error al actualizar la información: ' + err.message);
      setLoading(false);
    }
  };
  
  // Función para cerrar el diálogo
  const handleClose = () => {
    if (!loading) {
      setError('');
      setSuccess('');
      onClose();
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: '#1E1E1E',
          color: '#FFFFFF',
          border: '1px solid rgba(187, 255, 0, 0.3)',
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(187, 255, 0, 0.3)', color: '#BBFF00' }}>
        Editar Información del Trainee
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress sx={{ color: '#BBFF00' }} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              </Grid>
            )}
            
            {success && (
              <Grid item xs={12}>
                <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                fullWidth
                required
                variant="outlined"
                InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{ style: { color: '#FFFFFF' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(187, 255, 0, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(187, 255, 0, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#BBFF00' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Correo electrónico"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                fullWidth
                required
                variant="outlined"
                InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{ style: { color: '#FFFFFF' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(187, 255, 0, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(187, 255, 0, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#BBFF00' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="WhatsApp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="+57 3001234567"
                InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{ style: { color: '#FFFFFF' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(187, 255, 0, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(187, 255, 0, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#BBFF00' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(187, 255, 0, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(187, 255, 0, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#BBFF00' }
                  }
                }}
              >
                <InputLabel id="genero-label" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Género
                </InputLabel>
                <Select
                  labelId="genero-label"
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  label="Género"
                  sx={{ color: '#FFFFFF' }}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de nacimiento"
                  value={fechaNacimiento}
                  onChange={(newValue) => setFechaNacimiento(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      InputProps={{ style: { color: '#FFFFFF' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(187, 255, 0, 0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(187, 255, 0, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#BBFF00' }
                        }
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Altura (cm)"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                fullWidth
                variant="outlined"
                type="number"
                InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{ 
                  style: { color: '#FFFFFF' },
                  endAdornment: <InputAdornment position="end" sx={{ color: '#FFFFFF' }}>cm</InputAdornment>
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(187, 255, 0, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(187, 255, 0, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#BBFF00' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Peso (kg)"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                fullWidth
                variant="outlined"
                type="number"
                InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{ 
                  style: { color: '#FFFFFF' },
                  endAdornment: <InputAdornment position="end" sx={{ color: '#FFFFFF' }}>kg</InputAdornment>
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(187, 255, 0, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(187, 255, 0, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#BBFF00' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Experiencia (años)"
                value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)}
                fullWidth
                variant="outlined"
                type="number"
                InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                InputProps={{ 
                  style: { color: '#FFFFFF' },
                  endAdornment: <InputAdornment position="end" sx={{ color: '#FFFFFF' }}>años</InputAdornment>
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(187, 255, 0, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(187, 255, 0, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#BBFF00' }
                  }
                }}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions sx={{ borderTop: '1px solid rgba(187, 255, 0, 0.3)', p: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ 
            color: '#BBFF00', 
            borderColor: '#BBFF00',
            '&:hover': { borderColor: '#CCFF33', backgroundColor: 'rgba(187, 255, 0, 0.1)' }
          }}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || loadingData}
          variant="contained"
          sx={{ 
            backgroundColor: '#BBFF00', 
            color: '#000000',
            '&:hover': { backgroundColor: '#CCFF33' }
          }}
          startIcon={loading && <CircularProgress size={20} sx={{ color: '#000000' }} />}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TraineeEditForm;