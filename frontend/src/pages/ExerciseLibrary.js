// frontend/src/pages/ExerciseLibrary.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { Link } from 'react-router-dom';
import { db } from '../firebase'; // Importar db directamente
import './ExerciseLibrary.css';

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    movementCategory: '',
    mainMuscle: '',
    equipment: ''
  });

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        console.log("Intentando obtener ejercicios de Firestore...");
        const exercisesCollection = collection(db, "exercises");
        const querySnapshot = await getDocs(exercisesCollection);
        
        console.log("Documentos obtenidos:", querySnapshot.size);
        
        const exerciseList = [];
        querySnapshot.forEach((doc) => {
          console.log("Documento ID:", doc.id, "Data:", doc.data());
          exerciseList.push({ id: doc.id, ...doc.data() });
        });
        
        setExercises(exerciseList);
        setFilteredExercises(exerciseList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching exercises:", err);
        setError("Error obteniendo ejercicios: " + err.message);
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  // El resto de tu código permanece igual
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    const filtered = exercises.filter((ex) => {
      const nameMatch = (ex.name || '').toLowerCase().includes(filters.name.toLowerCase());
      const categoryMatch = (ex.movementCategory || '').toLowerCase().includes(filters.movementCategory.toLowerCase());
      const mainMuscleMatch = (ex.mainMuscle || '').toLowerCase().includes(filters.mainMuscle.toLowerCase());
      const equipmentMatch = (ex.equipment || '').toLowerCase().includes(filters.equipment.toLowerCase());
      return nameMatch && categoryMatch && mainMuscleMatch && equipmentMatch;
    });
    setFilteredExercises(filtered);
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      movementCategory: '',
      mainMuscle: '',
      equipment: ''
    });
    setFilteredExercises(exercises);
  };

  if (loading) return <p>Cargando ejercicios...</p>;
  if (error) return <p style={{color: "red"}}>{error}</p>;
  if (filteredExercises.length === 0) return <p>No se encontraron ejercicios. ¿Has subido alguno?</p>;

  return (
    <div className="exercise-library">
      <h2>Biblioteca de Ejercicios</h2>
      <div className="filter-container">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          name="name"
          value={filters.name}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por categoría..."
          name="movementCategory"
          value={filters.movementCategory}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por músculo principal..."
          name="mainMuscle"
          value={filters.mainMuscle}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por equipamiento..."
          name="equipment"
          value={filters.equipment}
          onChange={handleFilterChange}
        />
        <div className="filter-buttons">
          <button onClick={applyFilters}>Aplicar Filtros</button>
          <button onClick={resetFilters}>Reiniciar Filtros</button>
        </div>
      </div>
      <div className="exercise-grid">
        {filteredExercises.map(ex => (
          <div key={ex.id} className="exercise-card">
            {ex.fileURL ? (
              <img src={ex.fileURL} alt={ex.name} className="exercise-image" />
            ) : (
              <div className="no-image">No hay imagen disponible</div>
            )}
            <h3>{ex.name}</h3>
            <p><strong>Músculo principal:</strong> {ex.mainMuscle}</p>
            {ex.secondaryMuscle && <p><strong>Músculo secundario:</strong> {ex.secondaryMuscle}</p>}
            <p><strong>Categoría:</strong> {ex.movementCategory}</p>
            <p><strong>Equipamiento:</strong> {ex.equipment}</p>
            <Link to={`/edit/${ex.id}`} className="edit-button">Editar</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseLibrary;