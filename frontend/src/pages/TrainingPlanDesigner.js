import React, { useState, useEffect } from 'react';
import { Container, Typography, Alert } from '@mui/material';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import TrainingPlanForm from '../components/TrainingDesigner/TrainingPlanForm';
import TrainingPlanDisplay from '../components/TrainingDesigner/TrainingPlanDisplay';

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
    duration: '1',
    frequency: '3',
    timeAvailable: '60',
    muscleSelection: 'Cuerpo completo',
    customMuscles: [],
    equipment: [],
    planName: '',
    trainingPlan: [],
    trainingDays: [] // Add this to initialize the trainingDays array
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
  
  // Añadir esta nueva función para manejar los cambios en las características de los días
  const handleDayCharacteristicChange = (event, dayIndex, characteristic) => {
    const checked = event.target.checked;
    
    setFormData(prevData => {
      const updatedTrainingDays = [...(prevData.trainingDays || [])];
      
      // Inicializar el día si no existe
      if (!updatedTrainingDays[dayIndex]) {
        updatedTrainingDays[dayIndex] = { characteristics: [] };
      }
      
      // Inicializar el array de características si no existe
      if (!updatedTrainingDays[dayIndex].characteristics) {
        updatedTrainingDays[dayIndex].characteristics = [];
      }
      
      // Añadir o eliminar la característica
      if (checked) {
        if (!updatedTrainingDays[dayIndex].characteristics.includes(characteristic)) {
          updatedTrainingDays[dayIndex].characteristics.push(characteristic);
        }
      } else {
        updatedTrainingDays[dayIndex].characteristics = updatedTrainingDays[dayIndex].characteristics.filter(
          c => c !== characteristic
        );
      }
      
      return {
        ...prevData,
        trainingDays: updatedTrainingDays
      };
    });
  };
  
  // Añadir esta función para actualizar el orden de los días
  const handleUpdateTrainingDays = (updatedDays) => {
    setFormData(prev => ({
      ...prev,
      trainingDays: updatedDays
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
  
  // Añadir estados para el filtro de equipo
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [filteredAlternatives, setFilteredAlternatives] = useState([]);
  
  const handleAlternativesOpen = (event, exercise, index) => {
    setAlternativesAnchorEl(event.currentTarget);
    setSelectedExerciseIndex(index);
    
    // Filtrar ejercicios alternativos con el mismo patrón de movimiento
    const alternatives = allExercises.filter(ex => 
      ex.movementCategory === exercise.patronMovimiento && 
      ex.id !== exercise.exerciseId
    );
    
    setAlternativeExercises(alternatives);
    setFilteredAlternatives(alternatives); // Inicialmente mostrar todos
    setEquipmentFilter(''); // Resetear filtro
  };
  
  const handleEquipmentFilterChange = (e) => {
    const value = e.target.value;
    setEquipmentFilter(value);
    
    if (value) {
      setFilteredAlternatives(alternativeExercises.filter(ex => 
        ex.equipo === value
      ));
    } else {
      setFilteredAlternatives(alternativeExercises);
    }
  };
  
  // Eliminar la redeclaración de handleSelectExerciseOption y reemplazar la implementación existente
  // con esta versión mejorada que actualiza ejercicios en modo control
  // ...
  // Keep the first implementation (around line 228) which has the enhanced functionality
  const handleSelectExerciseOption = (exercise, index) => {
    const newPlan = [...formData.trainingPlan];
    const currentExercise = newPlan[index];
    
    // Actualizar el ejercicio seleccionado
    newPlan[index].nombreEjercicio = exercise.nombre || "";
    newPlan[index].preview = exercise.previewURL || "";
    newPlan[index].equipmentUsed = exercise.equipo || "Sin equipo";
    newPlan[index].exerciseId = exercise.id;
    
    // Si estamos en modo control, actualizar todos los ejercicios relacionados
    if (formData.prioritizacion === 'control') {
      const sessionNumber = currentExercise.sessionNumber;
      const exerciseNumber = currentExercise.exerciseNumber;
      const weeklyFrequency = parseInt(formData.frequency, 10);
      
      // Buscar todos los ejercicios con el mismo número de ejercicio en las sesiones correspondientes
      newPlan.forEach((ex, idx) => {
        // Si es el mismo ejercicio en otra semana (mismo día de la semana)
        if (idx !== index && 
            ex.exerciseNumber === exerciseNumber && 
            (ex.sessionNumber - sessionNumber) % weeklyFrequency === 0) {
          
          newPlan[idx].nombreEjercicio = exercise.nombre || "";
          newPlan[idx].preview = exercise.previewURL || "";
          newPlan[idx].equipmentUsed = exercise.equipo || "Sin equipo";
          newPlan[idx].exerciseId = exercise.id;
        }
      });
    }
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };

  const handleAlternativesClose = () => {
    setAlternativesAnchorEl(null);
    setSelectedExerciseIndex(null);
  };
  
  const handleSelectAlternative = (exercise) => {
    handleSelectExerciseOption(exercise, selectedExerciseIndex);
    handleAlternativesClose();
  };
  
  // Función para generar el plan
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
      
      // Verificar que se hayan configurado los días de entrenamiento
      if (!formData.trainingDays || formData.trainingDays.length === 0) {
        setError("Por favor, configura las características de los días de entrenamiento");
        setGeneratingPlan(false);
        return;
      }
      
      // Mapeo de características a patrones de movimiento
      const characteristicToPatterns = {
        'push': ['Horizontal Push', 'Upward Push'],
        'pull': ['Horizontal Pull', 'Upward Pull', 'Downward Pull'],
        'legs': ['Double Leg Push', 'Single Leg Push', 'Bent Leg Hip Extension', 'Straight Leg Hip Extension'],
        'upper': ['Horizontal Push', 'Upward Push', 'Horizontal Pull', 'Upward Pull', 'Downward Pull', 'Auxiliary'],
        'lower': ['Double Leg Push', 'Single Leg Push', 'Bent Leg Hip Extension', 'Straight Leg Hip Extension'],
        'fullBody': allMovementPatterns,
        'hipDominant': ['Bent Leg Hip Extension', 'Straight Leg Hip Extension'],
        'kneeDominant': ['Double Leg Push', 'Single Leg Push'],
        'core': ['Core Stability'],
        'explosive': ['Explosive'],
        'mobility': ['Mobility'],
        'cardio': ['Cardio'],
        'auxiliary': ['Auxiliary']
      };
      
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
      const defaultSeries = formData.fitnessObjective === 'strength' ? 5 : 
                           formData.fitnessObjective === 'muscleMass' ? 4 : 3;
      
      const defaultRest = getRecommendedRest();
      
      // Generar ejercicios para cada sesión
      if (formData.prioritizacion === 'control') {
        // Modo control: mismos ejercicios cada semana
        const sessionsPerWeek = weeklyFrequency;
        const weeksPerCycle = 4; // Ciclo de 4 semanas
        
        // Generar ejercicios para la primera semana
        for (let weekSession = 1; weekSession <= sessionsPerWeek; weekSession++) {
          // Obtener las características del día actual
          const dayIndex = (weekSession - 1) % formData.trainingDays.length;
          const dayCharacteristics = formData.trainingDays[dayIndex]?.characteristics || [];
          
          if (dayCharacteristics.length === 0) {
            continue; // Saltar días sin características
          }
          
          // Obtener patrones de movimiento basados en las características del día
          let dayPatterns = [];
          dayCharacteristics.forEach(characteristic => {
            if (characteristicToPatterns[characteristic]) {
              dayPatterns = [...dayPatterns, ...characteristicToPatterns[characteristic]];
            }
          });
          
          // Eliminar duplicados
          dayPatterns = [...new Set(dayPatterns)];
          
          // Si no hay patrones, usar todos los patrones disponibles
          if (dayPatterns.length === 0) {
            dayPatterns = [...allMovementPatterns];
          }
          
          // Mezclar patrones para variedad
          const shuffledPatterns = [...dayPatterns].sort(() => Math.random() - 0.5);
          
          // Asegurarse de que hay suficientes patrones
          while (shuffledPatterns.length < total) {
            shuffledPatterns.push(shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)]);
          }
          
          // Distribuir ejercicios equitativamente entre las características
          const exercisesPerCharacteristic = Math.floor(total / dayCharacteristics.length);
          let remainingExercises = total % dayCharacteristics.length;
          
          let sessionPatterns = [];
          
          // Distribuir ejercicios por característica
          for (const characteristic of dayCharacteristics) {
            const patterns = characteristicToPatterns[characteristic] || [];
            if (patterns.length > 0) {
              const shuffledCharPatterns = [...patterns].sort(() => Math.random() - 0.5);
              const exercisesToAdd = exercisesPerCharacteristic + (remainingExercises > 0 ? 1 : 0);
              
              // Asegurarse de que hay suficientes patrones para esta característica
              let characteristicPatterns = [];
              while (characteristicPatterns.length < exercisesToAdd) {
                characteristicPatterns = [
                  ...characteristicPatterns,
                  ...shuffledCharPatterns.slice(0, Math.min(exercisesToAdd - characteristicPatterns.length, shuffledCharPatterns.length))
                ];
              }
              
              sessionPatterns = [...sessionPatterns, ...characteristicPatterns.slice(0, exercisesToAdd)];
              
              if (remainingExercises > 0) {
                remainingExercises--;
              }
            }
          }
          
          // Si no se pudieron distribuir todos los ejercicios, completar con patrones aleatorios
          while (sessionPatterns.length < total) {
            sessionPatterns.push(shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)]);
          }
          
          // Limitar a la cantidad necesaria
          sessionPatterns = sessionPatterns.slice(0, total);
          
          // Generar ejercicios para cada patrón
          for (let i = 0; i < sessionPatterns.length; i++) {
            const pattern = sessionPatterns[i];
            const isMulti = i < multi;
            
            // Buscar ejercicios disponibles para este patrón
            const availableExercises = getExercisesByMovementPattern(pattern);
            let selectedExercise = null;
            
            if (availableExercises.length > 0) {
              // Seleccionar un ejercicio aleatorio
              selectedExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
            }
            
            // Crear ejercicio base para este patrón
            const baseExercise = {
              sessionNumber: weekSession,
              exerciseNumber: i + 1,
              patronMovimiento: pattern,
              nombreEjercicio: selectedExercise ? selectedExercise.nombre : `Ejercicio para ${pattern}`,
              seleccionMuscular: formData.muscleSelection,
              series: defaultSeries,
              rest: defaultRest,
              metodo: 'Standard',
              equipmentUsed: selectedExercise ? selectedExercise.equipo : 'Peso Corporal',
              preview: selectedExercise ? selectedExercise.previewURL : '',
              exerciseId: selectedExercise ? selectedExercise.id : '',
              dayCharacteristics: dayCharacteristics // Guardar las características del día
            };
            
            // Añadir este ejercicio para todas las semanas del plan
            for (let session = weekSession; session <= totalSessions; session += sessionsPerWeek) {
              newPlan.push({
                ...baseExercise,
                sessionNumber: session
              });
            }
          }
        }
      } else {
        // Modo diversidad: ejercicios diferentes cada semana
        for (let session = 1; session <= totalSessions; session++) {
          // Obtener las características del día actual
          const weekSession = ((session - 1) % weeklyFrequency) + 1;
          const dayIndex = (weekSession - 1) % formData.trainingDays.length;
          const dayCharacteristics = formData.trainingDays[dayIndex]?.characteristics || [];
          
          if (dayCharacteristics.length === 0) {
            continue; // Saltar días sin características
          }
          
          // Obtener patrones de movimiento basados en las características del día
          let dayPatterns = [];
          dayCharacteristics.forEach(characteristic => {
            if (characteristicToPatterns[characteristic]) {
              dayPatterns = [...dayPatterns, ...characteristicToPatterns[characteristic]];
            }
          });
          
          // Eliminar duplicados
          dayPatterns = [...new Set(dayPatterns)];
          
          // Si no hay patrones, usar todos los patrones disponibles
          if (dayPatterns.length === 0) {
            dayPatterns = [...allMovementPatterns];
          }
          
          // Mezclar patrones para variedad
          const shuffledPatterns = [...dayPatterns].sort(() => Math.random() - 0.5);
          
          // Asegurarse de que hay suficientes patrones
          while (shuffledPatterns.length < total) {
            shuffledPatterns.push(shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)]);
          }
          
          // Distribuir ejercicios equitativamente entre las características
          const exercisesPerCharacteristic = Math.floor(total / dayCharacteristics.length);
          let remainingExercises = total % dayCharacteristics.length;
          
          let sessionPatterns = [];
          
          // Distribuir ejercicios por característica
          for (const characteristic of dayCharacteristics) {
            const patterns = characteristicToPatterns[characteristic] || [];
            if (patterns.length > 0) {
              const shuffledCharPatterns = [...patterns].sort(() => Math.random() - 0.5);
              const exercisesToAdd = exercisesPerCharacteristic + (remainingExercises > 0 ? 1 : 0);
              
              // Asegurarse de que hay suficientes patrones para esta característica
              let characteristicPatterns = [];
              while (characteristicPatterns.length < exercisesToAdd) {
                characteristicPatterns = [
                  ...characteristicPatterns,
                  ...shuffledCharPatterns.slice(0, Math.min(exercisesToAdd - characteristicPatterns.length, shuffledCharPatterns.length))
                ];
              }
              
              sessionPatterns = [...sessionPatterns, ...characteristicPatterns.slice(0, exercisesToAdd)];
              
              if (remainingExercises > 0) {
                remainingExercises--;
              }
            }
          }
          
          // Si no se pudieron distribuir todos los ejercicios, completar con patrones aleatorios
          while (sessionPatterns.length < total) {
            sessionPatterns.push(shuffledPatterns[Math.floor(Math.random() * shuffledPatterns.length)]);
          }
          
          // Limitar a la cantidad necesaria
          sessionPatterns = sessionPatterns.slice(0, total);
          
          // Generar ejercicios para cada patrón
          for (let i = 0; i < sessionPatterns.length; i++) {
            const pattern = sessionPatterns[i];
            
            // Buscar ejercicios disponibles para este patrón
            const availableExercises = getExercisesByMovementPattern(pattern);
            let selectedExercise = null;
            
            if (availableExercises.length > 0) {
              // Seleccionar un ejercicio aleatorio
              selectedExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
            }
            
            newPlan.push({
              sessionNumber: session,
              exerciseNumber: i + 1,
              patronMovimiento: pattern,
              nombreEjercicio: selectedExercise ? selectedExercise.nombre : `Ejercicio para ${pattern}`,
              seleccionMuscular: formData.muscleSelection,
              series: defaultSeries,
              rest: defaultRest,
              metodo: 'Standard',
              equipmentUsed: selectedExercise ? selectedExercise.equipo : 'Peso Corporal',
              preview: selectedExercise ? selectedExercise.previewURL : '',
              exerciseId: selectedExercise ? selectedExercise.id : '',
              dayCharacteristics: dayCharacteristics // Guardar las características del día
            });
          }
        }
      }
      
      // Actualizar el plan de entrenamiento
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
  
  // Función para guardar el plan de entrenamiento
  const savePlan = async () => {
    try {
      if (!currentUser) {
        setError("Debes iniciar sesión para guardar un plan");
        return;
      }
      
      if (formData.trainingPlan.length === 0) {
        setError("Primero debes generar un plan de entrenamiento");
        return;
      }
      
      if (!formData.planName.trim()) {
        setError("Por favor, asigna un nombre al plan");
        return;
      }
      
      setError('');
      setMessage('Guardando plan...');
      
      // Crear objeto del plan para guardar
      const planToSave = {
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
        createdAt: new Date().toISOString()
      };
      
      // Guardar en Firestore
      const plansCollection = collection(db, "trainingPlans");
      await addDoc(plansCollection, planToSave);
      
      setMessage("Plan guardado exitosamente");
    } catch (error) {
      console.error("Error al guardar el plan:", error);
      setError("Ocurrió un error al guardar el plan. Por favor intenta de nuevo.");
    }
  };
  
  // Handlers para editar ejercicios
  const handleExerciseChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    newPlan[index].enfoque = value;
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  const handlePatternMovementChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    newPlan[index].patronMovimiento = value;
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  const handleMethodChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    newPlan[index].metodo = value;
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  const handleSeriesChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    newPlan[index].series = value;
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  const handleRestChange = (e, index) => {
    const { value } = e.target;
    const newPlan = [...formData.trainingPlan];
    newPlan[index].rest = value;
    
    setFormData(prev => ({
      ...prev,
      trainingPlan: newPlan
    }));
  };
  
  // Delete this second declaration of handleSelectExerciseOption
  // const handleSelectExerciseOption = (exercise, index) => {
  //   const newPlan = [...formData.trainingPlan];
  //   
  //   newPlan[index].nombreEjercicio = exercise.nombre || "";
  //   newPlan[index].preview = exercise.previewURL || "";
  //   newPlan[index].equipmentUsed = exercise.equipo || "Sin equipo";
  //   newPlan[index].exerciseId = exercise.id;
  //   
  //   setFormData(prev => ({
  //     ...prev,
  //     trainingPlan: newPlan
  //   }));
  // };
  
  // Función para agrupar ejercicios por sesión
  const groupExercisesBySession = () => {
    const sessions = {};
    
    formData.trainingPlan.forEach(exercise => {
      const sessionKey = `Sesión ${exercise.sessionNumber}`;
      
      if (!sessions[sessionKey]) {
        sessions[sessionKey] = [];
      }
      
      sessions[sessionKey].push(exercise);
    });
    
    // Ordenar ejercicios dentro de cada sesión por número de ejercicio
    Object.keys(sessions).forEach(sessionKey => {
      sessions[sessionKey].sort((a, b) => a.exerciseNumber - b.exerciseNumber);
    });
    
    // Devolver las sesiones ordenadas por número de sesión
    const orderedSessions = {};
    Object.keys(sessions)
      .sort((a, b) => {
        // Extraer el número de sesión y comparar numéricamente
        const numA = parseInt(a.replace('Sesión ', ''), 10);
        const numB = parseInt(b.replace('Sesión ', ''), 10);
        return numA - numB;
      })
      .forEach(key => {
        orderedSessions[key] = sessions[key];
      });
    
    return orderedSessions;
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Diseñador de Planes de Entrenamiento
      </Typography>
      
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
        handleDayCharacteristicChange={handleDayCharacteristicChange}
        handleUpdateTrainingDays={handleUpdateTrainingDays}
      />
      
      {formData.trainingPlan.length > 0 && (
        <TrainingPlanDisplay 
          formData={formData}
          groupExercisesBySession={groupExercisesBySession}
          // Seguimos pasando handleExerciseChange aunque esté vacía para evitar errores
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
          // Seguimos pasando enfoqueOptions aunque no se use para evitar errores
          enfoqueOptions={enfoqueOptions}
          allMovementPatterns={allMovementPatterns}
          methodOptions={methodOptions}
          equipmentFilter={equipmentFilter}
          handleEquipmentFilterChange={handleEquipmentFilterChange}
          filteredAlternatives={filteredAlternatives}
          equipmentOptions={equipmentOptions}
        />
      )}
    </Container>
  );
};

export default TrainingPlanDesigner;