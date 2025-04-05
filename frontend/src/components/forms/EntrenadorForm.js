import React, { useState, useRef, useEffect } from 'react';
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
  DialogActions
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../../contexts/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import './EntrenadorForm.css';

// Inicializar auth
const auth = getAuth();

function EntrenadorForm({ open, onClose, onSuccess }) {
  // Referencia al input de archivo
  const fileInputRef = useRef(null);
  
  // Obtener usuario actual
  const { currentUser } = useAuth();
  
  // Estado para el archivo seleccionado
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  
  // Lista de especialidades predefinidas
  const especialidades = [
    'Entrenamiento Funcional',
    'CrossFit',
    'Musculación',
    'Yoga',
    'Pilates',
    'Nutrición Deportiva',
    'Entrenamiento Personal',
    'Rehabilitación Física',
    'Boxeo',
    'Kickboxing',
    'Spinning',
    'Zumba',
    'Otro'
  ];
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: '',
    otraEspecialidad: '',
    experiencia: '',
    descripcion: '',
    imagen: '',
    certificaciones: '',
    email: '',
    whatsapp: '',
    instagram: '',
    password: ''
  });

  // Estado para errores de validación
  const [errors, setErrors] = useState({});
  
  // Estado para indicar carga
  const [loading, setLoading] = useState(false);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpiar error cuando el usuario escribe
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  // Abrir selector de archivos
  const handleOpenFileSelector = () => {
    fileInputRef.current.click();
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      especialidad: '',
      otraEspecialidad: '',
      experiencia: '',
      descripcion: '',
      imagen: '',
      certificaciones: '',
      email: '',
      whatsapp: '',
      instagram: '',
      password: ''
    });
    setSelectedFile(null);
    setFileName('');
    setErrors({});
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.especialidad) newErrors.especialidad = 'Seleccione una especialidad';
    if (formData.especialidad === 'Otro' && !formData.otraEspecialidad.trim()) {
      newErrors.otraEspecialidad = 'Especifique la especialidad';
    }
    if (!formData.experiencia.trim()) newErrors.experiencia = 'La experiencia es requerida';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida';
    if (!selectedFile && !formData.imagen.trim()) {
      newErrors.imagen = 'Debe subir una foto o proporcionar una URL';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Correo inválido';
    }
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'El WhatsApp es requerido';
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Añadir un estado para almacenar la información del gimnasio actual
  const [gimnasioInfo, setGimnasioInfo] = useState(null);
  
  // Obtener información del gimnasio al cargar el componente
  useEffect(() => {
    const fetchGimnasioInfo = async () => {
      if (!currentUser) return;
      
      try {
        // Buscar si el usuario actual es administrador de un gimnasio
        const gimnasiosRef = collection(db, 'gimnasios');
        const q = query(gimnasiosRef, where('adminUid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // El usuario es administrador de un gimnasio
          const gimnasioData = querySnapshot.docs[0].data();
          setGimnasioInfo({
            id: querySnapshot.docs[0].id,
            nombre: gimnasioData.nombre,
            direccion: gimnasioData.direccion
          });
        }
      } catch (error) {
        console.error('Error al obtener información del gimnasio:', error);
      }
    };
    
    fetchGimnasioInfo();
  }, [currentUser]);

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const uid = userCredential.user.uid;
      
      // 2. Subir imagen si se seleccionó un archivo
      let imageUrl = formData.imagen;
      
      if (selectedFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `entrenadores/${uid}/${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // 3. Guardar datos en Firestore
      const especialidadFinal = formData.especialidad === 'Otro' 
        ? formData.otraEspecialidad 
        : formData.especialidad;
      
      const certificacionesArray = formData.certificaciones
        .split(',')
        .map(cert => cert.trim())
        .filter(cert => cert !== '');
      
      // Crear objeto registradoPor con información detallada
      const registradoPor = {
        uid: currentUser.uid,
        email: currentUser.email,
        fecha: serverTimestamp()
      };
      
      // Añadir información del gimnasio si está disponible
      if (gimnasioInfo) {
        registradoPor.tipoUsuario = 'gimnasio';
        registradoPor.gimnasioId = gimnasioInfo.id;
        registradoPor.gimnasioNombre = gimnasioInfo.nombre;
        registradoPor.gimnasioUbicacion = gimnasioInfo.direccion;
      }
      
      const docRef = await addDoc(collection(db, 'entrenadores'), {
        uid,
        nombre: formData.nombre,
        especialidad: especialidadFinal,
        experiencia: formData.experiencia,
        descripcion: formData.descripcion,
        imagen: imageUrl,
        certificaciones: certificacionesArray,
        email: formData.email,
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        rating: 0,
        role: 'entrenador',
        registradoPor: registradoPor,
        fechaCreacion: serverTimestamp(),
        gimnasioId: gimnasioInfo ? gimnasioInfo.id : null, // Asociar directamente con el gimnasio
        gimnasio: gimnasioInfo ? gimnasioInfo.id : null // Añadir también el campo gimnasio para compatibilidad
      });
      
      // 4. Cerrar modal y resetear formulario
      resetForm();
      onClose();
      
      // Notificar éxito
      if (onSuccess) {
        onSuccess({
          id: docRef.id,
          uid,
          nombre: formData.nombre,
          especialidad: especialidadFinal,
          experiencia: formData.experiencia,
          descripcion: formData.descripcion,
          imagen: imageUrl,
          certificaciones: certificacionesArray,
          email: formData.email,
          whatsapp: formData.whatsapp,
          instagram: formData.instagram,
          rating: 0
        });
      }
      
    } catch (error) {
      console.error('Error al registrar entrenador:', error);
      alert(`Error al registrar entrenador: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar el modal y resetear el formulario
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle className="dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonAddIcon sx={{ mr: 1 }} />
          Registrar Nuevo Entrenador
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nombre completo"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="form-input"
                error={!!errors.nombre}
                helperText={errors.nombre}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.especialidad}>
                <InputLabel>Especialidad</InputLabel>
                <Select
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleChange}
                  className="specialty-select"
                >
                  {especialidades.map((esp) => (
                    <MenuItem key={esp} value={esp}>{esp}</MenuItem>
                  ))}
                </Select>
                {errors.especialidad && <FormHelperText>{errors.especialidad}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {formData.especialidad === 'Otro' && (
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Especificar otra especialidad"
                  name="otraEspecialidad"
                  value={formData.otraEspecialidad}
                  onChange={handleChange}
                  className="form-input"
                  error={!!errors.otraEspecialidad}
                  helperText={errors.otraEspecialidad}
                />
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Años de experiencia"
                name="experiencia"
                value={formData.experiencia}
                onChange={handleChange}
                className="form-input"
                error={!!errors.experiencia}
                helperText={errors.experiencia}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="URL de la foto (opcional)"
                name="imagen"
                value={formData.imagen}
                onChange={handleChange}
                className="form-input"
                helperText="Ingrese URL o suba un archivo"
                error={!!errors.imagen}
              />
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={handleOpenFileSelector}
                className="upload-button"
                size="small"
              >
                Subir Foto
              </Button>
              {fileName && (
                <Typography variant="caption" className="file-name">
                  Archivo seleccionado: {fileName}
                </Typography>
              )}
              {errors.imagen && (
                <FormHelperText error>{errors.imagen}</FormHelperText>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                multiline
                rows={3}
                className="form-input"
                error={!!errors.descripcion}
                helperText={errors.descripcion}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Certificaciones"
                name="certificaciones"
                value={formData.certificaciones}
                onChange={handleChange}
                className="form-input"
                helperText="Separadas por comas (ej: 'CrossFit L3, NSCA-CPT, Nutrición Deportiva')"
                error={!!errors.certificaciones}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Correo electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="WhatsApp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="form-input"
                error={!!errors.whatsapp}
                helperText={errors.whatsapp}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WhatsAppIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className="form-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InstagramIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Contraseña temporal"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                error={!!errors.password}
                helperText={errors.password || "El entrenador deberá cambiarla en su primer inicio de sesión"}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} className="cancel-button">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrar Entrenador'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EntrenadorForm;