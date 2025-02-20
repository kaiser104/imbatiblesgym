import React, { useState, useEffect } from "react";
import axios from "axios";

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState([]);
  const [video, setVideo] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    equipment: "",
    primary_muscle: "",
    secondary_muscle: "",
  });

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/exercises/")
      .then(response => setExercises(response.data))
      .catch(error => console.error("Error al obtener ejercicios:", error));
  }, []);

  const handleFileChange = (e) => {
    setVideo(e.target.files[0]);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video) return alert("Por favor selecciona un video.");

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append("video", video);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/upload-exercise/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Ejercicio subido exitosamente!");
      setExercises([...exercises, response.data]);
    } catch (error) {
      alert("Error al subir ejercicio");
    }
  };

  return (
    <div>
      <h1>Biblioteca de Ejercicios</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Nombre del ejercicio" onChange={handleInputChange} required />
        <input type="text" name="category" placeholder="Categoría" onChange={handleInputChange} required />
        <input type="text" name="equipment" placeholder="Equipamiento" onChange={handleInputChange} required />
        <input type="text" name="primary_muscle" placeholder="Músculo Principal" onChange={handleInputChange} required />
        <input type="text" name="secondary_muscle" placeholder="Músculo Secundario (Opcional)" onChange={handleInputChange} />
        <input type="file" accept="video/*" onChange={handleFileChange} required />
        <button type="submit">Subir Ejercicio</button>
      </form>

      <h2>Lista de Ejercicios</h2>
      <ul>
        {exercises.map(exercise => (
          <li key={exercise.id}>
            <h3>{exercise.name}</h3>
            <p>Categoría: {exercise.category}</p>
            <p>Equipamiento: {exercise.equipment}</p>
            <p>Músculo Principal: {exercise.primary_muscle}</p>
            <img src={`http://127.0.0.1:8000/media/${exercise.gif}`} alt={exercise.name} width="200" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExerciseLibrary;
