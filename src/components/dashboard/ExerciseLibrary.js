import React, { useEffect, useState } from "react";
import axios from "axios";

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState([]);
  const [editExercise, setEditExercise] = useState(null);
  const [updatedData, setUpdatedData] = useState({});

  // 📌 Obtener la lista de ejercicios
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/exercises/")
      .then((response) => setExercises(response.data))
      .catch((error) => console.error("Error al obtener ejercicios:", error));
  }, []);

  // 📌 Manejar los cambios en los campos del formulario de edición
  const handleEditChange = (e) => {
    setUpdatedData({ ...updatedData, [e.target.name]: e.target.value });
  };

  // 📌 Enviar la actualización al backend
  const handleEditSubmit = async (e, exerciseId) => {
    e.preventDefault();
    try {
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/update-exercise/${exerciseId}/`,
        updatedData,
        { headers: { Authorization: `Token ${localStorage.getItem("token")}` } }
      );
      setExercises((prev) =>
        prev.map((ex) => (ex.id === exerciseId ? response.data : ex))
      );
      setEditExercise(null);
    } catch (error) {
      console.error("Error al actualizar el ejercicio:", error);
    }
  };

  return (
    <div>
      <h1>Biblioteca de Ejercicios</h1>
      <div className="exercise-grid">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="exercise-card">
            {editExercise === exercise.id ? (
              <form onSubmit={(e) => handleEditSubmit(e, exercise.id)}>
                <input
                  type="text"
                  name="name"
                  defaultValue={exercise.name}
                  onChange={handleEditChange}
                />
                <input
                  type="text"
                  name="category"
                  defaultValue={exercise.category}
                  onChange={handleEditChange}
                />
                <input
                  type="text"
                  name="equipment"
                  defaultValue={exercise.equipment}
                  onChange={handleEditChange}
                />
                <input
                  type="text"
                  name="primary_muscle"
                  defaultValue={exercise.primary_muscle}
                  onChange={handleEditChange}
                />
                <input
                  type="text"
                  name="secondary_muscle"
                  defaultValue={exercise.secondary_muscle}
                  onChange={handleEditChange}
                />
                <button type="submit">Guardar</button>
                <button type="button" onClick={() => setEditExercise(null)}>Cancelar</button>
              </form>
            ) : (
              <>
                <img src={exercise.image_url} alt={exercise.name} />
                <h3>{exercise.name}</h3>
                <p>Categoría: {exercise.category}</p>
                <p>Equipo: {exercise.equipment}</p>
                <p>Músculo principal: {exercise.primary_muscle}</p>
                <p>Músculo secundario: {exercise.secondary_muscle}</p>
                <button onClick={() => setEditExercise(exercise.id)}>Editar</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseLibrary;
