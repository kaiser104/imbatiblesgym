// frontend/src/pages/UploadExercise.js
import React, { useState } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from '../firebase';
import './UploadExercise.css'; // Importar el archivo CSS
import { 
  Container, Typography, Box, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem,
  LinearProgress, Card, CardContent, Grid, 
  Alert, Snackbar, Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const db = getFirestore(app);

const UploadExercise = () => {
  const [exerciseData, setExerciseData] = useState({
    name: '',
    mainMuscle: '',
    secondaryMuscle: '',
    movementCategory: '',
    equipment: '',
    otherEquipment: '', // Nuevo campo para equipamiento personalizado
    focus: ''
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Opciones para los menús desplegables
  const muscleOptions = [
    'Pectorales', 'Espalda', 'Bíceps', 'Tríceps', 'Deltoides', 
    'Deltoides posterior', 'Glúteos', 'Abdominales', 'Lumbares', 
    'Cuádriceps', 'Isquiotibiales', 'Pantorrilla', 'Aductores', 
    'Abductores', 'Antebrazos', 'Trapecio'
  ];

  const focusOptions = ['Aislamiento', 'Multiarticular', 'Cuerpo completo'];
  
  const equipmentOptions = [
    'Trineo', 'Suspensión', 'Rodillo de espuma', 'Polea', 'Peso Corporal',
    'Fit ball', 'Mancuernas', 'Landmine', 'Kettlebell', 'Disco',
    'Cuerda de batida', 'Chaleco con peso', 'Bolsa de arena', 'Bola de lacrosse',
    'Barra', 'Power band', 'Balón medicinal', 'Otro'
  ];
  
  const movementCategoryOptions = [
    'Bent Leg Hip Extension', 'Cardio', 'Double Leg Push', 'Core Stability',
    'Auxiliary', 'Mobility', 'Explosive', 'Horizontal Push',
    'Straight Leg Hip Extension', 'Downward Pull', 'Upward Pull',
    'Upward Push', 'Single Leg Push', 'Horizontal Pull'
  ];

  const handleChange = (e) => {
    setExerciseData({
      ...exerciseData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    if(e.target.files[0]){
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Crear una vista previa del archivo
      if (selectedFile.type.includes('image')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if(!file) {
      setError("Debes seleccionar un archivo GIF");
      return;
    }
    
    // Preparar los datos del ejercicio
    let finalExerciseData = { ...exerciseData };
    
    // Si el equipamiento es "Otro", usar el valor personalizado
    if (exerciseData.equipment === 'Otro' && exerciseData.otherEquipment) {
      finalExerciseData.equipment = exerciseData.otherEquipment;
    }
    
    // Eliminar el campo otherEquipment antes de guardar
    const { otherEquipment, ...dataToSave } = finalExerciseData;
    
    // Referencia en Storage (organizada por categoría)
    const storageRef = ref(storage, `exercises/${exerciseData.movementCategory}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on("state_changed",
      snapshot => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      error => {
        console.error(error);
        setError(error.message);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (url) => {
          setDownloadURL(url);
          const exercise = {
            ...dataToSave, // Usar los datos preparados
            fileURL: url,
            createdAt: new Date()
          };
          try {
            await addDoc(collection(db, "exercises"), exercise);
            setMessage("Ejercicio subido y guardado correctamente.");
            setOpenSnackbar(true);
            setExerciseData({
              name: '',
              mainMuscle: '',
              secondaryMuscle: '',
              movementCategory: '',
              equipment: '',
              otherEquipment: '', // Resetear también este campo
              focus: ''
            });
            setFile(null);
            setPreviewUrl(null);
            setUploadProgress(0);
          } catch (err) {
            console.error("Error al guardar en Firestore:", err);
            setError("Error al guardar el ejercicio: " + err.message);
          }
        });
      }
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }} className="upload-container">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }} className="upload-paper">
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center" 
          sx={{ 
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: '#BBFF00',
            marginBottom: '1.5rem'
          }}
        >
          Subir Nuevo Ejercicio
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} className="form-field">
              <TextField
                fullWidth
                label="Nombre del ejercicio"
                name="name"
                value={exerciseData.name}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Músculo principal</InputLabel>
                <Select
                  name="mainMuscle"
                  value={exerciseData.mainMuscle}
                  onChange={handleChange}
                  label="Músculo principal"
                >
                  {muscleOptions.map((muscle) => (
                    <MenuItem key={muscle} value={muscle}>
                      {muscle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Músculo secundario (opcional)</InputLabel>
                <Select
                  name="secondaryMuscle"
                  value={exerciseData.secondaryMuscle}
                  onChange={handleChange}
                  label="Músculo secundario (opcional)"
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {muscleOptions.map((muscle) => (
                    <MenuItem key={muscle} value={muscle}>
                      {muscle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Categoría de movimiento</InputLabel>
                <Select
                  name="movementCategory"
                  value={exerciseData.movementCategory}
                  onChange={handleChange}
                  label="Categoría de movimiento"
                >
                  {movementCategoryOptions.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Enfoque</InputLabel>
                <Select
                  name="focus"
                  value={exerciseData.focus}
                  onChange={handleChange}
                  label="Enfoque"
                >
                  {focusOptions.map((focus) => (
                    <MenuItem key={focus} value={focus}>
                      {focus}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Equipamiento</InputLabel>
                <Select
                  name="equipment"
                  value={exerciseData.equipment}
                  onChange={handleChange}
                  label="Equipamiento"
                >
                  {equipmentOptions.map((equipment) => (
                    <MenuItem key={equipment} value={equipment}>
                      {equipment}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {exerciseData.equipment === 'Otro' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Especificar equipamiento"
                  name="otherEquipment"
                  value={exerciseData.otherEquipment}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  placeholder="Describe el equipamiento utilizado"
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{ 
                  mb: 2,
                  color: '#BBFF00',
                  borderColor: '#BBFF00',
                  '&:hover': {
                    backgroundColor: 'rgba(187, 255, 0, 0.2)',
                    borderColor: '#BBFF00',
                    boxShadow: '0 0 10px rgba(187, 255, 0, 0.5)'
                  }
                }}
                className="upload-button"
              >
                Seleccionar archivo GIF
                <input
                  type="file"
                  accept="image/gif,image/*"
                  onChange={handleFileChange}
                  hidden
                />
              </Button>
              {file && (
                <Typography variant="body2" sx={{ ml: 2, color: '#33AAFF' }} className="file-name">
                  Archivo seleccionado: {file.name}
                </Typography>
              )}
            </Grid>
            
            {previewUrl && (
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Card sx={{ maxWidth: 300, mx: 'auto' }} className="preview-card">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Vista previa:
                    </Typography>
                    <img 
                      src={previewUrl} 
                      alt="Vista previa" 
                      className="preview-image"
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {uploadProgress > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Progreso de carga: {uploadProgress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  className="progress-bar"
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth
                size="large"
                disabled={uploadProgress > 0 && uploadProgress < 100}
                sx={{
                  backgroundColor: '#BBFF00',
                  color: '#000000',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  '&:hover': {
                    backgroundColor: '#CCFF33',
                    boxShadow: '0 0 15px rgba(187, 255, 0, 0.7)'
                  },
                  '&:disabled': {
                    backgroundColor: '#333333',
                    color: '#666666'
                  }
                }}
                className="submit-button"
              >
                Subir Ejercicio
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 3 }} className="error-alert">
            {error}
          </Alert>
        )}
        
        {downloadURL && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Alert severity="success" sx={{ 
              backgroundColor: 'rgba(187, 255, 0, 0.2)',
              color: '#BBFF00',
              border: '1px solid rgba(187, 255, 0, 0.5)'
            }} className="success-alert">
              Archivo subido correctamente
            </Alert>
            <Button 
              href={downloadURL} 
              target="_blank" 
              rel="noopener noreferrer"
              variant="outlined"
              sx={{ 
                mt: 2,
                color: '#33AAFF',
                borderColor: '#33AAFF',
                '&:hover': {
                  backgroundColor: 'rgba(51, 170, 255, 0.2)',
                  boxShadow: '0 0 10px rgba(51, 170, 255, 0.5)'
                }
              }}
              className="view-button"
            >
              Ver GIF
            </Button>
          </Box>
        )}
      </Paper>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity="success" 
          sx={{ width: '100%' }}
          className="success-alert"
        >
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UploadExercise;
