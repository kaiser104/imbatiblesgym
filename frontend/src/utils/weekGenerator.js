import { collection, getDocs } from 'firebase/firestore';

/**
 * Genera una nueva semana de entrenamiento basada en los parámetros del plan actual
 * @param {Object} formData - Datos del formulario actual
 * @param {Array} allExercises - Lista de todos los ejercicios disponibles
 * @param {Object} dayCharacteristicToMovementPatterns - Mapeo de características a patrones de movimiento
 * @param {Object} movementPatternMapping - Mapeo de grupos musculares a patrones de movimiento
 * @param {Array} allMovementPatterns - Lista de todos los patrones de movimiento
 * @param {Function} groupExercisesBySession - Función para agrupar ejercicios por sesión
 * @returns {Array} - Lista de nuevos ejercicios para la semana adicional
 */
export const generateAdditionalWeek = (
  formData, 
  allExercises, 
  dayCharacteristicToMovementPatterns, 
  movementPatternMapping, 
  allMovementPatterns,
  groupExercisesBySession
) => {
  // Obtener el número de sesiones por semana
  const sessionsPerWeek = parseInt(formData.frequency, 10);
  
  // Calcular el número actual de semanas
  const currentSessions = formData.trainingPlan.length;
  const currentWeeks = Math.ceil(currentSessions / sessionsPerWeek);
  
  // Crear un array para almacenar los nuevos ejercicios
  let newExercises = [];
  
  if (formData.prioritizacion === 'control') {
    // Para Control: Copiar exactamente los ejercicios de la primera semana
    console.log("Modo Control: Copiando ejercicios de la primera semana");
    
    // Agrupar ejercicios por sesión
    const sessionGroups = groupExercisesBySession();
    const firstWeekSessions = Object.keys(sessionGroups)
      .filter(key => parseInt(key.replace('Sesión ', ''), 10) <= sessionsPerWeek)
      .map(key => sessionGroups[key]);
    
    // Para cada sesión de la primera semana
    firstWeekSessions.forEach((sessionExercises, sessionIndex) => {
      // Calcular el nuevo número de sesión
      const newSessionNumber = (currentWeeks * sessionsPerWeek) + sessionIndex + 1;
      
      // Copiar cada ejercicio de la sesión
      sessionExercises.forEach(exercise => {
        newExercises.push({
          ...exercise,
          sessionNumber: newSessionNumber
        });
      });
    });
  } else {
    // Para Diversidad: Generar nuevos ejercicios siguiendo los mismos parámetros
    console.log("Modo Diversidad: Generando nuevos ejercicios");
    
    // Obtener todos los ejercicios ya utilizados para evitar repeticiones
    const usedExerciseIds = new Set();
    formData.trainingPlan.forEach(exercise => {
      usedExerciseIds.add(exercise.exerciseId);
    });
    
    // Determinar qué músculos trabajar en cada sesión
    let muscleGroups = [];
    let sessionCharacteristics = [];
    
    // Verificar si tenemos días configurados en el constructor de días
    if (formData.trainingDays && formData.trainingDays.length > 0) {
      // Usar las características de los días configurados
      for (let i = 0; i < sessionsPerWeek; i++) {
        const dayIndex = i % formData.trainingDays.length;
        const dayCharacteristics = formData.trainingDays[dayIndex]?.characteristics || [];
        
        // Guardar las características del día para usar en la generación de ejercicios
        sessionCharacteristics[i] = dayCharacteristics;
        
        // Si el día tiene características, usar la primera como grupo muscular principal
        if (dayCharacteristics.length > 0) {
          // Mapear la característica a un grupo muscular para compatibilidad
          const mainCharacteristic = dayCharacteristics[0];
          let muscleGroup;
          
          // Mapeo de características a grupos musculares
          switch (mainCharacteristic) {
            case 'push': muscleGroup = 'Empuje'; break;
            case 'pull': muscleGroup = 'Tirón'; break;
            case 'legs': muscleGroup = 'Piernas'; break;
            case 'upper': muscleGroup = 'Superior'; break;
            case 'lower': muscleGroup = 'Inferior'; break;
            case 'fullBody': muscleGroup = 'Cuerpo completo'; break;
            case 'hipDominant': muscleGroup = 'Inferior'; break;
            case 'kneeDominant': muscleGroup = 'Inferior'; break;
            case 'core': muscleGroup = 'Core'; break;
            default: muscleGroup = 'Cuerpo completo';
          }
          
          muscleGroups.push(muscleGroup);
        } else {
          // Si no tiene características, usar la selección general
          if (formData.muscleSelection === 'Personalizado') {
            muscleGroups.push(formData.customMuscles[i % formData.customMuscles.length]);
          } else {
            // Usar la selección predefinida
            switch (formData.muscleSelection) {
              case 'Superior, Inferior, Cuerpo completo':
                muscleGroups.push(['Superior', 'Inferior', 'Cuerpo completo'][i % 3]);
                break;
              case 'Pecho, Espalda, Piernas, Hombros, Brazos':
                muscleGroups.push(['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos'][i % 5]);
                break;
              case 'Pecho, Espalda, Piernas':
                muscleGroups.push(['Pecho', 'Espalda', 'Piernas'][i % 3]);
                break;
              case 'Empuje, Tirón, Piernas':
                muscleGroups.push(['Empuje', 'Tirón', 'Piernas'][i % 3]);
                break;
              default:
                muscleGroups.push('Cuerpo completo');
            }
          }
        }
      }
    } else {
      // Si no hay días configurados, usar la lógica original
      if (formData.muscleSelection === 'Personalizado') {
        muscleGroups = [...formData.customMuscles];
      } else {
        // Usar la selección predefinida
        switch (formData.muscleSelection) {
          case 'Superior, Inferior, Cuerpo completo':
            muscleGroups = ['Superior', 'Inferior', 'Cuerpo completo'];
            break;
          case 'Pecho, Espalda, Piernas, Hombros, Brazos':
            muscleGroups = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos'];
            break;
          case 'Pecho, Espalda, Piernas':
            muscleGroups = ['Pecho', 'Espalda', 'Piernas'];
            break;
          case 'Empuje, Tirón, Piernas':
            muscleGroups = ['Empuje', 'Tirón', 'Piernas'];
            break;
          default:
            muscleGroups = ['Cuerpo completo'];
        }
      }
      
      // Asegurarse de que hay suficientes grupos musculares para las sesiones
      while (muscleGroups.length < sessionsPerWeek) {
        muscleGroups = [...muscleGroups, ...muscleGroups];
      }
      
      // Tomar solo los grupos necesarios para las sesiones
      muscleGroups = muscleGroups.slice(0, sessionsPerWeek);
    }
    
    // Función auxiliar para obtener ejercicios por patrón de movimiento
    const getExercisesByMovementPattern = (pattern) => {
      return allExercises.filter(ex => ex.movementCategory === pattern);
    };
    
    // Generar ejercicios para cada sesión de la nueva semana
    for (let session = 1; session <= sessionsPerWeek; session++) {
      const muscleGroup = muscleGroups[session - 1];
      const sessionIndex = session - 1;
      const dayCharacteristics = sessionCharacteristics[sessionIndex] || [];
      
      // Calcular el nuevo número de sesión
      const newSessionNumber = (currentWeeks * sessionsPerWeek) + session;
      
      console.log(`Generando sesión ${newSessionNumber} para grupo muscular: ${muscleGroup}`);
      console.log(`Características del día: ${dayCharacteristics.join(', ')}`);
      
      // Determinar cuántos ejercicios por sesión basado en el tiempo disponible
      let exercisesPerSession;
      switch (formData.timeAvailable) {
        case '30':
          exercisesPerSession = 3;
          break;
        case '45':
          exercisesPerSession = 4;
          break;
        case '60':
          exercisesPerSession = 5;
          break;
        case '90':
          exercisesPerSession = 7;
          break;
        default:
          exercisesPerSession = 5;
      }
      
      // Obtener patrones de movimiento basados en las características del día
      let movementPatterns = [];
      
      if (dayCharacteristics.length > 0) {
        // Combinar todos los patrones de movimiento de todas las características seleccionadas
        dayCharacteristics.forEach(characteristic => {
          const patterns = dayCharacteristicToMovementPatterns[characteristic] || [];
          movementPatterns = [...movementPatterns, ...patterns];
        });
        
        // Eliminar duplicados
        movementPatterns = [...new Set(movementPatterns)];
      } else {
        // Si no hay características específicas, usar el mapeo tradicional
        movementPatterns = movementPatternMapping[muscleGroup] || allMovementPatterns;
      }
      
      // Si no hay patrones de movimiento, usar todos los patrones
      if (movementPatterns.length === 0) {
        movementPatterns = allMovementPatterns;
      }
      
      // Seleccionar ejercicios para cada patrón de movimiento
      for (let i = 0; i < exercisesPerSession; i++) {
        // Seleccionar un patrón de movimiento
        const patternIndex = i % movementPatterns.length;
        const pattern = movementPatterns[patternIndex];
        
        // Obtener ejercicios para este patrón
        const exercisesForPattern = getExercisesByMovementPattern(pattern);
        
        if (exercisesForPattern.length > 0) {
          // Filtrar por equipamiento seleccionado y evitar ejercicios ya usados
          let filteredExercises = exercisesForPattern.filter(ex => 
            formData.equipment.includes(ex.equipo) && !usedExerciseIds.has(ex.id)
          );
          
          // Si no hay suficientes ejercicios nuevos, permitir repetir algunos
          if (filteredExercises.length === 0) {
            filteredExercises = exercisesForPattern.filter(ex => 
              formData.equipment.includes(ex.equipo)
            );
          }
          
          if (filteredExercises.length === 0) {
            console.warn(`No se encontraron ejercicios para el patrón ${pattern} con el equipamiento seleccionado`);
            continue; // Saltar a la siguiente iteración si no hay ejercicios disponibles
          }
          
          // Seleccionar un ejercicio aleatorio
          const randomIndex = Math.floor(Math.random() * filteredExercises.length);
          const selectedExercise = filteredExercises[randomIndex];
          
          // Marcar este ejercicio como usado
          usedExerciseIds.add(selectedExercise.id);
          
          // Determinar series y descanso según el objetivo
          let series, rest, method;
          
          switch (formData.fitnessObjective) {
            case 'strength':
              series = Math.floor(Math.random() * 3) + 3; // 3-5 series
              rest = [90, 120, 180, 240][Math.floor(Math.random() * 4)]; // 90-240 segundos
              method = 'Standard'; // Método por defecto para fuerza
              break;
            case 'conditioning':
              series = Math.floor(Math.random() * 2) + 2; // 2-3 series
              rest = [15, 30, 45][Math.floor(Math.random() * 3)]; // 15-45 segundos
              // Para acondicionamiento, podemos variar los métodos pero con mayor probabilidad de Standard
              const condMethods = ['Standard', 'Standard', 'AMRAP', 'EMOM', 'Tabata', 'Circuit'];
              method = condMethods[Math.floor(Math.random() * condMethods.length)];
              break;
            default: // muscleMass (hipertrofia)
              series = Math.floor(Math.random() * 3) + 3; // 3-5 series
              rest = [60, 90, 120][Math.floor(Math.random() * 3)]; // 60-120 segundos
              // Para hipertrofia, podemos variar los métodos pero con mayor probabilidad de Standard
              const massMethods = ['Standard', 'Standard', 'Standard', 'Superset', 'Drop Set', 'Rest-Pause'];
              method = massMethods[Math.floor(Math.random() * massMethods.length)];
          }
          
          // Añadir el ejercicio al plan
          newExercises.push({
            sessionNumber: newSessionNumber,
            exerciseNumber: i + 1,
            nombreEjercicio: selectedExercise.nombre,
            patronMovimiento: pattern,
            seleccionMuscular: muscleGroup,
            equipmentUsed: selectedExercise.equipo,
            series: series,
            rest: rest,
            metodo: method,
            preview: selectedExercise.previewURL,
            exerciseId: selectedExercise.id
          });
        }
      }
    }
  }
  
  return newExercises;
};