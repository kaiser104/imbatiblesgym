// frontend/src/pages/TrainingPlanDesigner.js
import React, { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './TrainingPlanDesigner.css';

const TrainingPlanDesigner = () => {
  // 1. Objetivo Fitness (radio)
  const [fitnessObjective, setFitnessObjective] = useState('muscleMass'); 
  // "muscleMass" (Hipertrofia), "conditioning" (Acondicionamiento), "strength" (Fuerza)

  // 2. Duración del Programa (1 a 6 meses)
  const [duration, setDuration] = useState('1');

  // 3. Frecuencia Semanal (1 a 7 días)
  const [frequency, setFrequency] = useState('3');

  // 4. Tiempo disponible por sesión (30, 45, 60, 90)
  const [timeAvailable, setTimeAvailable] = useState('30');

  // Selección de musculatura a entrenar
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

  // Grupos musculares personalizados
  const customMuscleOptions = [
    'Pectorales', 'Espalda', 'Bíceps', 'Tríceps', 'Deltoides',
    'Deltoides posterior', 'Glúteos', 'Abdominales', 'Lumbares',
    'Cuádriceps', 'Isquiotibiales', 'Pantorrilla', 'Aductores',
    'Abductores', 'Antebrazos', 'Trapecio'
  ];
  const [customMuscles, setCustomMuscles] = useState([]);

  // Equipamiento
  const equipmentOptions = [
    'Trineo', 'Suspensión', 'Rodillo de espuma', 'Polea', 'Peso Corporal',
    'Fit ball', 'Mancuernas', 'Landmine', 'Kettlebell', 'Disco',
    'Cuerda de batida', 'Chaleco con peso', 'Bolsa de arena',
    'Bola de lacrosse', 'Barra', 'Power band', 'Balón medicinal'
  ];
  const [equipment, setEquipment] = useState([]);

  // Botón para seleccionar todos los equipos
  const selectAllEquipment = () => {
    setEquipment(equipmentOptions);
  };

  // Nuevo: Opciones para el enfoque (columna "Enfoque")
  const enfoqueOptions = [
    "Multi-Generic Exercise",
    "Isolation-Generic Exercise"
  ];

  // Mapeo para separar la "Selección muscular" en grupos (cuando no es Personalizado)
  const muscleGroupMapping = {
    "Empuje, Jalar, Piernas": ["Empuje", "Jalar", "Piernas"],
    "Empujar, Jalar, Piernas, Cuerpo completo": ["Empujar", "Jalar", "Piernas", "Cuerpo completo"],
    "Empujar, Jalar, Piernas, Superior, Inferior": ["Empujar", "Jalar", "Piernas", "Superior", "Inferior"],
    "Superior, Inferior, Cuerpo completo": ["Superior", "Inferior", "Cuerpo completo"],
    "Cuerpo Completo": ["Cuerpo Completo"],
    "Bro Split": ["Bro Split"]
  };

  // Mapeo de cada grupo muscular a categorías de ejercicio (ejemplo)
  const muscleGroupToCategories = {
    "Empuje": ["Horizontal Push", "Upward Push"],
    "Empujar": ["Horizontal Push", "Upward Push"],
    "Jalar": ["Horizontal Pull", "Upward Pull", "Downward Pull"],
    "Piernas": ["Double Leg Push", "Single Leg Push", "Bent Leg Hip Extension", "Straight Leg Hip Extension", "Explosive"],
    "Cuerpo completo": ["Explosive", "Core Stability", "Cardio"],
    "Superior": ["Horizontal Push", "Upward Push", "Horizontal Pull", "Upward Pull", "Downward Pull"],
    "Inferior": ["Double Leg Push", "Single Leg Push", "Bent Leg Hip Extension", "Straight Leg Hip Extension", "Explosive"],
    "Bro Split": [] // Para Bro Split se usará todo (o se pueden definir según convenga)
  };

  // Estado para almacenar el plan generado (arreglo de objetos)
  const [trainingPlan, setTrainingPlan] = useState([]);

  // Mensajes
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /* HANDLERS */
  const handleFitnessObjectiveChange = (e) => { setFitnessObjective(e.target.value); };
  const handleDurationChange = (e) => { setDuration(e.target.value); };
  const handleFrequencyChange = (e) => {
    const newFreq = parseInt(e.target.value, 10);
    setFrequency(e.target.value);
    if(newFreq <= 2) { setMuscleSelection("Cuerpo Completo"); }
    else if(newFreq === 3) { setMuscleSelection("Empuje, Jalar, Piernas"); }
    else if(newFreq === 4) { setMuscleSelection("Empujar, Jalar, Piernas, Cuerpo completo"); }
    else if(newFreq === 5) { setMuscleSelection("Empujar, Jalar, Piernas, Superior, Inferior"); }
    else if(newFreq >= 6) { setMuscleSelection("Bro Split"); }
  };
  const handleTimeAvailableChange = (e) => { setTimeAvailable(e.target.value); };
  const handleMuscleSelectionChange = (e) => {
    setMuscleSelection(e.target.value);
    if(e.target.value !== 'Personalizado'){
      setCustomMuscles([]);
    }
  };
  const handleCustomMuscleChange = (e) => {
    const { value, checked } = e.target;
    if(checked) { setCustomMuscles(prev => [...prev, value]); }
    else { setCustomMuscles(prev => prev.filter(m => m !== value)); }
  };
  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    if(checked) { setEquipment(prev => [...prev, value]); }
    else { setEquipment(prev => prev.filter(eq => eq !== value)); }
  };

  /* REGLAS HEURÍSTICAS */
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
    let rest = 60;
    if(fitnessObjective === 'muscleMass') rest = 90;
    else if(fitnessObjective === 'conditioning') rest = 60;
    else if(fitnessObjective === 'strength') rest = 180;
    return rest;
  };

  const fetchExercises = async () => {
    try {
      const snapshot = await getDocs(collection(db, "exercises"));
      const allExercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allExercises.filter(ex => {
        if(equipment.length === 0) return true;
        if(!ex.equipo) return false;
        return equipment.some(eq => ex.equipo.includes(eq));
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
    let fallbackExercises = [{
      id: "placeholder1",
      nombre: "Multi-Generic Exercise",
      equipo: "Sin equipo",
      categoria: "Horizontal Push"
    },{
      id: "placeholder2",
      nombre: "Isolation-Generic Exercise",
      equipo: "Sin equipo",
      categoria: "Isolation"
    }];

    const finalList = exercisesList.length > 0 ? exercisesList : fallbackExercises;

    // Determinar los grupos musculares a usar según la selección
    let muscleGroups = [];
    if(muscleSelection === "Personalizado") {
      muscleGroups = customMuscles.length > 0 ? customMuscles : ["Cuerpo Completo"];
    } else {
      // Se asume que la opción contiene comas para separar grupos
      muscleGroups = muscleSelection.split(',').map(s => s.trim());
    }

    // Construir el plan sesión a sesión
    let plan = [];
    for(let s = 1; s <= totalSessions; s++){
      // Determinar el grupo muscular de la sesión
      const currentMuscleGroup = muscleGroups[(s-1) % muscleGroups.length];

      // Filtrar ejercicios de finalList por categoría relacionada a currentMuscleGroup
      let filteredExercises = finalList.filter(ex => {
        // Si no tiene 'categoria', se descarta
        if(!ex.categoria) return false;
        // Si currentMuscleGroup está en nuestro mapping, usarlo para filtrar
        if(muscleGroupToCategories[currentMuscleGroup] && muscleGroupToCategories[currentMuscleGroup].length > 0) {
          return muscleGroupToCategories[currentMuscleGroup].includes(ex.categoria);
        }
        // Si no está definido en el mapping, permitimos cualquier ejercicio
        return true;
      });
      
      // Simulación de separación entre ejercicios multi y de aislamiento:
      let multiExercises = [];
      let isoExercises = [];
      if(filteredExercises.length === 1) {
        multiExercises = [filteredExercises[0]];
        isoExercises = [filteredExercises[0]];
      } else {
        const half = Math.floor(filteredExercises.length / 2);
        multiExercises = filteredExercises.slice(0, half);
        isoExercises = filteredExercises.slice(half);
      }
      
      // Para cada sesión, generar 'total' ejercicios
      let sessionExercises = [];
      // Por defecto, alternamos: para los primeros 'multi' ejercicios, usamos la opción seleccionada por defecto en "Enfoque"
      for(let m = 0; m < multi; m++){
        // Default enfoque: "Multi-Generic Exercise"
        // Escogemos al azar de multiExercises
        const randIndex = Math.floor(Math.random() * multiExercises.length);
        sessionExercises.push({
          sessionNumber: s,
          exerciseNumber: m + 1, // se asignará luego
          preview: multiExercises[randIndex].previewURL || "",
          // Enfoque: menú desplegable (default: "Multi-Generic Exercise")
          enfoque: "Multi-Generic Exercise",
          // Selección muscular: el grupo actual
          seleccionMuscular: currentMuscleGroup,
          // Nombre de Ejercicio: valor por defecto del ejercicio seleccionado
          nombreEjercicio: multiExercises[randIndex].nombre,
          equipmentUsed: multiExercises[randIndex].equipo || "Sin equipo",
          series: defaultSeries,
          rest: restDefault,
        });
      }
      for(let i = 0; i < iso; i++){
        const randIndex = Math.floor(Math.random() * isoExercises.length);
        sessionExercises.push({
          sessionNumber: s,
          exerciseNumber: multi + i + 1,
          preview: isoExercises[randIndex].previewURL || "",
          enfoque: "Isolation-Generic Exercise",
          seleccionMuscular: currentMuscleGroup,
          nombreEjercicio: isoExercises[randIndex].nombre,
          equipmentUsed: isoExercises[randIndex].equipo || "Sin equipo",
          series: defaultSeries,
          rest: restDefault,
        });
      }
      // Si por alguna razón tenemos más ejercicios de los necesarios, recortamos
      if(sessionExercises.length > total) {
        sessionExercises = sessionExercises.slice(0, total);
      }
      // Agregar a plan
      plan = plan.concat(sessionExercises);
    }
    setTrainingPlan(plan);
    setMessage("Plan generado exitosamente. Puedes editarlo en la tabla.");
  };

  // Handlers para edición en la tabla
  const handleEnfoqueChange = (e, index) => {
    const newPlan = [...trainingPlan];
    newPlan[index].enfoque = e.target.value;
    // Al cambiar el enfoque, se podría actualizar "nombreEjercicio" para sugerir
    // uno de la lista correspondiente, pero en este ejemplo solo actualizamos el valor.
    setTrainingPlan(newPlan);
  };

  const handleNombreEjercicioChange = (e, index) => {
    const newPlan = [...trainingPlan];
    newPlan[index].nombreEjercicio = e.target.value;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ejemplo de guardado en Firestore:
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
        {/* ... campos de Objetivo, Duración, Frecuencia, Tiempo, Musculatura y Equipamiento ... */}
        <div className="plan-buttons">
          <button type="button" onClick={generatePlan}>
            Generar Plan
          </button>
          <button type="submit">Guardar Plan de Entrenamiento</button>
        </div>
      </form>

      {message && <p className="message">{message}</p>}
      {error && <p className="error">{error}</p>}

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
                  {/* Columna Enfoque */}
                  <td>
                    <select
                      value={session.enfoque}
                      onChange={(e) => handleEnfoqueChange(e, index)}
                    >
                      {enfoqueOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                  {/* Columna Selección muscular (read-only, basada en el grupo asignado) */}
                  <td>{session.seleccionMuscular}</td>
                  {/* Columna Nombre de Ejercicio (dropdown dinámico) */}
                  <td>
                    <select
                      value={session.nombreEjercicio}
                      onChange={(e) => handleNombreEjercicioChange(e, index)}
                    >
                      {(() => {
                        // Determinar la lista de opciones según el enfoque de la fila
                        const currentGroup = session.seleccionMuscular;
                        const pool = session.enfoque === "Multi-Generic Exercise" 
                          ? finalList.filter(e => e.categoria && muscleGroupToCategories[currentGroup] && muscleGroupToCategories[currentGroup].includes(e.categoria)).slice(0, Math.floor(finalList.length/2))
                          : finalList.filter(e => e.categoria && muscleGroupToCategories[currentGroup] && muscleGroupToCategories[currentGroup].includes(e.categoria)).slice(Math.floor(finalList.length/2));
                        // Si no hay opciones, mostrar una opción de respaldo
                        if(pool.length === 0) {
                          return <option value="N/A">No hay ejercicios</option>;
                        }
                        return pool.map(ej => (
                          <option key={ej.id} value={ej.nombre}>{ej.nombre}</option>
                        ));
                      })()}
                    </select>
                  </td>
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
