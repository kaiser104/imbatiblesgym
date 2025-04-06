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
  InputAdornment,
  Chip,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

const EntrenadorEditForm = ({ open, onClose, entrenadorId, onSuccess }) => {
  const { currentUser } = useAuth();
  
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [certificaciones, setCertificaciones] = useState([]);
  const [nuevaCertificacion, setNuevaCertificacion] = useState('');
  
  // Estados para el manejo del formulario
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Opciones para especialidades
  const especialidadesOptions = [
    'Entrenamiento Personal',
    'Musculación',
    'Crossfit',
    'Funcional',
    'Cardio',
    'Yoga',
    'Pilates',
    'Artes Marciales',
    'Nutrición Deportiva',
    'Rehabilitación',
    'Otro'
  ];
  
  // Cargar datos del entrenador al abrir el formulario
  useEffect(() => {
    const fetchEntrenadorData = async () => {
      if (!open || !entrenadorId) return;
      
      try {
        setLoadingData(true);
        const entrenadorDoc = await getDoc(doc(db, 'entrenadores', entrenadorId));
        
        if (entrenadorDoc.exists()) {
          const entrenadorData = entrenadorDoc.data();
          
          // Establecer los valores en el formulario
          setNombre(entrenadorData.nombre || '');
          setEmail(entrenadorData.email || '');
          setTelefono(entrenadorData.telefono || '');
          setWhatsapp(entrenadorData.whatsapp || '');
          setInstagram(entrenadorData.instagram || '');
          setDescripcion(entrenadorData.descripcion || '');
          setEspecialidad(entrenadorData.especialidad || '');
          setExperiencia(entrenadorData.experiencia || '');
          setCertificaciones(entrenadorData.certificaciones || []);
        } else {
          setError('No se encontró la información del entrenador');
        }
        
        setLoadingData(false);
      } catch (err) {
        console.error('Error al cargar datos del entrenador:', err);
        setError('Error al cargar los datos: ' + err.message);
        setLoadingData(false);
      }
    };
    
    fetchEntrenadorData();
  }, [open, entrenadorId]);
  
  // Función para validar el formulario
  const validateForm = () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return false;
    }
    
    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('El formato del correo electrónico no es válido');
      return false;
    }
    
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria');
      return false;
    }
    
    if (!especialidad) {
      setError('La especialidad es obligatoria');
      return false;
    }
    
    // Validar que experiencia sea un número
    if (experiencia && isNaN(Number(experiencia))) {
      setError('La experiencia debe ser un número');
      return false;
    }
    
    return true;
  };
  
  // Función para agregar una nueva certificación
  const handleAddCertificacion = () => {
    if (nuevaCertificacion.trim()) {
      setCertificaciones([...certificaciones, nuevaCertificacion.trim()]);
      setNuevaCertificacion('');
    }
  };
  
  // Función para eliminar una certificación
  const handleDeleteCertificacion = (index) => {
    const newCertificaciones = [...certificaciones];
    newCertificaciones.splice(index, 1);
    setCertificaciones(newCertificaciones);
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
      const entrenadorData = {
        nombre,
        email,
        telefono: telefono || '',
        whatsapp: whatsapp || '',
        instagram: instagram || '',
        descripcion,
        especialidad,
        experiencia: experiencia || '',
        certificaciones,
        // No actualizamos campos como uid, registradoPor, fechaCreacion, etc.
        // ya que esos no deberían cambiar
      };
      
      // Actualizar documento en Firestore
      await updateDoc(doc(db, 'entrenadores', entrenadorId), entrenadorData);
      
      setSuccess('Información del entrenador actualizada correctamente');
      setLoading(false);
      
      // Esperar un momento antes de cerrar el diálogo
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error al actualizar entrenador:', err);
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
        Editar Información del Entrenador
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                label="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
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
              <TextField
                label="Instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="@usuario"
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
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(187, 255, 0, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(187, 255, 0, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#BBFF00' }
                  }
                }}
              >
                <InputLabel id="especialidad-label" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Especialidad
                </InputLabel>
                <Select
                  labelId="especialidad-label"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  label="Especialidad"
                  sx={{ color: '#FFFFFF' }}
                >
                  <MenuItem value="">Seleccionar</MenuItem>
                  {especialidadesOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            
            <Grid item xs={12}>
              <TextField
                label="Descripción profesional"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                fullWidth
                required
                variant="outlined"
                multiline
                rows={4}
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
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ color: '#BBFF00', mb: 1 }}>
                Certificaciones
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {certificaciones.map((cert, index) => (
                  <Chip
                    key={index}
                    label={cert}
                    onDelete={() => handleDeleteCertificacion(index)}
                    sx={{
                      backgroundColor: 'rgba(187, 255, 0, 0.1)',
                      color: '#FFFFFF',
                      borderColor: 'rgba(187, 255, 0, 0.3)',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { color: '#FFFFFF' }
                      }
                    }}
                  />
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Nueva certificación"
                  value={nuevaCertificacion}
                  onChange={(e) => setNuevaCertificacion(e.target.value)}
                  variant="outlined"
                  fullWidth
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
                <Button
                  variant="contained"
                  onClick={handleAddCertificacion}
                  disabled={!nuevaCertificacion.trim()}
                  sx={{ 
                    backgroundColor: '#BBFF00', 
                    color: '#000000',
                    '&:hover': { backgroundColor: '#CCFF33' }
                  }}
                >
                  <AddIcon />
                </Button>
              </Box>
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

export default EntrenadorEditForm;