import React, { useState, useEffect } from 'react';
import { Container, Typography, Alert } from '@mui/material';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import TrainingPlanForm from '../components/TrainingPlanForm';
import TrainingPlanDisplay from '../components/TrainingPlanDisplay';

const TrainingPlanDesigner = () => {
  const { currentUser } = useAuth();
  const [allExercises, setAllExercises] = useState([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Estados para el popover de detalles de ejercicio
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverExercise, setPopoverExercise] = useState(null);
  const open = Boolean(anchorEl);
  
  // Estados para el menú de ejercicios alternativos
  const [alternativesAnchorEl, setAlternativesAnchorEl] = useState(null);
  const [alternativeExercises, setAlternativeExercises] = useState([]);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);
  
  // Opciones para los selectores
  const muscleOptions = [
    'Superior, Inferior, Cuerpo completo',
    'Pecho, Espalda, Piernas, Hombros, Brazos',
    'Pecho, Espalda, Piernas',
    'Empuje, Tirón, Piernas',
    'Personalizado'
  ];
  
  const customMuscleOptions = [
    'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Piernas', 'Core',
    'Superior', 'Inferior', 'Cuerpo completo', 'Empuje', 'Tirón'
  ];
  
  const equipmentOptions = [
    'Trineo', 'Suspensión', 'Rodillo de espuma', 'Polea', 'Peso Corporal',
    'Fit ball', 'Mancuernas', 'Landmine', 'Kettlebell', 'Disco',
    'Cuerda de batida', 'Chaleco con peso', 'Bolsa de arena', 'Bola de lacrosse',
    'Barra', 'Power band', 'Balón medicinal', 'Máquinas', 'Bandas elásticas'
  ];
  const enfoqueOptions = [
    'Multiarticular', 'Monoarticular'
  ];
  const methodOptions = [
    'Standard', 'Superset', 'Drop Set', 'Rest-Pause', 'Pyramid', 
    'AMRAP', 'EMOM', 'Tabata', 'Circuit'
  ];
  const allMovementPatterns = [
    'Horizontal Push', 'Upward Push', 'Horizontal Pull', 'Upward Pull', 
    'Downward Pull', 'Double Leg Push', 'Single Leg Push', 
    'Bent Leg Hip Extension', 'Straight Leg Hip Extension',
    'Auxiliary', 'Core Stability', 'Mobility', 'Explosive', 'Cardio'
  ];
  const movementPatternMapping = {
    'Pecho': ['Horizontal Push', 'Upward Push'],
    'Espalda': ['Horizontal Pull', 'Upward Pull', 'Downward Pull'],
    'Hombros': ['Upward Push', 'Auxiliary'],
    'Brazos': ['Auxiliary'],
    'Piernas': ['Double Leg Push', 'Single Leg Push', 'Bent Leg Hip Extension', 'Straight Leg Hip Extension'],
    'Core': ['Core Stability'],
    'Superior': ['Horizontal Push', 'Upward Push', 'Horizontal Pull', 'Upward Pull', 'Downward Pull', 'Auxiliary'],
    'Inferior': ['Double Leg Push', 'Single Leg Push', 'Bent Leg Hip Extension', 'Straight Leg Hip Extension'],
    'Cuerpo completo': allMovementPatterns,
    'Empuje': ['Horizontal Push', 'Upward Push', 'Double Leg Push', 'Single Leg Push'],
    'Tirón': ['Horizontal Pull', 'Upward Pull', 'Downward Pull', 'Bent Leg Hip Extension', 'Straight Leg Hip Extension']
  };
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    fitnessObjective: 'muscleMass',
    prioritizacion: 'diversidad',
    duration: '3',
    frequency: '3',
    timeAvailable: '60',
    muscleSelection: 'Superior, Inferior, Cuerpo completo',
    customMuscles: [],
    equipment: [],
    planName: '',
    trainingPlan: []
  });
  
  // Handlers para el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCustomMuscleChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          customMuscles: [...prev.customMuscles, value]
        };
      } else {
        return {
          ...prev,
          customMuscles: prev.customMuscles.filter(muscle => muscle !== value)
        };
      }
    });
  };
  
  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          equipment: [...prev.equipment, value]
        };
      } else {
        return {
          ...prev,
          equipment: prev.equipment.filter(eq => eq !== value)
        };
      }
    });
  };
  
  const selectAllEquipment = () => {
    setFormData(prev => ({
      ...prev,
      equipment: [...equipmentOptions]
    }));
  };
  
  // Handlers para el popover y menú de alternativas
  const handlePopoverOpen = (event, exercise) => {
    setAnchorEl(event.currentTarget);
    setPopoverExercise(exercise);
  };
  
  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverExercise(null);
  };
  
  const handleAlternativesOpen = (event, exercise, index) => {
    setAlternativesAnchorEl(event.currentTarget);
    setSelectedExerciseIndex(index);
    
    // Filtrar ejercicios alternativos con el mismo patrón de movimiento
    const alternatives = allExercises.filter(ex => 
      ex.movementCategory === exercise.patronMovimiento && 
      ex.id !== exercise.exerciseId
    );
    
    setAlternativeExercises(alternatives);
  };
  
  const handleAlternativesClose = () => {
    setAlternativesAnchorEl(null);
    setSelectedExerciseIndex(null);
  };
  
  const handleSelectAlternative = (exercise) => {
    handleSelectExerciseOption(exercise, formData.trainingPlan.indexOf(popoverExercise));
    handleAlternativesClose();
  };
  
  // Funciones para generar el plan
  const getExercisesCountByObjectiveTime = (objective, time) => {
    const timeInt = parseInt(time, 10);
    
    let total, multi, iso;
    
    if (objective === 'muscleMass') {
      if (timeInt <= 30) {
        total = 4; multi = 3; iso = 1;
      } else if (timeInt <= 45) {
        total = 5; multi = 4; iso = 1;
      } else if (timeInt <= 60) {
        total = 6; multi = 4; iso = 2;
      } else {
        total = 8; multi = 5; iso = 3;
      }
    } else if (objective === 'strength') {
      if (timeInt <= 30) {
        total = 3; multi = 3; iso = 0;
      } else if (timeInt <= 45) {
        total = 4; multi = 3; iso = 1;
      } else if (timeInt <= 60) {
        total = 5; multi = 4; iso = 1;
      } else {
        total = 6; multi = 5; iso = 1;
      }
    } else { // conditioning
      if (timeInt <= 30) {
        total = 5; multi = 3; iso = 2;
      } else if (timeInt <= 45) {
        total = 7; multi = 4; iso = 3;
      } else if (timeInt <= 60) {
        total = 8; multi = 5; iso = 3;
      } else {
        total = 10; multi = 6; iso = 4;
      }
    }
    
    return { total, multi, iso };
  };
  
  const getRecommendedRest = () => {
    switch (formData.fitnessObjective) {
      case 'muscleMass':
        return 90; // 90 segundos para hipertrofia
      case 'strength':
        return 180; // 180 segundos (3 min) para fuerza
      case 'conditioning':
        return 45; // 45 segundos para acondicionamiento
      default:
        return 60;
    }
  };
  
  // Cargar ejercicios de Firebase
  useEffect(() => {
    const fetchAllExercises = async () => {
      try {
        const exercisesCollection = collection(db, "exercises");
        const exercisesSnapshot = await getDocs(exercisesCollection);
        const exercises = exercisesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            nombre: data.name || "",
            movementCategory: data.movementCategory || "",
            previewURL: data.fileURL || "",
            equipo: data.equipment || "Sin equipo",
            mainMuscle: data.mainMuscle || "",
            secondaryMuscle: data.secondaryMuscle || ""
          };
        });
        setAllExercises(exercises);
      } catch (err) {
        console.error("Error fetching exercises:", err);
      }
    };
    
    fetchAllExercises();
  }, []);
  
  // Función para obtener ejercicios por patrón de movimiento
  const getExercisesByMovementPattern = (pattern) => {
    return allExercises.filter(ex => ex.movementCategory === pattern);
  };
  
  // Función para generar el plan de entrenamiento
  const generatePlan = async () => {
    try {
      setGeneratingPlan(true);
      setError('');
      setMessage('');
      
      if (formData.equipment.length === 0) {
        setError("Por favor, selecciona al menos un tipo de equipamiento disponible");
        setGeneratingPlan(false);
        return;
      }
      
      // Determinar los patrones de movimiento según la selección de músculos
      let selectedPatterns = [];
      
      if (formData.muscleSelection === 'Personalizado') {
        if (formData.customMuscles.length === 0) {
          setError("Por favor, selecciona al menos un grupo muscular personalizado");
          setGeneratingPlan(false);
          return;
        }
        
        formData.customMuscles.forEach(muscle => {
          if (movementPatternMapping[muscle]) {
            selectedPatterns = [...selectedPatterns, ...movementPatternMapping[muscle]];
          }
        });
      } else {
        const muscleGroups = formData.muscleSelection.split(', ');
        muscleGroups.forEach(muscle => {
          if (movementPatternMapping[muscle]) {
            selectedPatterns = [...selectedPatterns, ...movementPatternMapping[muscle]];
          }
        });
      }
      
      // Eliminar duplicados
      selectedPatterns = [...new Set(selectedPatterns)];
      
      // Calcular número de sesiones totales
      const monthsCount = parseInt(formData.duration, 10);
      const weeklyFrequency = parseInt(formData.frequency, 10);
      const totalSessions = monthsCount * 4 * weeklyFrequency; // 4 semanas por mes
      
      // Determinar número de ejercicios por sesión según objetivo y tiempo
      const { total, multi, iso } = getExercisesCountByObjectiveTime(
        formData.fitnessObjective, 
        formData.timeAvailable
      );
      
      // Crear el plan de entrenamiento
      const newPlan = [];
      
      // Determinar series y descanso según objetivo
      let defaultSeries = 3;
      if (formData.fitnessObjective === 'muscleMass') defaultSeries = 4;
      if (formData.fitnessObjective === 'strength') defaultSeries = 5;
      
      const defaultRest = getRecommendedRest();
      
      // Generar ejercicios para cada sesión
      if (formData.prioritizacion === 'control') {
        // Modo control: repetir ejercicios cada semana durante 4 semanas
        const sessionsPerWeek = weeklyFrequency;
        const weeksPerCycle = 4; // Ciclo de 4 semanas
        const totalCycles = Math.ceil(totalSessions / (sessionsPerWeek * weeksPerCycle));
        
        // Generar ejercicios para el primer ciclo (4 semanas)
        for (let cycle = 0; cycle < totalCycles; cycle++) {
          // Generar ejercicios para la primera semana de cada ciclo
          for (let weekSession = 1; weekSession <= sessionsPerWeek; weekSession++) {
            let sessionPatterns = [...selectedPatterns];
            
            // Mezclar patrones para variedad (solo al inicio de cada ciclo)
            sessionPatterns.sort(() => Math.random() - 0.5);
            
            // Asegurarse de que hay suficientes patrones
            while (sessionPatterns.length < total) {
              sessionPatterns.push(sessionPatterns[Math.floor(Math.random() * sessionPatterns.length)]);
            }
            
            // Limitar a la cantidad necesaria
            sessionPatterns = sessionPatterns.slice(0, total);
            
            // Generar ejercicios para esta sesión
            const sessionExercises = [];
            for (let i = 0; i < total; i++) {
              const enfoque = i < multi ? 'Multiarticular' : 'Monoarticular';
              const pattern = sessionPatterns[i];
              
              // Obtener ejercicios disponibles para este patrón
              let availableExercises = getExercisesByMovementPattern(pattern);
              
              // Filtrar por equipamiento disponible
              availableExercises = availableExercises.filter(ex => {
                if (!ex.equipo) return true;
                if (typeof ex.equipo === 'string') {
                  return formData.equipment.includes(ex.equipo) || ex.equipo === 'Sin equipo';
                }
                if (Array.isArray(ex.equipo)) {
                  return ex.equipo.some(eq => formData.equipment.includes(eq)) || ex.equipo.includes('Sin equipo');
                }
                return false;
              });
              
              // Si no hay ejercicios disponibles, usar cualquier otro patrón
              if (availableExercises.length === 0) {
                for (const altPattern of selectedPatterns) {
                  availableExercises = getExercisesByMovementPattern(altPattern).filter(ex => {
                    if (!ex.equipo) return true;
                    if (typeof ex.equipo === 'string') {
                      return formData.equipment.includes(ex.equipo) || ex.equipo === 'Sin equipo';
                    }
                    if (Array.isArray(ex.equipo)) {
                      return ex.equipo.some(eq => formData.equipment.includes(eq)) || ex.equipo.includes('Sin equipo');
                    }
                    return false;
                  });
                  
                  if (availableExercises.length > 0) break;
                }
              }
              
              // Si aún no hay ejercicios, usar cualquiera
              if (availableExercises.length === 0) {
                availableExercises = allExercises.filter(ex => {
                  if (!ex.equipo) return true;
                  if (typeof ex.equipo === 'string') {
                    return formData.equipment.includes(ex.equipo) || ex.equipo === 'Sin equipo';
                  }
                  if (Array.isArray(ex.equipo)) {
                    return ex.equipo.some(eq => formData.equipment.includes(eq)) || ex.equipo.includes('Sin equipo');
                  }
                  return false;
                });
              }
              
              // Seleccionar un ejercicio aleatorio
              const selectedExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
              
              // Determinar método según objetivo
              let method = 'Standard';
              if (formData.fitnessObjective === 'muscleMass') {
                const methods = ['Standard', 'Superset', 'Drop Set', 'Rest-Pause'];
                method = 'Standard'; // Set default to Standard instead of random
              } else if (formData.fitnessObjective === 'strength') {
                const methods = ['Standard', 'Pyramid'];
                method = 'Standard'; // Set default to Standard instead of random
              } else { // conditioning
                const methods = ['AMRAP', 'EMOM', 'Tabata', 'Circuit'];
                method = 'Standard'; // Set default to Standard instead of random
              }
              
              // Crear el ejercicio base para esta posición en la semana
              const baseExercise = {
                exerciseNumber: i + 1,
                nombreEjercicio: selectedExercise?.nombre || "Ejercicio no disponible",
                seleccionMuscular: selectedExercise?.mainMuscle || pattern,
                patronMovimiento: pattern,
                equipmentUsed: selectedExercise?.equipo || "Sin equipo",
                enfoque: enfoque,
                series: defaultSeries,
                rest: defaultRest,
                metodo: method,
                preview: selectedExercise?.previewURL || "",
                exerciseId: selectedExercise?.id || ""
              };
              
              // Añadir este ejercicio a todas las semanas del ciclo
              for (let week = 0; week < weeksPerCycle; week++) {
                // Calcular el número de sesión global
                const sessionNumber = cycle * (sessionsPerWeek * weeksPerCycle) + week * sessionsPerWeek + weekSession;
                
                // Solo añadir si está dentro del rango total de sesiones
                if (sessionNumber <= totalSessions) {
                  sessionExercises.push({
                    ...baseExercise,
                    sessionNumber: sessionNumber
                  });
                }
              }
            }
            
            // Añadir ejercicios de la sesión al plan
            newPlan.push(...sessionExercises);
          }
        }
      } else {
        // Modo diversidad (código original)
        for (let session = 1; session <= totalSessions; session++) {
          let sessionPatterns = [...selectedPatterns];
          
          // Mezclar patrones para variedad
          sessionPatterns.sort(() => Math.random() - 0.5);
          
          // Asegurarse de que hay suficientes patrones
          while (sessionPatterns.length < total) {
            sessionPatterns.push(sessionPatterns[Math.floor(Math.random() * sessionPatterns.length)]);
          }
          
          // Limitar a la cantidad necesaria
          sessionPatterns = sessionPatterns.slice(0, total);
          
          // Asignar enfoque (multi o aislamiento) a cada patrón
          const sessionExercises = [];
          for (let i = 0; i < total; i++) {
            const enfoque = i < multi ? 'Multiarticular' : 'Monoarticular';
            const pattern = sessionPatterns[i];
            
            // Obtener ejercicios disponibles para este patrón
            let availableExercises = getExercisesByMovementPattern(pattern);
            
            // Filtrar por equipamiento disponible
            availableExercises = availableExercises.filter(ex => {
              if (!ex.equipo) return true;
              if (typeof ex.equipo === 'string') {
                return formData.equipment.includes(ex.equipo) || ex.equipo === 'Sin equipo';
              }
              if (Array.isArray(ex.equipo)) {
                return ex.equipo.some(eq => formData.equipment.includes(eq)) || ex.equipo.includes('Sin equipo');
              }
              return false;
            });
            
            // Si no hay ejercicios disponibles, usar cualquier otro patrón
            if (availableExercises.length === 0) {
              for (const altPattern of selectedPatterns) {
                availableExercises = getExercisesByMovementPattern(altPattern).filter(ex => {
                  if (!ex.equipo) return true;
                  if (typeof ex.equipo === 'string') {
                    return formData.equipment.includes(ex.equipo) || ex.equipo === 'Sin equipo';
                  }
                  if (Array.isArray(ex.equipo)) {
                    return ex.equipo.some(eq => formData.equipment.includes(eq)) || ex.equipo.includes('Sin equipo');
                  }
                  return false;
                });
                
                if (availableExercises.length > 0) break;
              }
            }
            
            // Si aún no hay ejercicios, usar cualquiera
            if (availableExercises.length === 0) {
              availableExercises = allExercises.filter(ex => {
                if (!ex.equipo) return true;
                if (typeof ex.equipo === 'string') {
                  return formData.equipment.includes(ex.equipo) || ex.equipo === 'Sin equipo';
                }
                if (Array.isArray(ex.equipo)) {
                  return ex.equipo.some(eq => formData.equipment.includes(eq)) || ex.equipo.includes('Sin equipo');
                }
                return false;
              });
            }
            
            // Seleccionar un ejercicio aleatorio
            const selectedExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
            
            // Determinar método según objetivo
            let method = 'Standard';
            if (formData.fitnessObjective === 'muscleMass') {
              const methods = ['Standard', 'Superset', 'Drop Set', 'Rest-Pause'];
              method = 'Standard'; // Set default to Standard instead of random
            } else if (formData.fitnessObjective === 'strength') {
              const methods = ['Standard', 'Pyramid'];
              method = 'Standard'; // Set default to Standard instead of random
            } else { // conditioning
              const methods = ['AMRAP', 'EMOM', 'Tabata', 'Circuit'];
              method = 'Standard'; // Set default to Standard instead of random
            }
            
            // Añadir ejercicio al plan
            sessionExercises.push({
              sessionNumber: session,
              exerciseNumber: i + 1,
              nombreEjercicio: selectedExercise?.nombre || "Ejercicio no disponible",
              seleccionMuscular: selectedExercise?.mainMuscle || pattern,
              patronMovimiento: pattern,
              equipmentUsed: selectedExercise?.equipo || "Sin equipo",
              enfoque: enfoque,
              series: defaultSeries,
              rest: defaultRest,
              metodo: method,
              preview: selectedExercise?.previewURL || "",
              exerciseId: selectedExercise?.id || ""
            });
          }
          
          // Añadir ejercicios de la sesión al plan
          newPlan.push(...sessionExercises);
        }
      }
      
      // Ordenar el plan por número de sesión
      newPlan.sort((a, b) => a.sessionNumber - b.sessionNumber || a.exerciseNumber - b.exerciseNumber);
      
      setFormData(prev => ({
        ...prev,
        trainingPlan: newPlan
      }));
      
      setMessage("Plan generado exitosamente");
    } catch (error) {
      console.error("Error al generar el plan:", error);
      setError("Ocurrió un error al generar el plan. Por favor intenta de nuevo.");
    } finally {
      setGeneratingPlan(false);
    }
  };
  
  // Handlers para modificar ejercicios
  const handleExerciseChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    const currentExercise = newPlan[index];
    newPlan[index].enfoque = value;
    
    if (formData.prioritizacion === 'control') {
      const sessionNumber = currentExercise.sessionNumber;
      const exerciseNumber = currentExercise.exerciseNumber;
      const weeklyFrequency = parseInt(formData.frequency, 10);
      
      newPlan.forEach((ex, i) => {
        if (i !== index &&
            ex.exerciseNumber === exerciseNumber &&
            (ex.sessionNumber - sessionNumber) % weeklyFrequency === 0 &&
            ex.sessionNumber > sessionNumber) {
          ex.enfoque = value;
        }
      });
    }
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  const handlePatternMovementChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    const currentExercise = newPlan[index];
    newPlan[index].patronMovimiento = value;
    
    if (formData.prioritizacion === 'control') {
      const sessionNumber = currentExercise.sessionNumber;
      const exerciseNumber = currentExercise.exerciseNumber;
      const weeklyFrequency = parseInt(formData.frequency, 10);
      
      newPlan.forEach((ex, i) => {
        if (i !== index &&
            ex.exerciseNumber === exerciseNumber &&
            (ex.sessionNumber - sessionNumber) % weeklyFrequency === 0 &&
            ex.sessionNumber > sessionNumber) {
          ex.patronMovimiento = value;
        }
      });
    }
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  const handleSeriesChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    const currentExercise = newPlan[index];
    newPlan[index].series = value;
    
    if (formData.prioritizacion === 'control') {
      const sessionNumber = currentExercise.sessionNumber;
      const exerciseNumber = currentExercise.exerciseNumber;
      const weeklyFrequency = parseInt(formData.frequency, 10);
      
      newPlan.forEach((ex, i) => {
        if (i !== index &&
            ex.exerciseNumber === exerciseNumber &&
            (ex.sessionNumber - sessionNumber) % weeklyFrequency === 0 &&
            ex.sessionNumber > sessionNumber) {
          ex.series = value;
        }
      });
    }
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  const handleRestChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    const currentExercise = newPlan[index];
    newPlan[index].rest = value;
    
    if (formData.prioritizacion === 'control') {
      const sessionNumber = currentExercise.sessionNumber;
      const exerciseNumber = currentExercise.exerciseNumber;
      const weeklyFrequency = parseInt(formData.frequency, 10);
      
      newPlan.forEach((ex, i) => {
        if (i !== index &&
            ex.exerciseNumber === exerciseNumber &&
            (ex.sessionNumber - sessionNumber) % weeklyFrequency === 0 &&
            ex.sessionNumber > sessionNumber) {
          ex.rest = value;
        }
      });
    }
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };

  const handleExerciseNameChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    const currentExercise = newPlan[index];
    newPlan[index].nombreEjercicio = value;
    
    if (formData.prioritizacion === 'control') {
      const sessionNumber = currentExercise.sessionNumber;
      const exerciseNumber = currentExercise.exerciseNumber;
      const weeklyFrequency = parseInt(formData.frequency, 10);
      
      newPlan.forEach((ex, i) => {
        if (i !== index &&
            ex.exerciseNumber === exerciseNumber &&
            (ex.sessionNumber - sessionNumber) % weeklyFrequency === 0 &&
            ex.sessionNumber > sessionNumber) {
          ex.nombreEjercicio = value;
        }
      });
    }
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };

  const handleMuscleGroupChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    const currentExercise = newPlan[index];
    newPlan[index].seleccionMuscular = value;
    
    if (formData.prioritizacion === 'control') {
      const sessionNumber = currentExercise.sessionNumber;
      const exerciseNumber = currentExercise.exerciseNumber;
      const weeklyFrequency = parseInt(formData.frequency, 10);
      
      newPlan.forEach((ex, i) => {
        if (i !== index &&
            ex.exerciseNumber === exerciseNumber &&
            (ex.sessionNumber - sessionNumber) % weeklyFrequency === 0 &&
            ex.sessionNumber > sessionNumber) {
          ex.seleccionMuscular = value;
        }
      });
    }
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };

  const handleMethodChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    const currentExercise = newPlan[index];
    newPlan[index].metodo = value;
    
    if (formData.prioritizacion === 'control') {
      const sessionNumber = currentExercise.sessionNumber;
      const exerciseNumber = currentExercise.exerciseNumber;
      const weeklyFrequency = parseInt(formData.frequency, 10);
      
      newPlan.forEach((ex, i) => {
        if (i !== index &&
            ex.exerciseNumber === exerciseNumber &&
            (ex.sessionNumber - sessionNumber) % weeklyFrequency === 0 &&
            ex.sessionNumber > sessionNumber) {
          ex.metodo = value;
        }
      });
    }
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  // Función para seleccionar un ejercicio alternativo
  const handleSelectExerciseOption = (exercise, index) => {
    const newPlan = [...formData.trainingPlan];
    const currentExercise = newPlan[index];
    
    newPlan[index].nombreEjercicio = exercise.nombre || "";
    newPlan[index].preview = exercise.previewURL || "";
    newPlan[index].equipmentUsed = exercise.equipo || "Sin equipo";
    newPlan[index].exerciseId = exercise.id;
    
    if (formData.prioritizacion === 'control') {
      const sessionNumber = currentExercise.sessionNumber;
      const exerciseNumber = currentExercise.exerciseNumber;
      const weeklyFrequency = parseInt(formData.frequency, 10);
      
      newPlan.forEach((ex, i) => {
        if (i !== index &&
            ex.exerciseNumber === exerciseNumber &&
            (ex.sessionNumber - sessionNumber) % weeklyFrequency === 0 &&
            ex.sessionNumber > sessionNumber) {
          ex.nombreEjercicio = exercise.nombre || "";
          ex.preview = exercise.previewURL || "";
          ex.equipmentUsed = exercise.equipo || "Sin equipo";
          ex.exerciseId = exercise.id;
        }
      });
    }
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  // Guardar plan en Firebase
  const savePlan = async () => {
    try {
      if (!formData.planName.trim()) {
        setError("Por favor, ingresa un nombre para el plan");
        return;
      }
      
      if (formData.trainingPlan.length === 0) {
        setError("No hay un plan para guardar. Por favor genera uno primero.");
        return;
      }
      
      setError('');
      setMessage('');
      
      const planData = {
        userId: currentUser.uid,
        name: formData.planName,
        fitnessObjective: formData.fitnessObjective,
        duration: formData.duration,
        frequency: formData.frequency,
        timeAvailable: formData.timeAvailable,
        muscleSelection: formData.muscleSelection,
        customMuscles: formData.customMuscles,
        equipment: formData.equipment,
        prioritizacion: formData.prioritizacion,
        trainingPlan: formData.trainingPlan,
        createdAt: new Date()
      };
      
      await addDoc(collection(db, "trainingPlans"), planData);
      setMessage("Plan guardado exitosamente");
    } catch (error) {
      console.error("Error al guardar el plan:", error);
      setError("Ocurrió un error al guardar el plan. Por favor intenta de nuevo.");
    }
  };
  
  // Agrupar ejercicios por sesión para mostrarlos
  const groupExercisesBySession = () => {
    const sessions = {};
    formData.trainingPlan.forEach(exercise => {
      const sessionKey = `Sesión ${exercise.sessionNumber}`;
      if (!sessions[sessionKey]) {
        sessions[sessionKey] = [];
      }
      sessions[sessionKey].push(exercise);
    });
    return sessions;
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Diseñador de Plan de Entrenamiento
      </Typography>
      
      <TrainingPlanForm
        formData={formData}
        handleChange={handleChange}
        handleCustomMuscleChange={handleCustomMuscleChange}
        handleEquipmentChange={handleEquipmentChange}
        selectAllEquipment={selectAllEquipment}
        generatePlan={generatePlan}
        savePlan={savePlan}
        generatingPlan={generatingPlan}
        muscleOptions={muscleOptions}
        customMuscleOptions={customMuscleOptions}
        equipmentOptions={equipmentOptions}
      />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      
      <TrainingPlanDisplay
        formData={formData}
        groupExercisesBySession={groupExercisesBySession}
        handleExerciseChange={handleExerciseChange}
        handlePatternMovementChange={handlePatternMovementChange}
        handleMethodChange={handleMethodChange}
        handleSeriesChange={handleSeriesChange}
        handleRestChange={handleRestChange}
        handlePopoverOpen={handlePopoverOpen}
        handleAlternativesOpen={handleAlternativesOpen}
        open={open}
        anchorEl={anchorEl}
        handlePopoverClose={handlePopoverClose}
        popoverExercise={popoverExercise}
        alternativesAnchorEl={alternativesAnchorEl}
        handleAlternativesClose={handleAlternativesClose}
        alternativeExercises={alternativeExercises}
        handleSelectAlternative={handleSelectAlternative}
        enfoqueOptions={enfoqueOptions}
        allMovementPatterns={allMovementPatterns}
        methodOptions={methodOptions}
      />
    </Container>
  );
};

export default TrainingPlanDesigner;