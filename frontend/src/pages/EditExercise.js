// src/pages/EditExercise.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '../firebase';
import './EditExercise.css';

const db = getFirestore(app);

const EditExercise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exerciseData, setExerciseData] = useState({
    name: '',
    mainMuscle: '',
    secondaryMuscle: '',
    movementCategory: '',
    equipment: '',
    fileURL: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const docRef = doc(db, "exercises", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExerciseData(docSnap.data());
        } else {
          setError("Ejercicio no encontrado.");
        }
      } catch (err) {
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
      const docRef = doc(db, "exercises", id);
      await updateDoc(docRef, {
        name: exerciseData.name,
        mainMuscle: exerciseData.mainMuscle,
        secondaryMuscle: exerciseData.secondaryMuscle,
        movementCategory: exerciseData.movementCategory,
        equipment: exerciseData.equipment
      });
      setMessage("Ejercicio actualizado correctamente.");
      // Redirige a la biblioteca tras unos segundos
      setTimeout(() => {
        navigate("/library");
      }, 1500);
    } catch (err) {
      setError("Error al actualizar: " + err.message);
    }
  };

  if (loading) return <p>Cargando ejercicio...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="edit-exercise">
      <h2>Editar Ejercicio</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre del ejercicio:</label>
          <input
            type="text"
            name="name"
            value={exerciseData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Músculo principal:</label>
          <input
            type="text"
            name="mainMuscle"
            value={exerciseData.mainMuscle}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Músculo secundario (opcional):</label>
          <input
            type="text"
            name="secondaryMuscle"
            value={exerciseData.secondaryMuscle}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Categoría de movimiento:</label>
          <input
            type="text"
            name="movementCategory"
            value={exerciseData.movementCategory}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Equipamiento:</label>
          <input
            type="text"
            name="equipment"
            value={exerciseData.equipment}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Actualizar Ejercicio</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default EditExercise;
