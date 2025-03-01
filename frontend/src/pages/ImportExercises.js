// frontend/src/pages/ImportExercises.js
import React, { useState, useEffect } from 'react';
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { addDoc, collection } from "firebase/firestore";
import { storage, db } from '../firebase';
import './ImportExercises.css';

const ImportExercises = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [files, setFiles] = useState([]); // Ahora almacenaremos objetos { fileRef, url }
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // Será un objeto { fileRef, url }
  const [metadata, setMetadata] = useState({
    name: '',
    mainMuscle: '',
    secondaryMuscle: '',
    movementCategory: '',
    equipment: ''
  });
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Listar categorías (subcarpetas) dentro de "exercises"
  useEffect(() => {
    const listCategories = async () => {
      try {
        console.log("Listando categorías (subcarpetas) en 'exercises'...");
        const exercisesRef = ref(storage, 'exercises');
        const result = await listAll(exercisesRef);
        console.log("Subcarpetas encontradas:", result.prefixes.length);
        setCategories(result.prefixes);
        setLoadingCategories(false);
      } catch (err) {
        console.error("Error al listar categorías:", err);
        setError("Error al listar categorías: " + err.message);
        setLoadingCategories(false);
      }
    };

    listCategories();
  }, []);

  // Listar archivos cuando se selecciona una categoría, obteniendo sus URLs para la vista previa
  const handleSelectCategory = async (categoryRef) => {
    setSelectedCategory(categoryRef);
    setLoadingFiles(true);
    setFiles([]);
    try {
      const result = await listAll(categoryRef);
      console.log("Archivos encontrados en la categoría:", result.items.length);
      // Obtener la URL de cada archivo
      const fileObjects = await Promise.all(
        result.items.map(async (fileRef) => {
          const url = await getDownloadURL(fileRef);
          return { fileRef, url };
        })
      );
      setFiles(fileObjects);
      setLoadingFiles(false);
    } catch (err) {
      console.error("Error al listar archivos de la categoría:", err);
      setError("Error al listar archivos de la categoría: " + err.message);
      setLoadingFiles(false);
    }
  };

  // Volver a la lista de categorías
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedFile(null);
    setError('');
    setMessage('');
  };

  // Al seleccionar un archivo para importar (recibe el objeto con fileRef y url)
  const handleSelectFile = async (fileObj) => {
    setSelectedFile(fileObj);
    try {
      console.log("URL del archivo obtenida:", fileObj.url);
      // Obtener la categoría del path: se espera que el path sea "exercises/Categoria/archivo.gif"
      const parts = fileObj.fileRef.fullPath.split('/');
      let category = '';
      if (parts.length >= 2) {
        category = parts[1];
      }
      // Limpiar el nombre del archivo para que sea legible
      const fileName = fileObj.fileRef.name.replace(/\.[^/.]+$/, "");
      const formattedName = fileName
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setMetadata({
        name: formattedName,
        mainMuscle: '',
        secondaryMuscle: '',
        movementCategory: category,
        equipment: ''
      });
    } catch (err) {
      console.error("Error al obtener URL del archivo:", err);
      setError("No se puede acceder al archivo. Verifique los permisos de Storage.");
    }
  };

  const handleMetadataChange = (e) => {
    setMetadata({
      ...metadata,
      [e.target.name]: e.target.value
    });
  };

  // Al enviar el formulario de importación
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImporting(true);
    setError('');
    setMessage('');
    if (!selectedFile) {
      setError("No se ha seleccionado un archivo.");
      setImporting(false);
      return;
    }
    try {
      // Ya tenemos la URL en selectedFile.url
      const exerciseData = {
        ...metadata,
        fileURL: selectedFile.url,
        createdAt: new Date()
      };
      await addDoc(collection(db, "exercises"), exerciseData);
      setMessage("Ejercicio importado y guardado correctamente.");
      // Actualizar la lista de archivos (opcional: quitar el archivo importado)
      setFiles(files.filter(obj => obj.fileRef.fullPath !== selectedFile.fileRef.fullPath));
      setSelectedFile(null);
      setImporting(false);
    } catch (err) {
      console.error("Error al importar ejercicio:", err);
      setError("Error al importar ejercicio: " + err.message);
      setImporting(false);
    }
  };

  // Vista de categorías
  const renderCategories = () => {
    if (categories.length === 0) {
      return (
        <div>
          <p>No se encontraron categorías en la carpeta 'exercises'.</p>
          <p>Asegúrate de haber subido ejercicios usando la opción "Subir Ejercicio".</p>
        </div>
      );
    }

    return (
      <div className="category-list">
        <h3>Selecciona una categoría de movimiento:</h3>
        {categories.map(categoryRef => {
          const categoryName = categoryRef.name || categoryRef.fullPath.split('/').pop();
          return (
            <div key={categoryRef.fullPath} className="category-item">
              <button onClick={() => handleSelectCategory(categoryRef)} className="category-button">
                {categoryName}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Vista de archivos dentro de una categoría (incluyendo previsualización)
  const renderFiles = () => {
    if (files.length === 0) {
      return (
        <div>
          <p>No se encontraron archivos en esta categoría.</p>
          <button onClick={handleBackToCategories} className="back-button">
            Volver a las categorías
          </button>
        </div>
      );
    }

    const categoryName = selectedCategory.name || selectedCategory.fullPath.split('/').pop();
    
    return (
      <div className="file-list">
        <h3>Archivos en la categoría: {categoryName}</h3>
        <button onClick={handleBackToCategories} className="back-button">
          Volver a las categorías
        </button>
        <div className="files-grid">
          {files.map(({ fileRef, url }) => (
            <div key={fileRef.fullPath} className="file-item">
              <img src={url} alt={fileRef.name} style={{ maxWidth: '100px' }} />
              <p>{fileRef.name}</p>
              <button onClick={() => handleSelectFile({ fileRef, url })} className="import-button">
                Importar este ejercicio
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Formulario de importación
  const renderImportForm = () => {
    return (
      <div className="import-form">
        <h3>Importar: {selectedFile.fileRef.name}</h3>
        <button onClick={() => setSelectedFile(null)} className="back-button">
          Volver a la lista de archivos
        </button>
        <form onSubmit={handleImportSubmit}>
          <div>
            <label>Nombre del ejercicio:</label>
            <input
              type="text"
              name="name"
              value={metadata.name}
              onChange={handleMetadataChange}
              required
            />
          </div>
          <div>
            <label>Músculo principal:</label>
            <input
              type="text"
              name="mainMuscle"
              value={metadata.mainMuscle}
              onChange={handleMetadataChange}
              required
            />
          </div>
          <div>
            <label>Músculo secundario (opcional):</label>
            <input
              type="text"
              name="secondaryMuscle"
              value={metadata.secondaryMuscle}
              onChange={handleMetadataChange}
            />
          </div>
          <div>
            <label>Categoría de movimiento:</label>
            <input
              type="text"
              name="movementCategory"
              value={metadata.movementCategory}
              onChange={handleMetadataChange}
              required
            />
          </div>
          <div>
            <label>Equipamiento:</label>
            <input
              type="text"
              name="equipment"
              value={metadata.equipment}
              onChange={handleMetadataChange}
              required
            />
          </div>
          <button type="submit" disabled={importing} className="submit-button">
            {importing ? "Importando..." : "Guardar Ejercicio"}
          </button>
        </form>
        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  };

  return (
    <div className="import-exercises">
      <h2>Importar Ejercicios desde Storage</h2>
      {loadingCategories ? (
        <p>Cargando categorías desde Storage...</p>
      ) : error && !selectedCategory && !selectedFile ? (
        <div>
          <p style={{ color: "red" }}>{error}</p>
          <p>Verifica las reglas de acceso a Firebase Storage.</p>
        </div>
      ) : selectedFile ? (
        renderImportForm()
      ) : selectedCategory ? (
        loadingFiles ? <p>Cargando archivos...</p> : renderFiles()
      ) : (
        renderCategories()
      )}
    </div>
  );
};

export default ImportExercises;
