// frontend/src/pages/TrainingPlanDesigner.js
import React, { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './TrainingPlanDesigner.css';

const TrainingPlanDesigner = () => {
  // Objetivo Fitness: checkbox (se asume que el usuario selecciona al menos uno)
  const [fitnessGoals, setFitnessGoals] = useState({
    muscleMass: false,       // Incrementar masa muscular
    conditioning: false,     // Acondicionamiento físico y definición
    strength: false          // Incremento de fuerza
  });

  // Frecuencia semanal (1 a 7 días)
  const [frequency, setFrequency] = useState('3');

  // Selección de musculatura a entrenar (dropdown)
  const muscleOptions = [
    'Personalizado',
    'Empuje, Jalar, Piernas',
    'Empujar, Jalar, Piernas, Cuerpo completo',
    'Empujar, Jalar, Piernas, Superior, Inferior',
    'Superior, Inferior, Cuerpo completo',
    'Cuerpo Completo',
    'Bro Split'
  ];
  const [muscleSelection, setMuscleSelection] = useState('');

  // Si se elige "Personalizado", permitir seleccionar grupos musculares
  const customMuscleOptions = [
    'Pectorales', 'Espalda', 'Bíceps', 'Tríceps', 'Deltoides',
    'Deltoides posterior', 'Glúteos', 'Abdominales', 'Lumbares',
    'Cuádriceps', 'Isquiotibiales', 'Pantorrilla', 'Aductores',
    'Abductores', 'Antebrazos'
  ];
  const [customMuscles, setCustomMuscles] = useState([]);

  // Duración del programa (en meses)
  const [duration, setDuration] = useState('1'); // valores "1", "2", "3"

  // Equipamiento disponible (checkboxes)
  const equipmentOptions = [
    'Trineo', 'Suspensión', 'Rodillo de espuma', 'Polea', 'Peso Corporal',
    'Fit ball', 'Mancuernas', 'Landmine', 'Kettlebell', 'Disco',
    'Cuerda de batida', 'Chaleco con peso', 'Bolsa de arena',
    'Bola de lacrosse', 'Barra', 'Power band', 'Balón medicinal'
  ];
  const [equipment, setEquipment] = useState([]);

  // NUEVOS CAMPOS: Categorías de ejercicio (según tu base de datos en Firebase)
  const exerciseCategoryOptions = [
    'Bent Leg Hip Extension',
    'Cardio',
    'Double Leg Push',
    'Core Stability',
    'Auxiliary',
    'Mobility',
    'Explosive',
    'Horizontal Push',
    'Straight Leg Hip Extension',
    'Downward Pull',
    'Upward Pull',
    'Upward Push',
    'Single Leg Push',
    'Horizontal Pull'
  ];
  const [exerciseCategories, setExerciseCategories] = useState([]);

  // NUEVOS CAMPOS: Parámetros avanzados para entrenamiento
  const trainingTypeOptions = ['Hipertrofia', 'Fuerza', 'Resistencia'];
  const [trainingType, setTrainingType] = useState('Hipertrofia');
  const intensityOptions = ['8', '9', '10'];
  const [intensity, setIntensity] = useState('9'); // Valor deseado (RPE)

  // Estado para almacenar el plan generado (arreglo de sesiones)
  const [trainingPlan, setTrainingPlan] = useState([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Manejar cambios en objetivos fitness
  const handleFitnessGoalChange = (e) => {
    const { name, checked } = e.target;
    setFitnessGoals(prev => ({ ...prev, [name]: checked }));
  };

  // Manejar frecuencia
  const handleFrequencyChange = (e) => {
    setFrequency(e.target.value);
  };

  // Manejar selección de musculatura
  const handleMuscleSelectionChange = (e) => {
    setMuscleSelection(e.target.value);
    if (e.target.value !== 'Personalizado') {
      setCustomMuscles([]);
    }
  };

  // Manejar grupos musculares personalizados
  const handleCustomMuscleChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setCustomMuscles(prev => [...prev, value]);
    } else {
      setCustomMuscles(prev => prev.filter(m => m !== value));
    }
  };

  // Manejar duración del programa
  const handleDurationChange = (e) => {
    setDuration(e.target.value);
  };

  // Manejar equipamiento
  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setEquipment(prev => [...prev, value]);
    } else {
      setEquipment(prev => prev.filter(eq => eq !== value));
    }
  };

  // NUEVOS HANDLERS: Manejar selección de categorías de ejercicio
  const handleExerciseCategoryChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setExerciseCategories(prev => [...prev, value]);
    } else {
      setExerciseCategories(prev => prev.filter(cat => cat !== value));
    }
  };

  // Manejar cambios en tipo de entrenamiento
  const handleTrainingTypeChange = (e) => {
    setTrainingType(e.target.value);
  };

  // Manejar cambios en nivel de intensidad (RPE)
  const handleIntensityChange = (e) => {
    setIntensity(e.target.value);
  };

  // Función para calcular descanso recomendado
  const getRecommendedRest = () => {
    const restMuscleMass = fitnessGoals.muscleMass ? 90 : 0;
    const restConditioning = fitnessGoals.conditioning ? 60 : 0;
    const restStrength = fitnessGoals.strength ? 180 : 0;
    const maxRest = Math.max(restMuscleMass, restConditioning, restStrength);
    return maxRest || 60; // Si ninguno está seleccionado, usar 60 por defecto
  };

  // Función para obtener ejercicios filtrados desde Firebase
  const fetchExercises = async () => {
    try {
      const snapshot = await getDocs(collection(db, "exercises"));
      const allExercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filtrar por categorías (si se seleccionaron) y equipamiento
      const filtered = allExercises.filter(exercise => {
        const categoryMatch =
          exerciseCategories.length === 0 ||
          (exercise.category && exerciseCategories.includes(exercise.category));
        const equipmentMatch =
          equipment.length === 0 ||
          (exercise.equipment && equipment.some(eq => exercise.equipment.includes(eq)));
        return categoryMatch && equipmentMatch;
      });
      return filtered;
    } catch (err) {
      console.error("Error fetching exercises:", err);
      return [];
    }
  };

  // Función para generar el plan de entrenamiento (simulación avanzada)
  const generatePlan = async () => {
    setMessage('');
    setError('');

    // Convertir frecuencia y duración a números
    const freq = parseInt(frequency, 10);
    const months = parseInt(duration, 10);
    const totalWeeks = months * 4;
    const totalSessions = freq * totalWeeks;

    // Valores fijos para método y series
    const method = "Método Estándar";
    const series = 4;
    const rest = getRecommendedRest();

    // Determinar la descripción de la musculatura según la selección
    const muscleDesc = muscleSelection === 'Personalizado'
      ? customMuscles.join(', ')
      : muscleSelection;

    // Buscar ejercicios filtrados desde Firebase
    const exercisesList = await fetchExercises();
    // Si no se encuentran ejercicios, usar un placeholder
    const exercisesToUse = exercisesList.length > 0
      ? exercisesList
      : [{ id: "placeholder", exercise: "Ejercicio genérico", category: muscleDesc, equipment: equipment.join(', ') || "Sin equipo" }];

    // Generar el plan: para cada sesión se selecciona aleatoriamente un ejercicio de la lista filtrada
    const plan = [];
    for (let i = 1; i <= totalSessions; i++) {
      const randomExercise = exercisesToUse[Math.floor(Math.random() * exercisesToUse.length)];
      plan.push({
        sessionNumber: i,
        preview: "", // Aquí podrías asignar una URL de imagen de ejemplo
        exercise: randomExercise.exercise || `Ejercicio ${i}`,
        category: randomExercise.category || muscleDesc,
        mainMuscle: randomExercise.category || muscleDesc,
        equipment: randomExercise.equipment || (equipment.join(', ') || "Sin equipo"),
        method,
        series,
        rest,
        trainingType,
        intensity
      });
    }
    setTrainingPlan(plan);
    setMessage("Plan generado (simulación avanzada). Revisa la tabla a continuación.");
  };

  // Manejar envío del formulario (guardar plan en Firestore, por ejemplo)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ejemplo: guardar el plan en la colección "trainingPlans"
      // await addDoc(collection(db, "trainingPlans"), { plan: trainingPlan });
      setMessage("Plan de entrenamiento guardado correctamente.");
    } catch (err) {
      console.error("Error al guardar plan de entrenamiento:", err);
      setError("Error al guardar plan de entrenamiento: " + err.message);
    }
  };

  return (
    <div className="training-plan-designer">
      <h2>Diseñador de Entrenamientos</h2>
      <form onSubmit={handleSubmit}>
        {/* Objetivo Fitness */}
        <fieldset>
          <legend>Objetivo Fitness</legend>
          <label>
            <input
              type="checkbox"
              name="muscleMass"
              checked={fitnessGoals.muscleMass}
              onChange={handleFitnessGoalChange}
            />
            Incrementar masa muscular
          </label>
          <label>
            <input
              type="checkbox"
              name="conditioning"
              checked={fitnessGoals.conditioning}
              onChange={handleFitnessGoalChange}
            />
            Acondicionamiento físico y definición
          </label>
          <label>
            <input
              type="checkbox"
              name="strength"
              checked={fitnessGoals.strength}
              onChange={handleFitnessGoalChange}
            />
            Incremento de fuerza
          </label>
        </fieldset>

        {/* Frecuencia */}
        <fieldset>
          <legend>Frecuencia Semanal de Entrenamiento</legend>
          <select value={frequency} onChange={handleFrequencyChange}>
            {[...Array(7)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} día{(i + 1) > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Selección de musculatura */}
        <fieldset>
          <legend>Selección de Musculatura a Entrenar</legend>
          <select value={muscleSelection} onChange={handleMuscleSelectionChange}>
            <option value="">-- Selecciona una opción --</option>
            {muscleOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {muscleSelection === 'Personalizado' && (
            <div className="custom-muscles">
              <p>Selecciona los grupos musculares:</p>
              {customMuscleOptions.map(muscle => (
                <label key={muscle}>
                  <input
                    type="checkbox"
                    value={muscle}
                    checked={customMuscles.includes(muscle)}
                    onChange={handleCustomMuscleChange}
                  />
                  {muscle}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        {/* Duración */}
        <fieldset>
          <legend>Duración del Programa</legend>
          <select value={duration} onChange={handleDurationChange}>
            <option value="1">1 mes</option>
            <option value="2">2 meses</option>
            <option value="3">3 meses</option>
          </select>
        </fieldset>

        {/* Equipamiento */}
        <fieldset>
          <legend>Equipamiento Disponible</legend>
          <div className="equipment-options">
            {equipmentOptions.map(eq => (
              <label key={eq}>
                <input
                  type="checkbox"
                  value={eq}
                  checked={equipment.includes(eq)}
                  onChange={handleEquipmentChange}
                />
                {eq}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Categorías de Ejercicio */}
        <fieldset>
          <legend>Selecciona Categorías de Ejercicio</legend>
          <div className="category-options">
            {exerciseCategoryOptions.map(cat => (
              <label key={cat}>
                <input
                  type="checkbox"
                  value={cat}
                  checked={exerciseCategories.includes(cat)}
                  onChange={handleExerciseCategoryChange}
                />
                {cat}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Parámetros Avanzados */}
        <fieldset>
          <legend>Parámetros Avanzados</legend>
          <label>
            Tipo de Entrenamiento:
            <select value={trainingType} onChange={handleTrainingTypeChange}>
              {trainingTypeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Nivel de Intensidad (RPE deseado):
            <select value={intensity} onChange={handleIntensityChange}>
              {intensityOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        </fieldset>

        {/* Botones */}
        <div className="plan-buttons">
          <button type="button" onClick={generatePlan}>
            Generar Plan
          </button>
          <button type="submit">Guardar Plan de Entrenamiento</button>
        </div>
      </form>

      {message && <p className="message">{message}</p>}
      {error && <p className="error">{error}</p>}

      {/* Visualización del plan generado */}
      {trainingPlan.length > 0 && (
        <div className="plan-table">
          <h3>Plan de Entrenamiento Generado</h3>
          <table>
            <thead>
              <tr>
                <th>Sesión</th>
                <th>Vista Previa</th>
                <th>Ejercicio</th>
                <th>Categoría</th>
                <th>Músculo Principal</th>
                <th>Equipamiento</th>
                <th>Método</th>
                <th>Series</th>
                <th>Descanso (seg)</th>
                <th>Tipo de Entrenamiento</th>
                <th>RPE</th>
              </tr>
            </thead>
            <tbody>
              {trainingPlan.map(session => (
                <tr key={session.sessionNumber}>
                  <td>{session.sessionNumber}</td>
                  <td>
                    {session.preview ? (
                      <img src={session.preview} alt={`Vista de sesión ${session.sessionNumber}`} style={{ maxWidth: '80px' }} />
                    ) : (
                      "No disponible"
                    )}
                  </td>
                  <td>{session.exercise}</td>
                  <td>{session.category}</td>
                  <td>{session.mainMuscle}</td>
                  <td>{session.equipment}</td>
                  <td>{session.method}</td>
                  <td>{session.series}</td>
                  <td>{session.rest}</td>
                  <td>{session.trainingType}</td>
                  <td>{session.intensity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TrainingPlanDesigner;
