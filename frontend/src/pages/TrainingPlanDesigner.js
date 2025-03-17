// frontend/src/pages/TrainingPlanDesigner.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './TrainingPlanDesigner.css';
import { 
  Typography, 
  Paper, 
  Grid, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel, 
  Select, 
  MenuItem, 
  Checkbox, 
  Button, 
  Box, 
  Alert, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Divider,
  FormGroup,
  Container,
  Popover,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

// Mapeo de la selección muscular a patrones de movimiento (ejemplo)
// Add this mapping for upper/lower body patterns
const movementPatternMapping = {
  "Empuje": ["Horizontal Push", "Upward Push"],
  "Jalar": ["Horizontal Pull", "Upward Pull", "Downward Pull"],
  "Piernas": ["Double Leg Push", "Single Leg Push", "Bent Leg Hip Extension", "Straight Leg Hip Extension"],
  "Superior": ["Horizontal Push", "Upward Push", "Horizontal Pull", "Upward Pull", "Downward Pull"],
  "Inferior": ["Double Leg Push", "Single Leg Push", "Bent Leg Hip Extension", "Straight Leg Hip Extension"],
  "Cuerpo completo": ["Horizontal Push", "Upward Push", "Horizontal Pull", "Upward Pull", "Downward Pull", 
                      "Double Leg Push", "Single Leg Push", "Bent Leg Hip Extension", "Straight Leg Hip Extension"]
};

const enfoqueOptions = [
  "Multi-Generic Exercise",
  "Isolation-Generic Exercise"
];

const methodOptions = [
  "Standard",
  "Drop Sets",
  "Rest-Pause",
  "Supersets",
  "Cluster Sets",
  "AMRAP",
  "EMOM",
  "Circuit Training",
  "Tabata",
  "Complex Training",
  "Contrast Loading"
];

const equipmentOptions = [
  'Trineo', 'Suspensión', 'Rodillo de espuma', 'Polea', 'Peso Corporal',
  'Fit ball', 'Mancuernas', 'Landmine', 'Kettlebell', 'Disco',
  'Cuerda de batida', 'Chaleco con peso', 'Bolsa de arena', 'Bola de lacrosse',
  'Barra', 'Power band', 'Balón medicinal'
];

const muscleOptions = [
  'Personalizado',
  'Empuje, Jalar, Piernas',
  'Empujar, Jalar, Piernas, Cuerpo completo',
  'Empujar, Jalar, Piernas, Superior, Inferior',
  'Superior, Inferior, Cuerpo completo',
  'Cuerpo Completo',
  'Bro Split'
];

const customMuscleOptions = [
  'Pectorales', 'Espalda', 'Bíceps', 'Tríceps', 'Deltoides',
  'Deltoides posterior', 'Glúteos', 'Abdominales', 'Lumbares',
  'Cuádriceps', 'Isquiotibiales', 'Pantorrilla', 'Aductores',
  'Abductores', 'Antebrazos', 'Trapecio'
];

// Añadir esta constante con todos los patrones de movimiento disponibles
const allMovementPatterns = [
  "Bent Leg Hip Extension",
  "Cardio",
  "Double Leg Push",
  "Core Stability",
  "Auxiliary",
  "Mobility",
  "Explosive",
  "Horizontal Push",
  "Straight Leg Hip Extension",
  "Downward Pull",
  "Upward Pull",
  "Upward Push",
  "Single Leg Push",
  "Horizontal Pull"
];

const TrainingPlanDesigner = () => {
  // Estados de selección
  const [fitnessObjective, setFitnessObjective] = useState('muscleMass'); // muscleMass, conditioning, strength
  const [duration, setDuration] = useState('1');
  const [frequency, setFrequency] = useState('3');
  const [timeAvailable, setTimeAvailable] = useState('30');
  const [muscleSelection, setMuscleSelection] = useState('');
  const [customMuscles, setCustomMuscles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [trainingPlan, setTrainingPlan] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Estado para almacenar todos los ejercicios disponibles por patrón
  const [allAvailableExercises, setAllAvailableExercises] = useState({});
  
  // Popover state variables y handlers
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverExercise, setPopoverExercise] = useState(null);
  
  const handlePopoverOpen = (event, exercise) => {
    setAnchorEl(event.currentTarget);
    setPopoverExercise(exercise);
  };
  
  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverExercise(null);
  };
  
  const open = Boolean(anchorEl);

  // HANDLERS
  const handleFitnessObjectiveChange = (e) => setFitnessObjective(e.target.value);
  const handleDurationChange = (e) => setDuration(e.target.value);
  
  const handleFrequencyChange = (e) => {
    const newFreq = parseInt(e.target.value, 10);
    setFrequency(e.target.value);
    if(newFreq <= 2) setMuscleSelection("Cuerpo Completo");
    else if(newFreq === 3) setMuscleSelection("Empuje, Jalar, Piernas");
    else if(newFreq === 4) setMuscleSelection("Empujar, Jalar, Piernas, Cuerpo completo");
    else if(newFreq === 5) setMuscleSelection("Empujar, Jalar, Piernas, Superior, Inferior");
    else if(newFreq >= 6) setMuscleSelection("Bro Split");
  };

  const handleTimeAvailableChange = (e) => setTimeAvailable(e.target.value);
  const handleMuscleSelectionChange = (e) => {
    setMuscleSelection(e.target.value);
    if(e.target.value !== 'Personalizado'){
      setCustomMuscles([]);
    }
  };

  const handleCustomMuscleChange = (e) => {
    const { value, checked } = e.target;
    if(checked) setCustomMuscles(prev => [...prev, value]);
    else setCustomMuscles(prev => prev.filter(m => m !== value));
  };

  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    if(checked) setEquipment(prev => [...prev, value]);
    else setEquipment(prev => prev.filter(eq => eq !== value));
  };

  const selectAllEquipment = () => setEquipment(equipmentOptions);

  // Heurística: determinar cantidad de ejercicios según objetivo y tiempo disponible
  const getExercisesCountByObjectiveTime = (obj, t) => {
    const timeNum = parseInt(t, 10);
    let total = 0, multi = 0, iso = 0;
    if(obj === 'muscleMass') {
      if(timeNum === 30) { total = 4; multi = 2; iso = 2; }
      else if(timeNum === 45) { total = 6; multi = 3; iso = 3; }
      else if(timeNum === 60) { total = 8; multi = 4; iso = 4; }
      else if(timeNum === 90) { total = 10; multi = 5; iso = 5; }
    } else if(obj === 'conditioning') {
      if(timeNum === 30) { total = 6; multi = 3; iso = 3; }
      else if(timeNum === 45) { total = 8; multi = 4; iso = 4; }
      else if(timeNum === 60) { total = 10; multi = 5; iso = 5; }
      else if(timeNum === 90) { total = 12; multi = 6; iso = 6; }
    } else if(obj === 'strength') {
      if(timeNum === 30) { total = 3; multi = 2; iso = 1; }
      else if(timeNum === 45) { total = 4; multi = 2; iso = 2; }
      else if(timeNum === 60) { total = 5; multi = 3; iso = 2; }
      else if(timeNum === 90) { total = 6; multi = 3; iso = 3; }
    }
    return { total, multi, iso };
  };

  const getRecommendedRest = () => {
    if(fitnessObjective === 'muscleMass') return 90;
    else if(fitnessObjective === 'conditioning') return 60;
    else if(fitnessObjective === 'strength') return 180;
    return 60;
  };

  // Función para obtener ejercicios desde Firebase (se espera que en cada documento existan: nombre, movementCategory, equipo y fileURL)
  const fetchExercises = async () => {
    try {
      const snapshot = await getDocs(collection(db, "exercises"));
      const allExercises = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre || data.name || "",
          movementCategory: data.movementCategory || data.patron || data["patrón"] || "",
          equipo: data.equipo || data.equipment || data.equipamiento || "",
          previewURL: data.fileURL || data.previewURL || ""
        };
      });
      
      // Filtrar según equipamiento disponible
      const filtered = allExercises.filter(ex => {
        if(equipment.length === 0) return true;
        if (typeof ex.equipo === 'string') {
          return equipment.some(eq => ex.equipo.includes(eq));
        }
        if (Array.isArray(ex.equipo)) {
          return equipment.some(eq => ex.equipo.includes(eq));
        }
        return false;
      });
  
      // Organizar ejercicios por patrón de movimiento
      const exercisesByPattern = {};
      filtered.forEach(ex => {
        const pattern = ex.movementCategory || "Unknown";
        if (!exercisesByPattern[pattern]) {
          exercisesByPattern[pattern] = [];
        }
        exercisesByPattern[pattern].push(ex);
      });
  
      setAllAvailableExercises(exercisesByPattern);
      return filtered;
    } catch (err) {
      console.error("Error fetching exercises:", err);
      return [];
    }
  };
  
  // Cargar ejercicios al inicio o cuando cambie el equipamiento
  React.useEffect(() => {
    fetchExercises();
  }, [equipment]);
  
  const [generatingPlan, setGeneratingPlan] = useState(false);
  
  const generatePlan = async () => {
    setMessage('');
    setError('');
    setGeneratingPlan(true);
    
    if (muscleSelection === 'Personalizado' && customMuscles.length === 0) {
      setError('Por favor selecciona al menos un grupo muscular');
      setGeneratingPlan(false);
      return;
    }
    
    if (equipment.length === 0) {
      setError('Por favor selecciona al menos un equipamiento disponible');
      setGeneratingPlan(false);
      return;
    }
    
    try {
      const exercises = await fetchExercises();
      
      if (exercises.length === 0) {
        setError('No se encontraron ejercicios con el equipamiento seleccionado');
        setGeneratingPlan(false);
        return;
      }
      
      // Separar ejercicios en compuestos (multi) y de aislamiento (iso)
      const multiExercises = exercises.filter(ex => 
        ["Horizontal Push", "Upward Push", "Horizontal Pull", "Upward Pull", "Downward Pull", 
         "Double Leg Push", "Single Leg Push", "Bent Leg Hip Extension", "Straight Leg Hip Extension"].includes(ex.movementCategory)
      );
      
      const isoExercises = exercises.filter(ex => 
        ["Auxiliary", "Core Stability", "Mobility", "Explosive", "Cardio"].includes(ex.movementCategory)
      );
      
      const durationMonths = parseInt(duration, 10);
      const frequencyPerWeek = parseInt(frequency, 10);
      const totalSessions = durationMonths * 4 * frequencyPerWeek;
      
      const { total, multi, iso } = getExercisesCountByObjectiveTime(fitnessObjective, timeAvailable);
      
      const defaultSeries = fitnessObjective === 'strength' ? 5 : (fitnessObjective === 'muscleMass' ? 4 : 3);
      const restDefault = getRecommendedRest();
  
      let muscleCycle = [];
      if (muscleSelection) {
        if(muscleSelection === 'Personalizado'){
          muscleCycle = customMuscles;
        } else if(muscleSelection === 'Superior, Inferior, Cuerpo completo') {
          // Special handling for this specific selection
          muscleCycle = ['Superior', 'Inferior', 'Cuerpo completo'];
        } else {
          muscleCycle = muscleSelection.split(',').map(g => g.trim());
        }
      }
  
      let plan = [];
      for (let s = 1; s <= totalSessions; s++) {
        // For "Superior, Inferior, Cuerpo completo" we use modulo to cycle through the days
        const seleccionMuscular = muscleCycle.length > 0 ? muscleCycle[(s - 1) % muscleCycle.length] : "";
        
        // Get allowed movement patterns based on the muscle selection for this session
        const allowedPatterns = movementPatternMapping[seleccionMuscular] || [];
        
        let sessionExercises = [];
        for (let m = 0; m < multi; m++) {
          let filteredMulti = multiExercises;
          if (allowedPatterns.length > 0) {
            filteredMulti = multiExercises.filter(ex => allowedPatterns.includes(ex.movementCategory));
            if(filteredMulti.length === 0) filteredMulti = multiExercises;
          }
          // En la función generatePlan
          const randIndex = Math.floor(Math.random() * filteredMulti.length);
          sessionExercises.push({
            isMulti: true,
            suggestedExercise: filteredMulti[randIndex] // Posible error si filteredMulti está vacío
          });
        }
        for (let i = 0; i < iso; i++) {
          let filteredIso = isoExercises;
          if (allowedPatterns.length > 0) {
            filteredIso = isoExercises.filter(ex => allowedPatterns.includes(ex.movementCategory));
            if(filteredIso.length === 0) filteredIso = isoExercises;
          }
          const randIndex = Math.floor(Math.random() * filteredIso.length);
          sessionExercises.push({
            isMulti: false,
            suggestedExercise: filteredIso[randIndex]
          });
        }
        if (sessionExercises.length > total) {
          sessionExercises = sessionExercises.slice(0, total);
        }
        sessionExercises.forEach((exObj, idx) => {
          plan.push({
            sessionNumber: s,
            exerciseNumber: idx + 1,
            preview: exObj.suggestedExercise.previewURL || "",
            exerciseId: exObj.suggestedExercise.id,
            enfoque: exObj.isMulti ? "Multi-Generic Exercise" : "Isolation-Generic Exercise",
            seleccionMuscular: seleccionMuscular,
            nombreEjercicio: exObj.suggestedExercise.nombre || (exObj.isMulti ? "Multi-Generic Exercise" : "Isolation-Generic Exercise"),
            patronMovimiento: exObj.suggestedExercise.movementCategory || "",
            equipmentUsed: exObj.suggestedExercise.equipo || "Sin equipo",
            series: defaultSeries,
            rest: restDefault,
            metodo: "Standard" // Por defecto "Standard"
          });
        });
      }
  
      setTrainingPlan(plan);
      setMessage("Plan generado exitosamente. Puedes editarlo en la tabla.");
    } catch (error) {
      console.error("Error al generar el plan:", error);
      setError("Ocurrió un error al generar el plan. Por favor intenta de nuevo.");
    } finally {
      setGeneratingPlan(false);
    }
  };
  
  // Add a state to store the current user
  const [currentUser, setCurrentUser] = useState(null);
  // Añadir estado para el nombre del plan
  const [planName, setPlanName] = useState('');
  
  // Add useEffect to get the current user when component mounts
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  // Handlers para editar la tabla
  const handleExerciseChange = (e, index) => {
    const newPlan = [...trainingPlan];
    newPlan[index].enfoque = e.target.value;
    setTrainingPlan(newPlan);
  };
  
  const handleSeriesChange = (e, index) => {
    const newPlan = [...trainingPlan];
    newPlan[index].series = e.target.value;
    setTrainingPlan(newPlan);
  };
  
  const handleRestChange = (e, index) => {
    const newPlan = [...trainingPlan];
    newPlan[index].rest = e.target.value;
    setTrainingPlan(newPlan);
  };

  const handlePatternMovementChange = (e, index) => {
    const newPlan = [...trainingPlan];
    const newPattern = e.target.value;
    newPlan[index].patronMovimiento = newPattern;
    
    if (allAvailableExercises[newPattern] && allAvailableExercises[newPattern].length > 0) {
      const randomIndex = Math.floor(Math.random() * allAvailableExercises[newPattern].length);
      const newExercise = allAvailableExercises[newPattern][randomIndex];
      
      newPlan[index].nombreEjercicio = newExercise.nombre || "";
      newPlan[index].preview = newExercise.previewURL || "";
      newPlan[index].equipmentUsed = newExercise.equipo || "Sin equipo";
      newPlan[index].exerciseId = newExercise.id;
    }
    
    setTrainingPlan(newPlan);
  };

  const handleExerciseNameChange = (e, index) => {
    const newPlan = [...trainingPlan];
    newPlan[index].nombreEjercicio = e.target.value;
    setTrainingPlan(newPlan);
  };

  const handleMuscleGroupChange = (e, index) => {
    const newPlan = [...trainingPlan];
    newPlan[index].seleccionMuscular = e.target.value;
    setTrainingPlan(newPlan);
  };

  // Nuevo handler para cambiar el método
  const handleMethodChange = (e, index) => {
    const newPlan = [...trainingPlan];
    newPlan[index].metodo = e.target.value;
    setTrainingPlan(newPlan);
  };

  // Eliminar completamente esta función externa
  // Añadir handleSubmit dentro del componente
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (trainingPlan.length === 0) {
      setError("Por favor genera un plan antes de guardar");
      return;
    }
    
    if (!planName.trim()) {
      setError("Por favor ingresa un nombre para el plan");
      return;
    }
    
    try {
      const planData = {
        name: planName,
        plan: trainingPlan,
        fitnessObjective,
        duration,
        frequency,
        timeAvailable,
        muscleSelection,
        customMuscles,
        equipment,
        createdAt: new Date(),
        // Añadir información del creador
        creator: {
          uid: currentUser ? currentUser.uid : 'anonymous',
          email: currentUser ? currentUser.email : 'anonymous',
          displayName: currentUser ? currentUser.displayName : 'Usuario Anónimo'
        }
      };
      
      await addDoc(collection(db, "trainingPlans"), planData);
      setMessage("Plan de entrenamiento guardado correctamente.");
      setPlanName(''); // Limpiar el nombre después de guardar
    } catch (err) {
      console.error("Error al guardar plan de entrenamiento:", err);
      setError("Error al guardar plan de entrenamiento: " + err.message);
    }
  };

  return (
    <Container maxWidth="lg" className="training-plan-container" sx={{ paddingTop: '100px' }}>
      <Box sx={{ py: 4 }}>
        <Typography 
          variant="h4" 
          component="h1"           
          gutterBottom 
          className="training-plan-title"
          sx={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
        >
          Diseñador de Entrenamientos
        </Typography>
        
        <Paper elevation={3} className="form-paper">
          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              {/* Objetivo Fitness */}
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset" fullWidth className="form-control-group">
                  <FormLabel component="legend" className="form-section-label">
                    Objetivo Fitness
                  </FormLabel>
                  <RadioGroup
                    name="fitnessObjective"
                    value={fitnessObjective}
                    onChange={handleFitnessObjectiveChange}
                  >
                    <FormControlLabel 
                      value="muscleMass" 
                      control={<Radio />} 
                      label="Incrementar masa muscular" 
                    />
                    <FormControlLabel 
                      value="conditioning" 
                      control={<Radio />} 
                      label="Acondicionamiento físico y definición" 
                    />
                    <FormControlLabel 
                      value="strength" 
                      control={<Radio />} 
                      label="Incremento de fuerza" 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Duración y Frecuencia */}
              <Grid item xs={12} md={6}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth className="form-control-group">
                      <FormLabel className="form-section-label">
                        Duración del Programa (meses)
                      </FormLabel>
                      <Select
                        value={duration}
                        onChange={handleDurationChange}
                        variant="outlined"
                        className="form-select"
                      >
                        {[...Array(6)].map((_, i) => (
                          <MenuItem key={i} value={i+1}>
                            {i+1} {(i+1) === 1 ? 'mes' : 'meses'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth className="form-control-group">
                      <FormLabel className="form-section-label">
                        Frecuencia Semanal de Entrenamiento
                      </FormLabel>
                      <Select
                        value={frequency}
                        onChange={handleFrequencyChange}
                        variant="outlined"
                        className="form-select"
                      >
                        {[...Array(7)].map((_, i) => (
                          <MenuItem key={i} value={i+1}>
                            {i+1} {(i+1) === 1 ? 'día' : 'días'} por semana
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth className="form-control-group">
                      <FormLabel className="form-section-label">
                        Tiempo disponible por sesión
                      </FormLabel>
                      <Select
                        value={timeAvailable}
                        onChange={handleTimeAvailableChange}
                        variant="outlined"
                        className="form-select"
                      >
                        <MenuItem value="30">30 minutos</MenuItem>
                        <MenuItem value="45">45 minutos</MenuItem>
                        <MenuItem value="60">60 minutos</MenuItem>
                        <MenuItem value="90">90 minutos</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              {/* Selección Muscular */}
              <Grid item xs={12}>
                <FormControl fullWidth className="form-control-group">
                  <FormLabel className="form-section-label">
                    Selección Muscular
                  </FormLabel>
                  <Select
                    value={muscleSelection}
                    onChange={handleMuscleSelectionChange}
                    variant="outlined"
                    className="form-select"
                  >
                    {muscleOptions.map((option, idx) => (
                      <MenuItem key={idx} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Músculos Personalizados */}
              {muscleSelection === 'Personalizado' && (
                <Grid item xs={12}>
                  <FormLabel className="form-section-label" style={{ display: 'block' }}>
                    Selecciona los grupos musculares
                  </FormLabel>
                  <FormGroup row>
                    {customMuscleOptions.map((muscle, idx) => (
                      <FormControlLabel
                        key={idx}
                        control={
                          <Checkbox 
                            checked={customMuscles.includes(muscle)}
                            onChange={handleCustomMuscleChange}
                            value={muscle}
                          />
                        }
                        label={muscle}
                        className="muscle-checkbox"
                      />
                    ))}
                  </FormGroup>
                </Grid>
              )}

              {/* Equipamiento Disponible */}
              <Grid item xs={12}>
                <FormLabel className="form-section-label">
                  Equipamiento Disponible
                </FormLabel>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={selectAllEquipment}
                  className="action-button select-all-button"
                >
                  Seleccionar Todo
                </Button>
                <FormGroup row>
                  {equipmentOptions.map((eq, idx) => (
                    <FormControlLabel
                      key={idx}
                      control={
                        <Checkbox 
                          checked={equipment.includes(eq)}
                          onChange={handleEquipmentChange}
                          value={eq}
                        />
                      }
                      label={eq}
                      className="equipment-checkbox"
                    />
                  ))}
                </FormGroup>
              </Grid>

              {/* Botones de Acción */}
              <Grid item xs={12}>
                <Divider className="section-divider" />
                
                {/* Campo para el nombre del plan */}
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth>
                    <FormLabel className="form-section-label">
                      Nombre del Plan de Entrenamiento
                    </FormLabel>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="Ingresa un nombre para tu plan"
                      className="form-input"
                      style={{
                        padding: '10px',
                        fontSize: '16px',
                        width: '100%',
                        backgroundColor: '#333',
                        color: 'white',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        marginTop: '8px'
                      }}
                    />
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={generatePlan}
                    disabled={generatingPlan}
                    className="action-button generate-button"
                  >
                    {generatingPlan ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                        Generando plan...
                      </>
                    ) : (
                      "Generar Plan"
                    )}
                  </Button>
                  <Button 
                    variant="contained" 
                    type="submit"
                    disabled={trainingPlan.length === 0}
                    className="action-button save-button"
                  >
                    Guardar Plan de Entrenamiento
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
        
        {/* Mensajes de estado */}
        {message && (
          <Alert severity="success" className="status-alert success-alert">{message}</Alert>
        )}
        {error && (
          <Alert severity="error" className="status-alert error-alert">{error}</Alert>
        )}
        
        {/* Tabla de resultados */}
        {trainingPlan.length > 0 && (
          <Paper elevation={3} className="results-container">
            <Typography 
              variant="h5" 
              gutterBottom 
              className="results-title"
              sx={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, p: 2 }}
            >
              Plan de Entrenamiento Generado
            </Typography>
            
            {/* Agrupamos los ejercicios por sesión */}
            {Array.from(new Set(trainingPlan.map(ex => ex.sessionNumber))).map(sessionNum => (
              <Box key={sessionNum} className="session-container" sx={{ mb: 4, p: 2, backgroundColor: sessionNum % 2 === 0 ? '#1a1a1a' : '#2a2a2a' }}>
                <Typography variant="h6" sx={{ color: '#BBFF00', mb: 2, fontWeight: 'bold' }}>
                  Sesión {sessionNum}
                </Typography>
                
                <Grid container spacing={2}>
                  {trainingPlan.filter(ex => ex.sessionNumber === sessionNum).map((exercise, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ height: '100%', backgroundColor: '#333', color: 'white', position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                          <Tooltip title="Ver detalles">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => handlePopoverOpen(e, exercise)}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        {exercise.preview && (
                          <CardMedia
                            component="img"
                            height="140"
                            image={exercise.preview}
                            alt={exercise.nombreEjercicio}
                            sx={{ objectFit: 'contain', backgroundColor: '#222' }}
                          />
                        )}
                        
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Ejercicio #{exercise.exerciseNumber}
                          </Typography>
                          
                          <Grid container spacing={1}>
                            <Grid item xs={12}>
                              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.8rem' }}>Nombre:</Typography>
                              <Select
                                value={exercise.nombreEjercicio || ""}
                                onChange={(e) => handleExerciseNameChange(e, index)}
                                size="small"
                                fullWidth
                                sx={{ mb: 1 }}
                              >
                                {allAvailableExercises[exercise.patronMovimiento] ? 
                                  allAvailableExercises[exercise.patronMovimiento].map((ex, idx) => (
                                    <MenuItem 
                                      key={idx} 
                                      value={ex.nombre}
                                      onClick={() => {
                                        const newPlan = [...trainingPlan];
                                        newPlan[index].nombreEjercicio = ex.nombre;
                                        newPlan[index].preview = ex.previewURL;
                                        newPlan[index].equipmentUsed = ex.equipo;
                                        newPlan[index].exerciseId = ex.id;
                                        setTrainingPlan(newPlan);
                                      }}
                                    >
                                      {ex.previewURL && (
                                        <img 
                                          src={ex.previewURL} 
                                          alt={ex.nombre} 
                                          className="exercise-thumbnail"
                                          style={{ width: '30px', height: '30px', marginRight: '8px' }}
                                        />
                                      )}
                                      {ex.nombre}
                                    </MenuItem>
                                  )) : (
                                    <MenuItem value={exercise.nombreEjercicio}>{exercise.nombreEjercicio}</MenuItem>
                                  )
                                }
                              </Select>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.8rem' }}>Grupo Muscular:</Typography>
                              <Select
                                value={exercise.seleccionMuscular || ""}
                                onChange={(e) => handleMuscleGroupChange(e, index)}
                                size="small"
                                fullWidth
                                sx={{ mb: 1 }}
                              >
                                {muscleOptions.flatMap(option => 
                                  option === 'Personalizado' 
                                    ? customMuscleOptions.map(muscle => (
                                        <MenuItem key={muscle} value={muscle}>{muscle}</MenuItem>
                                      ))
                                    : option.split(',').map(g => (
                                        <MenuItem key={g.trim()} value={g.trim()}>{g.trim()}</MenuItem>
                                      ))
                                )}
                              </Select>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.8rem' }}>Patrón:</Typography>
                              <Select
                                value={exercise.patronMovimiento || ""}
                                onChange={(e) => handlePatternMovementChange(e, index)}
                                size="small"
                                fullWidth
                                sx={{ mb: 1 }}
                              >
                                {allMovementPatterns.map((pattern, idx) => (
                                  <MenuItem key={idx} value={pattern}>{pattern}</MenuItem>
                                ))}
                              </Select>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.8rem' }}>Método:</Typography>
                              <Select
                                value={exercise.metodo || "Standard"}
                                onChange={(e) => handleMethodChange(e, index)}
                                size="small"
                                fullWidth
                                sx={{ mb: 1 }}
                              >
                                {methodOptions.map((opt, idx) => (
                                  <MenuItem key={idx} value={opt}>{opt}</MenuItem>
                                ))}
                              </Select>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.8rem' }}>Enfoque:</Typography>
                              <Select
                                value={exercise.enfoque}
                                onChange={(e) => handleExerciseChange(e, index)}
                                size="small"
                                fullWidth
                                sx={{ mb: 1 }}
                              >
                                {enfoqueOptions.map((opt, idx) => (
                                  <MenuItem key={idx} value={opt}>{opt}</MenuItem>
                                ))}
                              </Select>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.8rem' }}>Series:</Typography>
                              <Select
                                value={exercise.series}
                                onChange={(e) => handleSeriesChange(e, index)}
                                size="small"
                                fullWidth
                                sx={{ mb: 1 }}
                              >
                                {[...Array(8)].map((_, i) => (
                                  <MenuItem key={i} value={i+1}>{i+1}</MenuItem>
                                ))}
                              </Select>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.8rem' }}>Descanso (seg):</Typography>
                              <Select
                                value={exercise.rest}
                                onChange={(e) => handleRestChange(e, index)}
                                size="small"
                                fullWidth
                                sx={{ mb: 1 }}
                              >
                                <MenuItem value={30}>30</MenuItem>
                                <MenuItem value={60}>60</MenuItem>
                                <MenuItem value={90}>90</MenuItem>
                                <MenuItem value={120}>120</MenuItem>
                                <MenuItem value={180}>180</MenuItem>
                              </Select>
                            </Grid>
                            
                            <Grid item xs={12}>
                              <Typography variant="body2" sx={{ color: '#aaa', fontSize: '0.8rem' }}>
                                Equipamiento: <span style={{ color: 'white' }}>{exercise.equipmentUsed}</span>
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
            
            {/* Popover para detalles del ejercicio - se mantiene igual */}
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{
                vertical: 'center',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'center',
                horizontal: 'center',
              }}
            >
              {popoverExercise && (
                <Card className="exercise-popover-card">
                  {popoverExercise.preview && (
                    <CardMedia
                      component="img"
                      className="exercise-image"
                      image={popoverExercise.preview}
                      alt={popoverExercise.nombreEjercicio}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" component="div" className="exercise-details-title">
                      {popoverExercise.nombreEjercicio}
                    </Typography>
                    <Typography variant="body2" className="exercise-details-text">
                      <span className="exercise-details-label">Grupo Muscular:</span> {popoverExercise.seleccionMuscular}
                    </Typography>
                    <Typography variant="body2" className="exercise-details-text">
                      <span className="exercise-details-label">Patrón de Movimiento:</span> {popoverExercise.patronMovimiento}
                    </Typography>
                    <Typography variant="body2" className="exercise-details-text">
                      <span className="exercise-details-label">Equipamiento:</span> {popoverExercise.equipmentUsed}
                    </Typography>
                    <Typography variant="body2" className="exercise-details-text">
                      <span className="exercise-details-label">Enfoque:</span> {popoverExercise.enfoque}
                    </Typography>
                    <Typography variant="body2" className="exercise-details-text">
                      <span className="exercise-details-label">Series:</span> {popoverExercise.series}
                    </Typography>
                    <Typography variant="body2" className="exercise-details-text">
                      <span className="exercise-details-label">Descanso:</span> {popoverExercise.rest} segundos
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Popover>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default TrainingPlanDesigner;
