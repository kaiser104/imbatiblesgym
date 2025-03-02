// frontend/src/pages/ExerciseManager.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { Link } from 'react-router-dom';
import { db, storage } from '../firebase';
import './ExerciseManager.css';

// Función para normalizar nombres (quita extensión, pasa a minúsculas y reemplaza _ y - por espacios)
const normalizeName = (name) => {
  return name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[_-]/g, ' ').trim();
};

const ExerciseManager = () => {
  // Estados para la Biblioteca (Firestore)
  const [exercises, setExercises] = useState([]);
  // Inicialmente, la lista filtrada se deja vacía hasta que se aplique un filtro.
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [libraryError, setLibraryError] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    movementCategory: '',
    mainMuscle: '',
    equipment: ''
  });

  // Estados para la Importación (Storage)
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [files, setFiles] = useState([]); // Arreglo de objetos { fileRef, url }
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); // Objeto { fileRef, url }
  const [importMetadata, setImportMetadata] = useState({
    name: '',
    mainMuscle: '',
    secondaryMuscle: '',
    movementCategory: '',
    equipment: ''
  });
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');

  // Control de pestañas: "library" o "import"
  const [activeTab, setActiveTab] = useState('library');

  // Obtener ejercicios desde Firestore (para la Biblioteca)
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "exercises"));
        const exerciseList = [];
        querySnapshot.forEach((doc) => {
          exerciseList.push({ id: doc.id, ...doc.data() });
        });
        setExercises(exerciseList);
        // Inicialmente, no se muestran ejercicios hasta que se apliquen filtros
        setFilteredExercises([]);
        setLoadingExercises(false);
      } catch (err) {
        console.error("Error fetching exercises:", err);
        setLibraryError("Error al obtener ejercicios: " + err.message);
        setLoadingExercises(false);
      }
    };
    fetchExercises();
  }, []);

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

  // Al reiniciar, vaciar filtros y la lista (para no mostrar ejercicios por defecto)
  const resetFilters = () => {
    setFilters({
      name: '',
      movementCategory: '',
      mainMuscle: '',
      equipment: ''
    });
    setFilteredExercises([]);
  };

  // Listar categorías (subcarpetas) en Storage, dentro de "exercises"
  useEffect(() => {
    const listCategories = async () => {
      try {
        const exercisesRef = ref(storage, 'exercises');
        const result = await listAll(exercisesRef);
        setCategories(result.prefixes);
        setLoadingCategories(false);
      } catch (err) {
        console.error("Error al listar categorías:", err);
        setImportError("Error al listar categorías: " + err.message);
        setLoadingCategories(false);
      }
    };
    listCategories();
  }, []);

  // Listar archivos en una categoría seleccionada y filtrar los ya importados
  const handleSelectCategory = async (categoryRef) => {
    setSelectedCategory(categoryRef);
    setLoadingFiles(true);
    setFiles([]);
    try {
      const result = await listAll(categoryRef);
      const fileObjects = await Promise.all(
        result.items.map(async (fileRef) => {
          const url = await getDownloadURL(fileRef);
          return { fileRef, url };
        })
      );
      // Filtrar archivos: excluir aquellos cuyo nombre (normalizado) ya existe en Firestore
      const importedNames = exercises.map(ex => normalizeName(ex.name || ''));
      const filteredFiles = fileObjects.filter(obj => {
        const normalizedFileName = normalizeName(obj.fileRef.name);
        return !importedNames.includes(normalizedFileName);
      });
      setFiles(filteredFiles);
      setLoadingFiles(false);
    } catch (err) {
      console.error("Error al listar archivos de la categoría:", err);
      setImportError("Error al listar archivos de la categoría: " + err.message);
      setLoadingFiles(false);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedFile(null);
    setImportError('');
    setImportMessage('');
  };

  // Al seleccionar un archivo, prellenar metadatos usando el nombre y la ruta
  const handleSelectFile = (fileObj) => {
    setSelectedFile(fileObj);
    const parts = fileObj.fileRef.fullPath.split('/');
    let category = '';
    if (parts.length >= 2) {
      category = parts[1];
    }
    const fileName = fileObj.fileRef.name.replace(/\.[^/.]+$/, "");
    const formattedName = fileName
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setImportMetadata({
      name: formattedName,
      mainMuscle: '',
      secondaryMuscle: '',
      movementCategory: category,
      equipment: ''
    });
  };

  const handleImportMetadataChange = (e) => {
    setImportMetadata({
      ...importMetadata,
      [e.target.name]: e.target.value
    });
  };

  // Guardar ejercicio importado en Firestore
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImporting(true);
    setImportError('');
    setImportMessage('');
    if (!selectedFile) {
      setImportError("No se ha seleccionado un archivo.");
      setImporting(false);
      return;
    }
    try {
      const url = await getDownloadURL(selectedFile.fileRef);
      const exerciseData = {
        ...importMetadata,
        fileURL: url,
        createdAt: new Date()
      };
      await addDoc(collection(db, "exercises"), exerciseData);
      setImportMessage("Ejercicio importado y guardado correctamente.");
      // Opcional: quitar de la lista el archivo importado
      setFiles(files.filter(obj => obj.fileRef.fullPath !== selectedFile.fileRef.fullPath));
      setSelectedFile(null);
      setImporting(false);
    } catch (err) {
      console.error("Error al importar ejercicio:", err);
      setImportError("Error al importar ejercicio: " + err.message);
      setImporting(false);
    }
  };

  // Renderizar la sección de Biblioteca (mostrando ejercicios solo cuando se apliquen filtros)
  const renderLibrary = () => (
    <div className="library-section">
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
      {loadingExercises ? (
        <p>Cargando ejercicios...</p>
      ) : libraryError ? (
        <p style={{ color: "red" }}>{libraryError}</p>
      ) : filteredExercises.length === 0 ? (
        <p>No se han aplicado filtros.</p>
      ) : (
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
      )}
    </div>
  );

  // Renderizar la sección de Importación (como en la versión anterior)
  const renderImport = () => (
    <div className="import-section">
      <h2>Importar Ejercicios desde Storage</h2>
      {loadingCategories ? (
        <p>Cargando categorías desde Storage...</p>
      ) : importError && !selectedCategory && !selectedFile ? (
        <div>
          <p style={{ color: "red" }}>{importError}</p>
          <p>Verifica las reglas de acceso a Firebase Storage.</p>
        </div>
      ) : selectedFile ? (
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
                value={importMetadata.name}
                onChange={handleImportMetadataChange}
                required
              />
            </div>
            <div>
              <label>Músculo principal:</label>
              <input
                type="text"
                name="mainMuscle"
                value={importMetadata.mainMuscle}
                onChange={handleImportMetadataChange}
                required
              />
            </div>
            <div>
              <label>Músculo secundario (opcional):</label>
              <input
                type="text"
                name="secondaryMuscle"
                value={importMetadata.secondaryMuscle}
                onChange={handleImportMetadataChange}
              />
            </div>
            <div>
              <label>Categoría de movimiento:</label>
              <input
                type="text"
                name="movementCategory"
                value={importMetadata.movementCategory}
                onChange={handleImportMetadataChange}
                required
              />
            </div>
            <div>
              <label>Equipamiento:</label>
              <input
                type="text"
                name="equipment"
                value={importMetadata.equipment}
                onChange={handleImportMetadataChange}
                required
              />
            </div>
            <button type="submit" disabled={importing} className="submit-button">
              {importing ? "Importando..." : "Guardar Ejercicio"}
            </button>
          </form>
          {importMessage && <p style={{ color: "green" }}>{importMessage}</p>}
          {importError && <p style={{ color: "red" }}>{importError}</p>}
        </div>
      ) : selectedCategory ? (
        loadingFiles ? (
          <p>Cargando archivos...</p>
        ) : (
          <div className="file-list">
            <h3>
              Archivos en la categoría: {selectedCategory.name || selectedCategory.fullPath.split('/').pop()}
            </h3>
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
        )
      ) : (
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
      )}
    </div>
  );

  return (
    <div className="exercise-manager">
      <div className="tabs">
        <button className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>
          Biblioteca
        </button>
        <button className={activeTab === 'import' ? 'active' : ''} onClick={() => setActiveTab('import')}>
          Importar Ejercicios
        </button>
      </div>
      {activeTab === 'library' ? renderLibrary() : renderImport()}
    </div>
  );
};

export default ExerciseManager;
