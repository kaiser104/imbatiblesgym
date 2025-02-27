// src/pages/UploadExercise.js
import React, { useState } from 'react';
import { storage } from '../firebase'; // Asegúrate de que firebase.js exporte la instancia 'storage' y 'app'
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from '../firebase';

const db = getFirestore(app);

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
  const [message, setMessage] = useState('');

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
    setMessage('');
    if(!file) {
      setError("Debes seleccionar un archivo GIF");
      return;
    }
    
    // Define la referencia en Firebase Storage, organizando por categoría
    const storageRef = ref(storage, `exercises/${exerciseData.movementCategory}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Monitorea la subida
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
        // Cuando la subida se completa, obtiene la URL pública
        getDownloadURL(uploadTask.snapshot.ref).then(async (url) => {
          setDownloadURL(url);
          // Prepara el objeto ejercicio con los metadatos y la URL del archivo
          const exercise = {
            ...exerciseData,
            fileURL: url,
            createdAt: new Date()
          };
          try {
            // Guarda el documento en Firestore, en la colección "exercises"
            await addDoc(collection(db, "exercises"), exercise);
            setMessage("Ejercicio subido y guardado correctamente.");
            // Reinicia el formulario
            setExerciseData({
              name: '',
              mainMuscle: '',
              secondaryMuscle: '',
              movementCategory: '',
              equipment: ''
            });
            setFile(null);
            setUploadProgress(0);
          } catch (err) {
            console.error("Error al guardar en Firestore:", err);
            setError("Error al guardar el ejercicio: " + err.message);
          }
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
      {message && <p style={{color: "green"}}>{message}</p>}
      {error && <p style={{color: "red"}}>{error}</p>}
    </div>
  );
};

export default UploadExercise;
