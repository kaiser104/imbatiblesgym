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
  Alert, Snackbar, Paper, Stepper, Step, StepLabel,
  Divider, Chip, Tooltip, IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoIcon from '@mui/icons-material/Info';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CategoryIcon from '@mui/icons-material/Category';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const db = getFirestore(app);

const UploadExercise = () => {
  const navigate = useNavigate();
  
  // Función para navegar de vuelta a la biblioteca
  const handleBackToLibrary = () => {
    navigate('/exercise-manager');
  };
  
  const [exerciseData, setExerciseData] = useState({
    name: '',
    mainMuscle: '',
    secondaryMuscle: '',
    movementCategory: '',
    equipment: '',
    otherEquipment: '',
    focus: '',
    description: '' // Nuevo campo para descripción del ejercicio
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Pasos del formulario
  const steps = ['Basic Information', 'Categorization', 'GIF File'];

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
    'Cuerda de batida', 'Ghd', 'Chaleco con peso', 'Bolsa de arena', 'Bola de lacrosse',
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

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
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
            ...dataToSave,
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
              otherEquipment: '',
              focus: '',
              description: ''
            });
            setFile(null);
            setPreviewUrl(null);
            setUploadProgress(0);
            setActiveStep(0);
          } catch (err) {
            console.error("Error al guardar en Firestore:", err);
            setError("Error al guardar el ejercicio: " + err.message);
          }
        });
      }
    );
  };

  // Renderizar el paso actual del formulario
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del ejercicio"
                  name="name"
                  value={exerciseData.name}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: <FitnessCenterIcon sx={{ mr: 1, color: '#BBFF00' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción del ejercicio"
                  name="description"
                  value={exerciseData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Describe cómo realizar correctamente este ejercicio"
                />
              </Grid>
            </Grid>
          </>
        );
      case 1:
        return (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Músculo principal</InputLabel>
                  <Select
                    name="mainMuscle"
                    value={exerciseData.mainMuscle}
                    onChange={handleChange}
                    label="Músculo principal"
                    startAdornment={<CategoryIcon sx={{ mr: 1, color: '#BBFF00' }} />}
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
                <Tooltip title="La categoría de movimiento ayuda a clasificar los ejercicios según el tipo de acción muscular">
                  <IconButton size="small" sx={{ ml: 1, color: '#33AAFF' }}>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
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
            </Grid>
          </>
        );
      case 2:
        return (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{ 
                    mb: 2,
                    color: '#BBFF00',
                    borderColor: '#BBFF00',
                    padding: '10px 20px',
                    fontSize: '1rem',
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
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={file.name}
                      color="primary"
                      variant="outlined"
                      sx={{ 
                        color: '#33AAFF',
                        borderColor: '#33AAFF',
                        '& .MuiChip-label': { fontSize: '0.9rem' }
                      }}
                    />
                  </Box>
                )}
              </Grid>
              
              {previewUrl && (
                <Grid item xs={12} sx={{ textAlign: 'center' }}>
                  <Card sx={{ maxWidth: 300, mx: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }} className="preview-card">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#33AAFF', fontWeight: 'bold' }}>
                        Vista previa:
                      </Typography>
                      <Box sx={{ 
                        border: '1px solid rgba(187, 255, 0, 0.3)',
                        borderRadius: '4px',
                        padding: '8px',
                        backgroundColor: 'rgba(0,0,0,0.05)'
                      }}>
                        <img 
                          src={previewUrl} 
                          alt="Vista previa" 
                          className="preview-image"
                          style={{ maxWidth: '100%', maxHeight: '200px' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {uploadProgress > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom sx={{ color: '#33AAFF' }}>
                    Progreso de carga: {uploadProgress}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      height: 8,
                      borderRadius: 5,
                      backgroundColor: 'rgba(187, 255, 0, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#BBFF00'
                      }
                    }}
                    className
                    />
                </Grid>
              )}
            </Grid>
          </>
        );
      default:
        return 'Paso desconocido';
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Cambiar los títulos y etiquetas a inglés
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }} className="upload-container">
      <Paper elevation={3} className="upload-paper">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToLibrary}
            className="back-button"
          >
            Back to Library
          </Button>
          <Typography variant="h4" component="h1" gutterBottom align="center" className="upload-title">
            Add New Exercise
          </Typography>
          <Box sx={{ width: '100px' }}></Box> {/* Spacer for alignment */}
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}
          
          <Box sx={{ mb: 4 }}>
            {getStepContent(activeStep)}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Atrás
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  type="submit"
                  startIcon={<SaveIcon />}
                  sx={{ 
                    backgroundColor: '#BBFF00',
                    color: '#333',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#A0E000',
                    }
                  }}
                >
                  Guardar Ejercicio
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ 
                    backgroundColor: '#33AAFF',
                    '&:hover': {
                      backgroundColor: '#2299EE',
                    }
                  }}
                >
                  Siguiente
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UploadExercise;
