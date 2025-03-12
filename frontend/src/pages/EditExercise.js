import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Container, Typography, Box, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem,
  Grid, Alert, Paper, Card, CardMedia
} from '@mui/material';
import './EditExercise.css';

const EditExercise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exerciseData, setExerciseData] = useState({
    name: '',
    mainMuscle: '',
    secondaryMuscle: '',
    movementCategory: '',
    equipment: '',
    otherEquipment: '',
    focus: '',
    fileURL: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const docRef = doc(db, "exercises", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Verificar si el equipamiento es personalizado
          const isCustomEquipment = !equipmentOptions.includes(data.equipment);
          
          setExerciseData({
            ...data,
            equipment: isCustomEquipment ? 'Otro' : data.equipment,
            otherEquipment: isCustomEquipment ? data.equipment : '',
            focus: data.focus || '' // Asegurar que focus existe
          });
        } else {
          setError("Ejercicio no encontrado.");
        }
      } catch (err) {
        console.error("Error al cargar el ejercicio:", err);
        setError("Error al cargar el ejercicio: " + err.message);
      }
      setLoading(false);
    };

    fetchExercise();
  }, [id]);

  const handleChange = (e) => {
    setExerciseData({
      ...exerciseData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Preparar los datos para actualizar
      let dataToUpdate = { ...exerciseData };
      
      // Si el equipamiento es "Otro", usar el valor personalizado
      if (exerciseData.equipment === 'Otro' && exerciseData.otherEquipment) {
        dataToUpdate.equipment = exerciseData.otherEquipment;
      }
      
      // Eliminar campos que no queremos guardar en Firestore
      const { otherEquipment, ...cleanData } = dataToUpdate;
      
      const docRef = doc(db, "exercises", id);
      await updateDoc(docRef, cleanData);
      
      setMessage("Ejercicio actualizado correctamente.");
      setTimeout(() => {
        navigate("/library");
      }, 1500);
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError("Error al actualizar: " + err.message);
    }
  };

  if (loading) return (
    <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
      <Typography>Cargando ejercicio...</Typography>
    </Container>
  );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Editar Ejercicio
        </Typography>
        
        {exerciseData.fileURL && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Card sx={{ maxWidth: 300 }}>
              <CardMedia
                component="img"
                image={exerciseData.fileURL}
                alt={exerciseData.name}
                sx={{ height: 200, objectFit: 'contain' }}
              />
            </Card>
          </Box>
        )}
        
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
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
                size="large"
              >
                Actualizar Ejercicio
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditExercise;