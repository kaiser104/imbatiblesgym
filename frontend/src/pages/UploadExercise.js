// src/components/UploadExercise.js
import React, { useState } from 'react';
import { storage } from '../firebase'; // Asegúrate de que firebase.js esté correctamente configurado
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const UploadExercise = () => {
  const [exerciseData, setExerciseData] = useState({
    name: '',
    mainMuscle: '',
    secondaryMuscle: '',
    movementCategory: '',
    equipment: ''
  });
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setExerciseData({
      ...exerciseData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    if(e.target.files[0]){
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if(!file) {
      setError("Debes seleccionar un archivo GIF");
      return;
    }
    
    // Define una referencia en Firebase Storage. Organiza por categoría.
    const storageRef = ref(storage, `exercises/${exerciseData.movementCategory}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Monitorea el estado de la subida
    uploadTask.on("state_changed",
      snapshot => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      error => {
        console.error(error);
        setError(error.message);
      },
      () => {
        // Una vez completada la subida, obtiene la URL pública del archivo
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url);
          // Combina la URL con los metadatos del ejercicio.
          // Aquí podrías hacer una solicitud POST a tu backend o guardar en Firestore.
          const exercise = {
            ...exerciseData,
            fileURL: url
          };
          console.log("Ejercicio subido:", exercise);
          // Reinicia el formulario si lo deseas
          setExerciseData({
            name: '',
            mainMuscle: '',
            secondaryMuscle: '',
            movementCategory: '',
            equipment: ''
          });
          setFile(null);
          setUploadProgress(0);
        });
      }
    );
  };

  return (
    <div>
      <h2>Subir Ejercicio</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre del ejercicio:</label>
          <input type="text" name="name" value={exerciseData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Músculo principal:</label>
          <input type="text" name="mainMuscle" value={exerciseData.mainMuscle} onChange={handleChange} required />
        </div>
        <div>
          <label>Músculo secundario (opcional):</label>
          <input type="text" name="secondaryMuscle" value={exerciseData.secondaryMuscle} onChange={handleChange} />
        </div>
        <div>
          <label>Categoría de movimiento:</label>
          <input type="text" name="movementCategory" value={exerciseData.movementCategory} onChange={handleChange} required />
        </div>
        <div>
          <label>Equipamiento:</label>
          <input type="text" name="equipment" value={exerciseData.equipment} onChange={handleChange} required />
        </div>
        <div>
          <label>Archivo GIF:</label>
          <input type="file" accept="image/gif" onChange={handleFileChange} required />
        </div>
        <button type="submit">Subir Ejercicio</button>
      </form>
      {uploadProgress > 0 && <p>Progreso: {uploadProgress}%</p>}
      {downloadURL && (
        <p>
          Archivo subido: <a href={downloadURL} target="_blank" rel="noopener noreferrer">Ver GIF</a>
        </p>
      )}
      {error && <p style={{color: "red"}}>{error}</p>}
    </div>
  );
};

export default UploadExercise;
