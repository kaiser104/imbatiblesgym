import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Card, 
  CardContent, 
  CardMedia, 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormHelperText,
  IconButton,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
// Reemplaza estas importaciones:
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
// import { es } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Trainees.css';

const Trainees = () => {
  const { currentUser } = useAuth();
  const auth = getAuth();
  const storage = getStorage();
  const fileInputRef = useRef(null);
  
  // Estado para la lista de trainees
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para el modal de registro
  const [openModal, setOpenModal] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  
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
  
  // Estado para el archivo de foto
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  
  // Estado para errores de validación
  const [errors, setErrors] = useState({});
  
  // Estado para determinar el tipo de usuario que está registrando
  const [userType, setUserType] = useState('');
  const [gimnasios, setGimnasios] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [selectedGimnasio, setSelectedGimnasio] = useState('');
  const [selectedEntrenador, setSelectedEntrenador] = useState('');
  
  // Define fetchUserType outside of useEffect
  const fetchUserType = async () => {
    try {
      // Verificar si el usuario actual es un gimnasio
      const gimnasiosQuery = query(
        collection(db, 'gimnasios'),
        where('adminUid', '==', currentUser.uid)
      );
      const gimnasiosSnapshot = await getDocs(gimnasiosQuery);
      
      if (!gimnasiosSnapshot.empty) {
        setUserType('gimnasio');
        const gimnasiosData = gimnasiosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGimnasios(gimnasiosData);
        setSelectedGimnasio(gimnasiosData[0]?.id || '');
        return;
      }
      
      // Verificar si el usuario actual es un entrenador
      const entrenadoresQuery = query(
        collection(db, 'entrenadores'),
        where('uid', '==', currentUser.uid)
      );
      const entrenadoresSnapshot = await getDocs(entrenadoresQuery);
      
      if (!entrenadoresSnapshot.empty) {
        setUserType('entrenador');
        const entrenadoresData = entrenadoresSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEntrenadores(entrenadoresData);
        setSelectedEntrenador(entrenadoresData[0]?.id || '');
        return;
      }
      
      // Si no es ninguno de los anteriores, es un administrador
      setUserType('admin');
      
      // Cargar todos los gimnasios y entrenadores para el admin
      const allGimnasiosSnapshot = await getDocs(collection(db, 'gimnasios'));
      setGimnasios(allGimnasiosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      const allEntrenadoresSnapshot = await getDocs(collection(db, 'entrenadores'));
      setEntrenadores(allEntrenadoresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
    } catch (error) {
      console.error("Error al determinar el tipo de usuario:", error);
      setError("Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos iniciales
  useEffect(() => {
    if (currentUser) {
      fetchUserType();
    }
  }, [currentUser]);

  // Cargar trainees cuando cambia el tipo de usuario o el gimnasio/entrenador seleccionado
  useEffect(() => {
    if (userType) {
      const fetchTrainees = async () => {
        try {
          let traineesQuery;
          
          if (userType === 'gimnasio' && selectedGimnasio) {
            traineesQuery = query(
              collection(db, 'trainees'),
              where('gimnasioId', '==', selectedGimnasio)
            );
          } else if (userType === 'entrenador' && selectedEntrenador) {
            traineesQuery = query(
              collection(db, 'trainees'),
              where('entrenadorId', '==', selectedEntrenador)
            );
          } else if (userType === 'admin') {
            traineesQuery = collection(db, 'trainees');
          } else {
            setTrainees([]);
            return;
          }
          
          const traineesSnapshot = await getDocs(traineesQuery);
          setTrainees(traineesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        } catch (error) {
          console.error("Error al cargar trainees:", error);
          setError("Error al cargar trainees: " + error.message);
        } finally {
          setLoading(false);
        }
      };
      
      fetchTrainees();
    }
  }, [userType, selectedGimnasio, selectedEntrenador]);

  // Handle opening the modal
  const handleOpenModal = () => {
    setOpenModal(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setOpenModal(false);
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
    setErrors({});
    setFileName('');
    setSelectedFile(null);
  };

  // Handle form input changes
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
  // Actualiza la función handleDateChange
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
    setSelectedGimnasio(e.target.value);
  };

  // Handle entrenador selection change
  const handleEntrenadorChange = (e) => {
    setSelectedEntrenador(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegistrando(true);
    
    try {
      // Validate form
      const validationErrors = {};
      
      if (!formData.nombre) validationErrors.nombre = 'El nombre es requerido';
      if (!formData.correo) validationErrors.correo = 'El correo es requerido';
      if (!formData.whatsapp) validationErrors.whatsapp = 'El WhatsApp es requerido';
      if (!formData.fechaNacimiento) validationErrors.fechaNacimiento = 'La fecha de nacimiento es requerida';
      if (!formData.genero) validationErrors.genero = 'El género es requerido';
      if (!formData.password) validationErrors.password = 'La contraseña es requerida';
      if (!formData.altura) validationErrors.altura = 'La altura es requerida';
      if (!formData.peso) validationErrors.peso = 'El peso es requerido';
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setRegistrando(false);
        return;
      }

      console.log("Creando usuario con:", formData.correo, formData.password);
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.correo,
        formData.password
      );

      console.log("Usuario creado:", userCredential.user.uid);
      
      let photoURL = formData.foto || '';

      // Upload photo if selected
      if (selectedFile) {
        try {
          const storageRef = ref(storage, `trainees/${userCredential.user.uid}`);
          await uploadBytes(storageRef, selectedFile);
          photoURL = await getDownloadURL(storageRef);
          console.log("Foto subida:", photoURL);
        } catch (uploadError) {
          console.error("Error al subir la foto:", uploadError);
          // Continuamos con el proceso aunque falle la subida de la foto
        }
      }

      // Prepare trainee data - asegurándonos de que todos los campos sean válidos
      const traineeData = {
        nombre: formData.nombre || '',
        correo: formData.correo || '',
        whatsapp: formData.whatsapp || '',
        // Usamos null en lugar de undefined para fechaNacimiento
        fechaNacimiento: null,
        genero: formData.genero || '',
        altura: formData.altura || '',
        peso: formData.peso || '',
        experiencia: formData.experiencia || '',
        foto: photoURL,
        uid: userCredential.user.uid,
        createdAt: serverTimestamp(),
        role: 'trainee',
        // Añadir información de quién registró al trainee
        registradoPor: {
          uid: currentUser.uid,
          email: currentUser.email,
          tipo: userType,
          fecha: serverTimestamp()
        }
      };

      console.log("Tipo de usuario:", userType);
      
      // Add associations based on user type
      if (userType === 'gimnasio') {
        traineeData.gimnasioId = selectedGimnasio;
        
        // Obtener el nombre del gimnasio para incluirlo en el registro
        const gimnasioDoc = gimnasios.find(g => g.id === selectedGimnasio);
        if (gimnasioDoc) {
          traineeData.registradoPor.nombreGimnasio = gimnasioDoc.nombre;
        }
      } else if (userType === 'entrenador') {
        // Usar el ID del entrenador actual
        if (entrenadores && entrenadores.length > 0) {
          const entrenadorDoc = entrenadores[0]; // El primer entrenador en la lista (debería ser el actual)
          if (entrenadorDoc) {
            traineeData.entrenadorId = entrenadorDoc.id;
            traineeData.registradoPor.nombreEntrenador = entrenadorDoc.nombre;
            console.log("Asociando trainee con entrenador:", entrenadorDoc.id, entrenadorDoc.nombre);
          } else {
            console.error("No se encontró información del entrenador actual");
          }
        } else {
          console.error("No hay entrenadores disponibles");
        }
      } else if (userType === 'admin') {
        if (selectedGimnasio) {
          traineeData.gimnasioId = selectedGimnasio;
          // Obtener el nombre del gimnasio
          const gimnasioDoc = gimnasios.find(g => g.id === selectedGimnasio);
          if (gimnasioDoc) {
            traineeData.registradoPor.nombreGimnasio = gimnasioDoc.nombre;
          }
        }
        if (selectedEntrenador) {
          traineeData.entrenadorId = selectedEntrenador;
          // Obtener el nombre del entrenador
          const entrenadorDoc = entrenadores.find(e => e.id === selectedEntrenador);
          if (entrenadorDoc) {
            traineeData.registradoPor.nombreEntrenador = entrenadorDoc.nombre;
          }
        }
      }

      console.log("Guardando trainee en Firestore:", traineeData);
      
      try {
        // Save trainee to Firestore
        const docRef = await addDoc(collection(db, 'trainees'), traineeData);
        console.log("Trainee guardado con ID:", docRef.id);
  
        // Close modal and refresh list
        handleCloseModal();
        
        // Reload trainees list
        if (userType === 'entrenador' && entrenadores && entrenadores.length > 0) {
          const entrenadorDoc = entrenadores[0];
          if (entrenadorDoc) {
            const traineesQuery = query(
              collection(db, 'trainees'),
              where('entrenadorId', '==', entrenadorDoc.id)
            );
            const traineesSnapshot = await getDocs(traineesQuery);
            setTrainees(traineesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })));
          }
        } else {
          // Código existente para recargar trainees
          const traineesQuery = query(collection(db, 'trainees'));
          const traineesSnapshot = await getDocs(traineesQuery);
          setTrainees(traineesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }
      } catch (firestoreError) {
        console.error("Error al guardar en Firestore:", firestoreError);
        throw firestoreError;
      }

    } catch (error) {
      console.error("Error al registrar trainee:", error);
      setError("Error al registrar trainee: " + error.message);
      alert("Error al registrar trainee: " + error.message);
    } finally {
      setRegistrando(false);
    }
  };

  // Añade estos console.log para depuración
  useEffect(() => {
    console.log("Trainees component mounted");
    console.log("Current user:", currentUser);
    
    if (currentUser) {
      fetchUserType();
    } else {
      console.log("No current user found");
      setLoading(false);
    }
  }, [currentUser]);

  // Modifica el return para mostrar algo incluso si no hay usuario autenticado
  return (
    <Container className="trainees-container" sx={{ paddingTop: '100px' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography variant="h5" component="h2" className="page-title">
          Trainees
        </Typography>
        
        {/* Siempre mostrar el botón, independientemente del tipo de usuario */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenModal}
        >
          Registrar Nuevo Trainee
        </Button>
      </Box>
      
      {/* Mantener también el FAB para tener dos opciones de registro */}
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleOpenModal}
        className="add-trainee-button"
        size="large"
        sx={{ 
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999  // Aumentar el z-index para asegurar que esté por encima de otros elementos
        }}
      >
        <AddIcon />
      </Fab>
      
      {/* Lista de trainees */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : trainees.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6">No hay trainees registrados</Typography>
          <Typography variant="body1">
            Haz clic en el botón + para registrar un nuevo trainee
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {trainees.map((trainee) => (
            <Grid item xs={12} sm={6} md={4} key={trainee.id}>
              <Card className="trainee-card">
                <CardMedia
                  component="img"
                  height="200"
                  image={trainee.foto || "https://via.placeholder.com/200?text=Sin+Foto"}
                  alt={trainee.nombre}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {trainee.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {trainee.correo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    WhatsApp: {trainee.whatsapp}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Género: {trainee.genero}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Altura: {trainee.altura} cm
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Peso: {trainee.peso} kg
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Experiencia: {trainee.experiencia} años
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Modal para registrar nuevo trainee */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle className="dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAddIcon sx={{ mr: 1 }} />
            Registrar Nuevo Trainee
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
                  error={!!errors.nombre}
                  helperText={errors.nombre}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Correo electrónico"
                  name="correo"
                  type="email"
                  value={formData.correo}
                  onChange={handleChange}
                  error={!!errors.correo}
                  helperText={errors.correo}
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
                  error={!!errors.whatsapp}
                  helperText={errors.whatsapp}
                />
              </Grid>
              
              {/* Añadir campo de género */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors.genero}>
                  <InputLabel>Género</InputLabel>
                  <Select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                  >
                    <MenuItem value="Masculino">Masculino</MenuItem>
                    <MenuItem value="Femenino">Femenino</MenuItem>
                    <MenuItem value="Otro">Otro</MenuItem>
                  </Select>
                  {errors.genero && <FormHelperText>{errors.genero}</FormHelperText>}
                </FormControl>
              </Grid>
              
              {/* Añadir campo de fecha de nacimiento */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Fecha de Nacimiento"
                  name="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento || ''}
                  onChange={handleChange}
                  error={!!errors.fechaNacimiento}
                  helperText={errors.fechaNacimiento || 'Formato: DD/MM/AAAA'}
                  InputLabelProps={{
                    shrink: true,
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
                  error={!!errors.password}
                  helperText={errors.password}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Altura (cm)"
                  name="altura"
                  type="number"
                  value={formData.altura}
                  onChange={handleChange}
                  error={!!errors.altura}
                  helperText={errors.altura}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Peso (kg)"
                  name="peso"
                  type="number"
                  value={formData.peso}
                  onChange={handleChange}
                  error={!!errors.peso}
                  helperText={errors.peso}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Experiencia entrenando (años)"
                  name="experiencia"
                  type="number"
                  value={formData.experiencia}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="URL de la foto (opcional)"
                  name="foto"
                  value={formData.foto}
                  onChange={handleChange}
                  helperText="Ingrese URL o suba un archivo"
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
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Subir Foto
                </Button>
                {fileName && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Archivo seleccionado: {fileName}
                  </Typography>
                )}
              </Grid>
              
              {/* Campos adicionales para administradores */}
              {userType === 'admin' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      Asociar trainee a:
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Gimnasio</InputLabel>
                      <Select
                        name="gimnasio"
                        value={selectedGimnasio}
                        onChange={handleGimnasioChange}
                      >
                        <MenuItem value="">Ninguno</MenuItem>
                        {gimnasios.map((gimnasio) => (
                          <MenuItem key={gimnasio.id} value={gimnasio.id}>
                            {gimnasio.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Entrenador</InputLabel>
                      <Select
                        name="entrenador"
                        value={selectedEntrenador}
                        onChange={handleEntrenadorChange}
                      >
                        <MenuItem value="">Ninguno</MenuItem>
                        {entrenadores.map((entrenador) => (
                          <MenuItem key={entrenador.id} value={entrenador.id}>
                            {entrenador.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {errors.asociacion && (
                    <Grid item xs={12}>
                      <Alert severity="error">{errors.asociacion}</Alert>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={registrando}
          >
            {registrando ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Registrando...
              </>
            ) : (
              "Registrar Trainee"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Trainees;
