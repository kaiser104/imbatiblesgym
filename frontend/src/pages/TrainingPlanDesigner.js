// frontend/src/pages/TrainingPlanDesigner.js
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './TrainingPlanDesigner.css';

const TrainingPlanDesigner = () => {
  // Estado para objetivos fitness (checkboxes)
  const [fitnessGoals, setFitnessGoals] = useState({
    muscleMass: false,
    conditioning: false,
    strength: false,
  });

  // Estado para frecuencia (dropdown: 1 a 7 días)
  const [frequency, setFrequency] = useState('3');

  // Opciones para selección de musculatura
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

  // Estado para, en caso de "Personalizado", seleccionar grupos musculares
  const customMuscleOptions = [
    'Pectorales', 'Espalda', 'Bíceps', 'Tríceps', 'Deltoides',
    'Deltoides posterior', 'Glúteos', 'Abdominales', 'Lumbares',
    'Cuádriceps', 'Isquiotibiales', 'Pantorrilla', 'Aductores',
    'Abductores', 'Antebrazos'
  ];
  const [customMuscles, setCustomMuscles] = useState([]);

  // Estado para equipamiento disponible (checkboxes)
  const equipmentOptions = [
    'Trineo', 'Suspensión', 'Rodillo de espuma', 'Polea', 'Peso Corporal',
    'Fit ball', 'Mancuernas', 'Landmine', 'Kettlebell', 'Disco',
    'Cuerda de batida', 'Chaleco con peso', 'Bolsa de arena', 'Bola de lacrosse',
    'Barra', 'Power band', 'Balón medicinal'
  ];
  const [equipment, setEquipment] = useState([]);

  // Nuevo estado para duración del programa
  const [duration, setDuration] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Manejar cambio en los objetivos fitness
  const handleFitnessGoalChange = (e) => {
    const { name, checked } = e.target;
    setFitnessGoals(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Manejar cambio en la frecuencia
  const handleFrequencyChange = (e) => {
    setFrequency(e.target.value);
  };

  // Manejar cambio en la selección de musculatura
  const handleMuscleSelectionChange = (e) => {
    setMuscleSelection(e.target.value);
    if (e.target.value !== 'Personalizado') {
      setCustomMuscles([]);
    }
  };

  // Manejar cambio en los grupos musculares personalizados
  const handleCustomMuscleChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setCustomMuscles(prev => [...prev, value]);
    } else {
      setCustomMuscles(prev => prev.filter(m => m !== value));
    }
  };

  // Manejar cambio en el equipamiento
  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setEquipment(prev => [...prev, value]);
    } else {
      setEquipment(prev => prev.filter(eq => eq !== value));
    }
  };

  // Manejar cambio en la duración del programa
  const handleDurationChange = (e) => {
    setDuration(e.target.value);
  };

  // Al enviar el formulario, por ahora simplemente se genera un objeto y se muestra en consola y en pantalla.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const trainingPlan = {
      fitnessGoals: { ...fitnessGoals },
      frequency: Number(frequency),
      muscleSelection,
      customMuscles: muscleSelection === 'Personalizado' ? customMuscles : [],
      equipment,
      duration,
      createdAt: new Date()
    };
    console.log("Training Plan:", trainingPlan);
    setMessage("Plan generado correctamente (sin guardar).");
    // Aquí podrías implementar la lógica para guardar el plan en Firestore si lo deseas.
  };

  return (
    <div className="training-plan-designer">
      <h2>Diseñador de Entrenamientos</h2>
      <form onSubmit={handleSubmit}>
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

        <fieldset>
          <legend>Frecuencia Semanal de Entrenamiento</legend>
          <select value={frequency} onChange={handleFrequencyChange}>
            {[...Array(7)].map((_, i) => (
              <option key={i+1} value={i+1}>
                {i+1} día{(i+1) > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </fieldset>

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

        <fieldset>
          <legend>Duración del Programa</legend>
          <select value={duration} onChange={handleDurationChange} required>
            <option value="">-- Selecciona la duración --</option>
            <option value="1 mes">1 mes</option>
            <option value="2 meses">2 meses</option>
            <option value="3 meses">3 meses</option>
          </select>
        </fieldset>

        <button type="submit">Generar Plan</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default TrainingPlanDesigner;
