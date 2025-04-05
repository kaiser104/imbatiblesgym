import React, { useState, useRef } from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  InputAdornment,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../../contexts/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import './TraineeForm.css';

// Inicializar auth
const auth = getAuth();

function TraineeForm({ open, onClose, onSuccess, userType, gimnasios, entrenadores, selectedGimnasio, selectedEntrenador }) {
  const { currentUser } = useAuth();
  const storage = getStorage();
  const fileInputRef = useRef(null);
  
  // Estado para el archivo seleccionado
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    whatsapp: '',
    fechaNacimiento: null,
    genero: '',
    password: '',
    altura: '',
    peso: '',
    experiencia: '',
    foto: ''
  });
  
  // Estado para errores de validación
  const [errors, setErrors] = useState({});
  
  // Estado para indicar carga
  const [registrando, setRegistrando] = useState(false);
  
  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle date picker changes
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      fechaNacimiento: date
    }));
    // Limpiar error si existe
    if (errors.fechaNacimiento) {
      setErrors(prev => ({
        ...prev,
        fechaNacimiento: ''
      }));
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  // Open file selector
  const handleOpenFileSelector = () => {
    fileInputRef.current.click();
  };

  // Handle gimnasio selection change
  const handleGimnasioChange = (e) => {
    // Simplemente actualizar el valor seleccionado localmente
    // No necesitamos una función de callback externa para esto
    const value = e.target.value;
    console.log("Gimnasio seleccionado:", value);
  };

  // Handle entrenador selection change
  const handleEntrenadorChange = (e) => {
    // Simplemente actualizar el valor seleccionado localmente
    // No necesitamos una función de callback externa para esto
    const value = e.target.value;
    console.log("Entrenador seleccionado:", value);
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    // Validar campos requeridos
    if (!formData.nombre.trim()) errors.nombre = "El nombre es requerido";
    if (!formData.correo.trim()) errors.correo = "El correo es requerido";
    else if (!/\S+@\S+\.\S+/.test(formData.correo)) errors.correo = "Correo electrónico inválido";
    
    if (!formData.whatsapp.trim()) errors.whatsapp = "El WhatsApp es requerido";
    if (!formData.genero) errors.genero = "El género es requerido";
    if (!formData.fechaNacimiento) errors.fechaNacimiento = "La fecha de nacimiento es requerida";
    if (!formData.password.trim()) errors.password = "La contraseña es requerida";
    else if (formData.password.length < 6) errors.password = "La contraseña debe tener al menos 6 caracteres";
    
    if (!formData.altura) errors.altura = "La altura es requerida";
    if (!formData.peso) errors.peso = "El peso es requerido";
    
    // Validar que los campos numéricos sean números válidos
    if (formData.altura && isNaN(Number(formData.altura))) errors.altura = "La altura debe ser un número";
    if (formData.peso && isNaN(Number(formData.peso))) errors.peso = "El peso debe ser un número";
    if (formData.experiencia && isNaN(Number(formData.experiencia))) errors.experiencia = "La experiencia debe ser un número";
    
    // Para administradores, validar que se haya seleccionado al menos un gimnasio o entrenador
    if (userType === 'super-administrador' && !selectedGimnasio && !selectedEntrenador) {
      errors.asociacion = "Debe seleccionar al menos un gimnasio o entrenador";
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setRegistrando(true);
    
    try {
      // Crear usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.correo, 
        formData.password
      );
      
      // Enviar correo para restablecer contraseña
      await sendPasswordResetEmail(auth, formData.correo);
      
      // Subir foto si existe
      let photoURL = '';
      if (selectedFile) {
        const storageRef = ref(storage, `profile_photos/${userCredential.user.uid}`);
        await uploadBytes(storageRef, selectedFile);
        photoURL = await getDownloadURL(storageRef);
      }
      
      // Preparar datos del trainee
      const traineeData = {
        nombre: formData.nombre,
        email: formData.correo,
        whatsapp: formData.whatsapp,
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.genero,
        altura: formData.altura,
        peso: formData.peso,
        experiencia: formData.experiencia,
        photoURL: photoURL,
        uid: userCredential.user.uid,
        fechaRegistro: serverTimestamp(),
        // Información de quien lo registra
        registradoPor: {
          uid: currentUser.uid,
          email: currentUser.email,
          fecha: serverTimestamp()
        }
      };
      
      // Asignar gimnasio y/o entrenador según corresponda
      if (userType === 'gimnasio') {
        traineeData.gimnasioId = selectedGimnasio;
        traineeData.gimnasio = selectedGimnasio;
      } else if (userType === 'entrenador') {
        traineeData.entrenadorId = selectedEntrenador;
        traineeData.entrenador = selectedEntrenador;
      } else if (userType === 'super-administrador') {
        if (selectedGimnasio) {
          traineeData.gimnasioId = selectedGimnasio;
          traineeData.gimnasio = selectedGimnasio;
        }
        if (selectedEntrenador) {
          traineeData.entrenadorId = selectedEntrenador;
          traineeData.entrenador = selectedEntrenador;
        }
      }
      
      // Guardar en Firestore
      await addDoc(collection(db, 'trainees'), traineeData);
      
      // Cerrar modal y resetear formulario
      onClose();
      resetForm();
      
      // Notificar éxito
      if (onSuccess) {
        onSuccess();
      }
      
      alert('Trainee registrado con éxito. Se ha enviado un correo para establecer la contraseña.');
      
    } catch (error) {
      console.error("Error al registrar trainee:", error);
      setErrors({ submit: error.message });
    } finally {
      setRegistrando(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      correo: '',
      whatsapp: '',
      fechaNacimiento: null,
      genero: '',
      password: '',
      altura: '',
      peso: '',
      experiencia: '',
      foto: ''
    });
    setSelectedFile(null);
    setFileName('');
    setErrors({});
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'trainee-form-dialog'
      }}
    >
      <DialogTitle className="dialog-title">
        <Box display="flex" alignItems="center">
          <PersonAddIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Registrar Nuevo Trainee</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Información personal */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" className="form-section-title">
                Información Personal
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre completo"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                error={!!errors.nombre}
                helperText={errors.nombre}
                className="form-input"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correo electrónico"
                name="correo"
                type="email"
                value={formData.correo}
                onChange={handleChange}
                error={!!errors.correo}
                helperText={errors.correo}
                className="form-input"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="WhatsApp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                error={!!errors.whatsapp}
                helperText={errors.whatsapp}
                className="form-input"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      +
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.genero} className="form-input">
                <InputLabel>Género</InputLabel>
                <Select
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  label="Género"
                  required
                >
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
                {errors.genero && <FormHelperText>{errors.genero}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                name="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento || ''}
                onChange={(e) => handleDateChange(e.target.value)}
                error={!!errors.fechaNacimiento}
                helperText={errors.fechaNacimiento}
                className="form-input"
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contraseña temporal"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password || "Mínimo 6 caracteres. Se enviará un correo para cambiarla."}
                className="form-input"
                required
              />
            </Grid>
            
            {/* Información física */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" className="form-section-title">
                Información Física
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Altura (cm)"
                name="altura"
                type="number"
                value={formData.altura}
                onChange={handleChange}
                error={!!errors.altura}
                helperText={errors.altura}
                className="form-input"
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Peso (kg)"
                name="peso"
                type="number"
                value={formData.peso}
                onChange={handleChange}
                error={!!errors.peso}
                helperText={errors.peso}
                className="form-input"
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Experiencia entrenando (años)"
                name="experiencia"
                type="number"
                value={formData.experiencia}
                onChange={handleChange}
                error={!!errors.experiencia}
                helperText={errors.experiencia}
                className="form-input"
                InputProps={{
                  endAdornment: <InputAdornment position="end">años</InputAdornment>,
                }}
              />
            </Grid>
            
            {/* Foto de perfil */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" className="form-section-title">
                Foto de Perfil
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleOpenFileSelector}
                  className="upload-button"
                >
                  Subir Foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                {fileName && (
                  <Typography variant="body2" className="file-name">
                    {fileName}
                  </Typography>
                )}
              </Box>
            </Grid>
            
            {/* Campos adicionales para administradores */}
            {userType === 'super-administrador' && (
              <>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" className="form-section-title">
                    Asociación
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth className="form-input">
                    <InputLabel>Gimnasio</InputLabel>
                    <Select
                      value={selectedGimnasio || ''}
                      onChange={handleGimnasioChange}
                      label="Gimnasio"
                    >
                      <MenuItem value="">Ninguno</MenuItem>
                      {gimnasios && gimnasios.map(gym => (
                        <MenuItem key={gym.id} value={gym.id}>
                          {gym.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth className="form-input">
                    <InputLabel>Entrenador</InputLabel>
                    <Select
                      value={selectedEntrenador || ''}
                      onChange={handleEntrenadorChange}
                      label="Entrenador"
                    >
                      <MenuItem value="">Ninguno</MenuItem>
                      {entrenadores && entrenadores.map(trainer => (
                        <MenuItem key={trainer.id} value={trainer.id}>
                          {trainer.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {errors.asociacion && (
                  <Grid item xs={12}>
                    <FormHelperText error>{errors.asociacion}</FormHelperText>
                  </Grid>
                )}
              </>
            )}
            
            {/* Error general */}
            {errors.submit && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">
                  {errors.submit}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          className="cancel-button"
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={registrando}
          className="submit-button"
          startIcon={registrando ? <CircularProgress size={20} /> : <PersonAddIcon />}
        >
          {registrando ? 'Registrando...' : 'Registrar Trainee'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TraineeForm;