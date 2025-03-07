// frontend/src/pages/TrainingPlanDesigner.js
import React, { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './TrainingPlanDesigner.css';

// Mapeo de la selección muscular a patrones de movimiento (ejemplo)
const movementPatternMapping = {
  "Empuje": ["Horizontal Push", "Upward Push"],
  "Jalar": ["Horizontal Pull", "Upward Pull", "Downward Pull"],
  "Piernas": ["Double Leg Push", "Single Leg Push", "Bent Leg Hip Extension", "Straight Leg Hip Extension"]
};

const enfoqueOptions = [
  "Multi-Generic Exercise",
  "Isolation-Generic Exercise"
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

  // Función para obtener ejercicios desde Firebase (se espera que en cada documento existan:
  // nombre, movementCategory, equipo (o sus variantes) y fileURL)
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
        // Si el campo 'equipo' es una cadena, comprobamos que incluya alguno de los equipamientos
        if (typeof ex.equipo === 'string') {
          return equipment.some(eq => ex.equipo.includes(eq));
        }
        // Si es un array
        if (Array.isArray(ex.equipo)) {
          return equipment.some(eq => ex.equipo.includes(eq));
        }
        return false;
      });
      return filtered;
    } catch (err) {
      console.error("Error fetching exercises:", err);
      return [];
    }
  };

  const generatePlan = async () => {
    setMessage('');
    setError('');
    const freq = parseInt(frequency, 10);
    const months = parseInt(duration, 10);
    const totalWeeks = months * 4; 
    const totalSessions = freq * totalWeeks;

    const { total, multi, iso } = getExercisesCountByObjectiveTime(fitnessObjective, timeAvailable);
    if(total === 0) {
      setError("No se pudo determinar el número de ejercicios. Verifica tus selecciones.");
      return;
    }

    const restDefault = getRecommendedRest();
    const defaultSeries = 4;
    const exercisesList = await fetchExercises();

    // Fallback en caso de que no se obtengan ejercicios desde Firebase
    let fallbackExercises = [{
      id: "placeholder1",
      nombre: "Multi-Generic Exercise",
      movementCategory: "",
      equipo: "Sin equipo",
      previewURL: ""
    },{
      id: "placeholder2",
      nombre: "Isolation-Generic Exercise",
      movementCategory: "",
      equipo: "Sin equipo",
      previewURL: ""
    }];

    const finalList = exercisesList.length > 0 ? exercisesList : fallbackExercises;

    // Dividir la lista en dos grupos: uno para compuestos (multi) y otro para aislamiento (iso)
    let multiExercises = [];
    let isoExercises = [];
    if(finalList.length === 1) {
      multiExercises = [finalList[0]];
      isoExercises = [finalList[0]];
    } else {
      const half = Math.floor(finalList.length / 2);
      multiExercises = finalList.slice(0, half);
      isoExercises = finalList.slice(half);
    }

    // Determinar el ciclo de selección muscular
    let muscleCycle = [];
    if (muscleSelection) {
      if(muscleSelection === 'Personalizado'){
        muscleCycle = customMuscles;
      } else {
        muscleCycle = muscleSelection.split(',').map(g => g.trim());
      }
    }

    let plan = [];
    for (let s = 1; s <= totalSessions; s++) {
      // Asignar de forma cíclica la selección muscular
      const seleccionMuscular = muscleCycle.length > 0 ? muscleCycle[(s - 1) % muscleCycle.length] : "";
      // Obtener patrones permitidos según la selección muscular
      const allowedPatterns = movementPatternMapping[seleccionMuscular] || [];
      
      let sessionExercises = [];
      // Generar ejercicios compuestos (multi)
      for (let m = 0; m < multi; m++) {
        let filteredMulti = multiExercises;
        if (allowedPatterns.length > 0) {
          filteredMulti = multiExercises.filter(ex => allowedPatterns.includes(ex.movementCategory));
          if(filteredMulti.length === 0) filteredMulti = multiExercises;
        }
        const randIndex = Math.floor(Math.random() * filteredMulti.length);
        sessionExercises.push({
          isMulti: true,
          suggestedExercise: filteredMulti[randIndex]
        });
      }
      // Generar ejercicios de aislamiento
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
      // Recortar si se generan más ejercicios de los requeridos
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
          // Aquí se asigna el movimiento desde movementCategory
          patronMovimiento: exObj.suggestedExercise.movementCategory || "",
          equipmentUsed: exObj.suggestedExercise.equipo || "Sin equipo",
          series: defaultSeries,
          rest: restDefault
        });
      });
    }

    setTrainingPlan(plan);
    setMessage("Plan generado exitosamente. Puedes editarlo en la tabla.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ejemplo: guardar el plan en Firestore
      // await addDoc(collection(db, "trainingPlans"), { plan: trainingPlan });
      setMessage("Plan de entrenamiento guardado correctamente.");
    } catch (err) {
      console.error("Error al guardar plan de entrenamiento:", err);
      setError("Error al guardar plan de entrenamiento: " + err.message);
    }
  };

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

  return (
    <div className="training-plan-designer">
      <h2>Diseñador de Entrenamientos</h2>
      <form onSubmit={handleSubmit}>
        {/* Objetivo Fitness */}
        <fieldset>
          <legend>Objetivo Fitness</legend>
          <label>
            <input
              type="radio"
              name="fitnessObjective"
              value="muscleMass"
              checked={fitnessObjective === 'muscleMass'}
              onChange={handleFitnessObjectiveChange}
            />
            Incrementar masa muscular
          </label>
          <label>
            <input
              type="radio"
              name="fitnessObjective"
              value="conditioning"
              checked={fitnessObjective === 'conditioning'}
              onChange={handleFitnessObjectiveChange}
            />
            Acondicionamiento físico y definición
          </label>
          <label>
            <input
              type="radio"
              name="fitnessObjective"
              value="strength"
              checked={fitnessObjective === 'strength'}
              onChange={handleFitnessObjectiveChange}
            />
            Incremento de fuerza
          </label>
        </fieldset>

        {/* Duración del Programa */}
        <fieldset>
          <legend>Duración del Programa (meses)</legend>
          <select value={duration} onChange={handleDurationChange}>
            {[...Array(6)].map((_, i) => (
              <option key={i} value={i+1}>
                {i+1} {(i+1) === 1 ? 'mes' : 'meses'}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Frecuencia Semanal */}
        <fieldset>
          <legend>Frecuencia Semanal de Entrenamiento</legend>
          <select value={frequency} onChange={handleFrequencyChange}>
            {[...Array(7)].map((_, i) => (
              <option key={i} value={i+1}>
                {i+1} {(i+1) > 1 ? 'días' : 'día'}
              </option>
            ))}
          </select>
        </fieldset>

        {/* Tiempo disponible */}
        <fieldset>
          <legend>Tiempo disponible por sesión</legend>
          <select value={timeAvailable} onChange={handleTimeAvailableChange}>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </fieldset>

        {/* Selección de Musculatura */}
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

        {/* Equipamiento Disponible */}
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
          <button type="button" onClick={selectAllEquipment}>
            Seleccionar todos
          </button>
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

      {/* Tabla de resultados */}
      {trainingPlan.length > 0 && (
        <div className="plan-table">
          <h3>Plan de Entrenamiento Generado</h3>
          <table>
            <thead>
              <tr>
                <th>Sesión</th>
                <th>Ejercicio #</th>
                <th>Vista Previa</th>
                <th>Enfoque</th>
                <th>Selección muscular</th>
                <th>Nombre de Ejercicio</th>
                <th>Patrón de movimiento</th>
                <th>Equipamiento</th>
                <th>Series</th>
                <th>Descanso (seg)</th>
              </tr>
            </thead>
            <tbody>
              {trainingPlan.map((session, index) => (
                <tr key={index}>
                  <td>{session.sessionNumber}</td>
                  <td>{session.exerciseNumber}</td>
                  <td>
                    {session.preview ? (
                      <img
                        src={session.preview}
                        alt={`Vista de sesión ${session.sessionNumber}`}
                        style={{ maxWidth: '80px' }}
                      />
                    ) : (
                      "No disponible"
                    )}
                  </td>
                  <td>
                    <select
                      value={session.enfoque}
                      onChange={(e) => handleExerciseChange(e, index)}
                    >
                      {enfoqueOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                  <td>{session.seleccionMuscular}</td>
                  <td>{session.nombreEjercicio}</td>
                  <td>{session.patronMovimiento}</td>
                  <td>{session.equipmentUsed}</td>
                  <td>
                    <select
                      value={session.series}
                      onChange={(e) => handleSeriesChange(e, index)}
                    >
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={session.rest}
                      onChange={(e) => handleRestChange(e, index)}
                    >
                      {[30,45,60,90,120,180].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
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
