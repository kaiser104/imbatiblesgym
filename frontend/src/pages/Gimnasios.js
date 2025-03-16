import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Box, 
  Rating, 
  Chip, 
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Fab,
  IconButton,
  CircularProgress,
  Alert,
  Autocomplete,
  ImageList,
  ImageListItem,
  Tooltip,
  Container
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import './Gimnasios.css';

// Firebase imports
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Componente personalizado para subir imágenes
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// Importar useAuth para obtener el usuario actual
import { useAuth } from '../contexts/AuthContext';

function Gimnasios() {
  // Obtener el usuario actual
  const { currentUser } = useAuth();
  
  // Estado para controlar si el usuario es super-administrador
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Estado para controlar el diálogo de registro
  const [openDialog, setOpenDialog] = useState(false);
  
  // Estado para el formulario de registro
  const [newGym, setNewGym] = useState({
    nombre: '',
    direccion: '',
    horario: '',
    servicios: [],
    correo: '',
    contraseña: '',
    imagenUrl: '',
  });
  
  // Estado para las imágenes subidas
  const [imageFiles, setImageFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Estado para mensajes de error/éxito
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  
  // Estado para los gimnasios
  const [gimnasios, setGimnasios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Opciones de servicios disponibles
  const serviciosDisponibles = [
    "Pesas", "Cardio", "Clases grupales", "Sauna", "Piscina",
    "Spa", "Entrenamiento personal", "Nutrición", "Yoga", "Pilates"
  ];
  
  // Verificar si el usuario es super-administrador
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        if (!currentUser) return;
        
        const querySnapshot = await getDocs(
          query(collection(db, "usuarios"), where("uid", "==", currentUser.uid))
        );
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.rol === "super-administrador") {
            setIsSuperAdmin(true);
          }
        }
      } catch (error) {
        console.error("Error al verificar rol de usuario:", error);
      }
    };
    
    checkUserRole();
  }, [currentUser]);
  
  // Cargar gimnasios desde Firestore
  useEffect(() => {
    const fetchGimnasios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "gimnasios"));
        const gymData = [];
        querySnapshot.forEach((doc) => {
          gymData.push({ id: doc.id, ...doc.data() });
        });
        setGimnasios(gymData);
      } catch (error) {
        console.error("Error al cargar gimnasios:", error);
        setAlert({
          show: true,
          message: "Error al cargar los gimnasios: " + error.message,
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchGimnasios();
  }, []);
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGym({
      ...newGym,
      [name]: value
    });
  };
  
  // Manejar cambios en servicios (múltiples selecciones)
  const handleServiciosChange = (event, newValue) => {
    setNewGym({
      ...newGym,
      servicios: newValue
    });
  };
  
  // Manejar subida de imágenes
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Verificar si ya hay 5 imágenes
    if (imageFiles.length + files.length > 5) {
      setAlert({
        show: true,
        message: "Solo puedes subir hasta 5 imágenes por gimnasio",
        severity: "warning"
      });
      return;
    }
    
    setImageFiles([...imageFiles, ...files]);
    
    // Crear URLs temporales para previsualización
    const newImageUrls = files.map(file => URL.createObjectURL(file));
    setImageUrls([...imageUrls, ...newImageUrls]);
  };
  
  // Eliminar imagen
  const handleRemoveImage = (index) => {
    const newFiles = [...imageFiles];
    const newUrls = [...imageUrls];
    
    // Revocar URL para liberar memoria
    URL.revokeObjectURL(newUrls[index]);
    
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    
    setImageFiles(newFiles);
    setImageUrls(newUrls);
  };
  
  // Subir imágenes a Firebase Storage
  const uploadImagesToStorage = async () => {
    if (imageFiles.length === 0) return [];
    
    setUploading(true);
    const uploadedUrls = [];
    
    try {
      for (const file of imageFiles) {
        const storageRef = ref(storage, `imagenes del centro/${newGym.nombre}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadUrl);
      }
      return uploadedUrls;
    } catch (error) {
      console.error("Error al subir imágenes:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };
  
  // Crear usuario administrador en Firebase Auth
  const createAdminUser = async () => {
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newGym.correo,
        newGym.contraseña
      );
      
      // Guardar información del usuario en Firestore
      await addDoc(collection(db, "usuarios"), {
        uid: userCredential.user.uid,
        email: newGym.correo,
        rol: "administrador gimnasio",
        gimnasioId: null, // Se actualizará después de crear el gimnasio
        createdAt: serverTimestamp()
      });
      
      return userCredential.user.uid;
    } catch (error) {
      console.error("Error al crear usuario:", error);
      throw error;
    }
  };
  
  // Abrir diálogo de registro
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  
  // Cerrar diálogo de registro
  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Limpiar formulario y estados
    setNewGym({
      nombre: '',
      direccion: '',
      horario: '',
      servicios: [],
      correo: '',
      contraseña: '',
      imagenUrl: '',
    });
    setImageFiles([]);
    setImageUrls([]);
    setAlert({ show: false, message: '', severity: 'info' });
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      // 1. Crear usuario administrador
      const adminUid = await createAdminUser();
      
      // 2. Subir imágenes a Storage
      const imageUrlsFromStorage = await uploadImagesToStorage();
      
      // 3. Guardar datos del gimnasio en Firestore
      const gymData = {
        nombre: newGym.nombre,
        direccion: newGym.direccion,
        horario: newGym.horario,
        servicios: newGym.servicios,
        imagenes: imageUrlsFromStorage,
        imagenPrincipal: imageUrlsFromStorage.length > 0 ? imageUrlsFromStorage[0] : newGym.imagenUrl,
        adminId: adminUid,
        rating: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "gimnasios"), gymData);
      
      // 4. Actualizar el documento del usuario con el ID del gimnasio
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      querySnapshot.forEach(async (doc) => {
        if (doc.data().uid === adminUid) {
          // Error: Estamos intentando usar addDoc con un string en lugar de un objeto
          // await addDoc(collection(db, "usuarios", doc.id, "gimnasioId"), docRef.id);
          
          // Solución: Actualizar el documento del usuario directamente
          const userDocRef = doc.ref;
          await updateDoc(userDocRef, {
            gimnasioId: docRef.id
          });
        }
      });
      
      // Mostrar mensaje de éxito
      setAlert({
        show: true,
        message: "Gimnasio registrado con éxito",
        severity: "success"
      });
      
      // Actualizar la lista de gimnasios
      setGimnasios([...gimnasios, { id: docRef.id, ...gymData }]);
      
      // Cerrar diálogo después de 2 segundos
      setTimeout(() => {
        handleCloseDialog();
      }, 2000);
      
    } catch (error) {
      console.error("Error al registrar gimnasio:", error);
      setAlert({
        show: true,
        message: "Error al registrar gimnasio: " + error.message,
        severity: "error"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container className="gimnasios-container" sx={{ paddingTop: '100px' }}>
      {/* Resto del contenido de Gimnasios */}
      <Box className="gimnasios-header">
        <Typography variant="h5" component="h2" className="gimnasios-title">
          Sedes Inscritas
        </Typography>
        <Fab 
          color="primary" 
          aria-label="add" 
          className="add-gym-button"
          onClick={handleOpenDialog}
        >
          <AddIcon />
        </Fab>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: '#BBFF00' }} />
        </Box>
      ) : gimnasios.length === 0 ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" sx={{ color: '#BBFF00' }}>
            No hay gimnasios registrados
          </Typography>
          <Typography variant="body1" sx={{ color: '#FFFFFF', mt: 1 }}>
            Haz clic en el botón + para registrar un nuevo gimnasio
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3} className="gimnasios-grid">
          {gimnasios.map((gimnasio) => (
            <Grid item xs={12} md={6} lg={4} key={gimnasio.id}>
              <Card className="gimnasio-card">
                <CardMedia
                  component="img"
                  height="200"
                  image={gimnasio.imagenPrincipal || "https://source.unsplash.com/random/800x600/?gym"}
                  alt={gimnasio.nombre}
                  className="gimnasio-image"
                />
                <CardContent className="gimnasio-content">
                  <Typography gutterBottom variant="h5" component="div" className="gimnasio-name">
                    {gimnasio.nombre}
                  </Typography>
                  
                  <Box className="gimnasio-rating">
                    <Rating value={gimnasio.rating || 0} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {gimnasio.rating || 0}/5
                    </Typography>
                  </Box>
                  
                  <Box className="gimnasio-info">
                    <LocationOnIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {gimnasio.direccion}
                    </Typography>
                  </Box>
                  
                  <Box className="gimnasio-info">
                    <AccessTimeIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {gimnasio.horario}
                    </Typography>
                  </Box>
                  
                  <Box className="gimnasio-servicios">
                    <Typography variant="body2" gutterBottom>
                      Servicios:
                    </Typography>
                    <Box className="servicios-chips">
                      {gimnasio.servicios && gimnasio.servicios.map((servicio, index) => (
                        <Chip 
                          key={index} 
                          label={servicio} 
                          size="small" 
                          icon={<FitnessCenterIcon />} 
                          color="primary" 
                          variant="outlined" 
                          className="servicio-chip"
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
                <CardActions className="gimnasio-actions">
                  <Button size="small" color="primary">Ver Detalles</Button>
                  <Button size="small" variant="contained" color="primary">Reservar Visita</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Diálogo para registrar nuevo gimnasio */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        className="registro-dialog"
      >
        <DialogTitle className="dialog-title">
          Registrar Nuevo Gimnasio
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="dialog-content">
          {alert.show && (
            <Alert 
              severity={alert.severity}
              className="alert-container"
              onClose={() => setAlert({...alert, show: false})}
            >
              {alert.message}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} className="registro-form">
            <TextField
              margin="normal"
              required
              fullWidth
              id="nombre"
              label="Nombre del Gimnasio"
              name="nombre"
              value={newGym.nombre}
              onChange={handleInputChange}
              className="form-field"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="direccion"
              label="Dirección"
              name="direccion"
              value={newGym.direccion}
              onChange={handleInputChange}
              className="form-field"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="horario"
              label="Horario (ej: Lun-Vie: 6am-10pm, Sab-Dom: 8am-8pm)"
              name="horario"
              value={newGym.horario}
              onChange={handleInputChange}
              className="form-field"
            />
            
            <Autocomplete
              multiple
              freeSolo
              id="servicios"
              options={serviciosDisponibles}
              value={newGym.servicios}
              onChange={handleServiciosChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Servicios"
                  className="form-field"
                  helperText="Selecciona servicios existentes o escribe nuevos servicios"
                />
              )}
              className="form-field"
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="imagenUrl"
              label="URL de la imagen (opcional)"
              name="imagenUrl"
              value={newGym.imagenUrl}
              onChange={handleInputChange}
              className="form-field"
              helperText="Puedes ingresar una URL o subir imágenes a continuación"
            />
            
            <Box className="image-upload-container">
              <Typography variant="subtitle1" className="gallery-title">
                Imágenes del gimnasio
              </Typography>
              <Typography variant="body2" className="gallery-count">
                {imageFiles.length}/5 imágenes subidas
              </Typography>
              
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                className="upload-button"
                disabled={imageFiles.length >= 5}
              >
                Subir imágenes
                <VisuallyHiddenInput 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageUpload}
                  disabled={imageFiles.length >= 5}
                />
              </Button>
              
              {imageUrls.length > 0 && (
                <Box className="image-preview-list">
                  {imageUrls.map((url, index) => (
                    <Box key={index} className="image-preview-item">
                      <img src={url} alt={`Vista previa ${index + 1}`} />
                      <IconButton
                        className="image-delete-button"
                        onClick={() => handleRemoveImage(index)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="correo"
              label="Correo Electrónico"
              name="correo"
              type="email"
              value={newGym.correo}
              onChange={handleInputChange}
              className="form-field"
              helperText="Este será el correo para el administrador del gimnasio"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="contraseña"
              label="Contraseña Temporal"
              name="contraseña"
              type="password"
              value={newGym.contraseña}
              onChange={handleInputChange}
              className="form-field"
              helperText="Esta será la contraseña inicial para el administrador del gimnasio"
            />
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={handleCloseDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <CircularProgress size={24} color="inherit" />
                <span className="loading-text">Registrando...</span>
              </>
            ) : (
              "Registrar Gimnasio"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Gimnasios;
