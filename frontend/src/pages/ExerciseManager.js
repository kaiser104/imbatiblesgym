// frontend/src/pages/ExerciseManager.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { Link, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import './ExerciseManager.css';
import { Typography, Button } from '@mui/material'; // Añadir esta importación
import AddIcon from '@mui/icons-material/Add';

// --- UTILIDADES ---

// Diccionario de palabras clave para equipamiento
const equipmentKeywords = {
  "Bolsa de arena": ["\\bsandbag\\b", "\\bbag\\b"],
  "Trineo": ["\\bsled\\b"],
  "Cuerda de batida": ["\\bconditioning rope\\b", "\\brope\\b"],
  "Mancuernas": ["\\bdb\\b", "\\bdumbbell\\b"],
  "Bola de lacrosse": ["\\blacrosse\\b"],
  "Power band": ["\\bband\\b", "\\bresistance\\b"],
  "Rodillo de espuma": ["\\bfoam roll\\b"],
  "Barra": ["\\bbb\\b", "\\bbar\\b"],
  "Cuerda para saltar": ["\\bjump rope\\b"],
  "Suspensión": ["\\bsuspension\\b", "\\btrx\\b"],
  "Chaleco con peso": ["\\bweighted vest\\b", "\\bweighted pull\\b", "\\bweight vest\\b"],
  "Kettlebell": ["\\bkb\\b", "\\bkettlebell\\b"],
  "Disco": ["\\bplate\\b(?!ral)"],
  "Balón medicinal": ["\\bmb\\b", "\\bmedicine ball\\b"],
  "Pelota suiza": ["\\bsb\\b", "\\bswiss ball\\b"],
};

// Función para normalizar nombres (quita extensión, pasa a minúsculas y quita espacios extra)
const normalizeName = (name) => {
  return name.replace(/\.[^/.]+$/, "").toLowerCase().trim();
};

// Función para asignar equipamiento automáticamente según el nombre del archivo
const assignEquipment = (fileName) => {
  const lowerName = fileName.toLowerCase();
  for (const [equipment, patterns] of Object.entries(equipmentKeywords)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern);
      if (regex.test(lowerName)) {
        return equipment;
      }
    }
  }
  return "";
};

// Opciones para el menú desplegable de categoría de movimiento
const movementCategoryOptions = [
  "", // opción vacía (Todas)
  "None", // Opción "Ninguno" por defecto
  "Bent Leg Hip Extension",
  "Cardio",
  "Double Leg Push",
  "Core Stability",
  "Auxiliary",
  "Mobility",
  "Explosive",
  "Horizontal Push",
  "Straight Leg Hip Extension",
  "Downward Pull",
  "Upward Pull",
  "Upward Push",
  "Single Leg Push",
  "Horizontal Pull"
];

// Opciones para el menú desplegable de músculos
const muscleOptions = [
  "",
  "Pectorales",
  "Espalda",
  "Bíceps",
  "Tríceps",
  "Deltoides",
  "Deltoides posterior",
  "Glúteos",
  "Abdominales",
  "Lumbares",
  "Cuádriceps",
  "Isquiotibiales",
  "Pantorrilla",
  "Aductores",
  "Abductores",
  "Antebrazos"
];

// Opciones para el menú desplegable de equipamiento
const equipmentOptions = [
  "",
  "Trineo", 
  "Suspensión", 
  "Rodillo de espuma", 
  "Polea", 
  "Peso Corporal",
  "Fit ball", 
  "Mancuernas", 
  "Landmine", 
  "Kettlebell", 
  "Disco",
  "Cuerda de batida", 
  "Chaleco con peso", 
  "Bolsa de arena", 
  "Bola de lacrosse",
  "Barra", 
  "Power band", 
  "Balón medicinal", 
  "Máquinas", 
  "Bandas elásticas"
];

// --- FIN DE UTILIDADES ---

const ExerciseManager = () => {
  const navigate = useNavigate();
  // Estados para la Biblioteca (Firestore)
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [libraryError, setLibraryError] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    movementCategory: '',
    mainMuscle: '',
    equipment: ''
  });

  // Función para navegar a la página de subir ejercicio
  const handleNavigateToUpload = () => {
    navigate('/upload-exercise');
  };

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
        // No mostrar ejercicios inicialmente hasta que se apliquen filtros
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

  const resetFilters = () => {
    setFilters({
      name: '',
      movementCategory: '',
      mainMuscle: '',
      equipment: ''
    });
    // Al reiniciar filtros, no mostrar ejercicios
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

  // Listar archivos en la categoría seleccionada y filtrar los ya importados
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
      // Filtrar archivos: excluir aquellos cuyo nombre normalizado ya existe en Firestore
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

  // Al seleccionar un archivo individual para importar (abre el formulario)
  const handleSelectFile = (fileObj) => {
    setSelectedFile(fileObj);
    const parts = fileObj.fileRef.fullPath.split('/');
    const category = parts[1] || '';
    const fileName = fileObj.fileRef.name;
    const formattedName = fileName
      .replace(/\.[^/.]+$/, "")
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

  // Guardar un ejercicio importado individualmente
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
      // Quitar de la lista el archivo importado
      setFiles(files.filter(obj => obj.fileRef.fullPath !== selectedFile.fileRef.fullPath));
      setSelectedFile(null);
      setImporting(false);
    } catch (err) {
      console.error("Error al importar ejercicio:", err);
      setImportError("Error al importar ejercicio: " + err.message);
      setImporting(false);
    }
  };

  // --- NUEVA FUNCIÓN: Auto-importar TODOS los archivos de la categoría seleccionada ---
  const handleAutoImportCategory = async () => {
    setImporting(true);
    setImportError('');
    setImportMessage('');
    let importedCount = 0;
    for (const fileObj of files) {
      try {
        const url = await getDownloadURL(fileObj.fileRef);
        const parts = fileObj.fileRef.fullPath.split('/');
        const category = parts[1] || '';
        const fileName = fileObj.fileRef.name;
        const formattedName = fileName
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        const equipment = assignEquipment(fileName);
        const exerciseData = {
          name: formattedName,
          mainMuscle: '',
          secondaryMuscle: '',
          movementCategory: category,
          equipment: equipment,
          fileURL: url,
          createdAt: new Date()
        };
        await addDoc(collection(db, "exercises"), exerciseData);
        importedCount++;
      } catch (innerErr) {
        console.error("Error auto-importando " + fileObj.fileRef.name + ": " + innerErr.message);
      }
    }
    setImportMessage(`Auto-importación completada: ${importedCount} ejercicios importados.`);
    // Opcional: limpiar la lista de archivos tras la autoimportación
    setFiles([]);
    setImporting(false);
  };
  // --- FIN NUEVA FUNCIÓN ---

  // Renderizar la sección de Biblioteca (FireStore)
  // Modificar la parte donde se renderizan los filtros en la función renderLibrary
  const renderLibrary = () => {
    return (
      <div className="library-content">
        <h3>BIBLIOTECA DE EJERCICIOS</h3>
        
        <div className="filters-container">
          <div className="filter-item">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Search by name..."
              className="filter-input"
            />
          </div>
          
          <div className="filter-item">
            <label htmlFor="movementCategory">Movement Pattern</label>
            <select
              id="movementCategory"
              name="movementCategory"
              value={filters.movementCategory}
              onChange={handleFilterChange}
              className="filter-select"
            >
              {movementCategoryOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option === "" ? "All" : option === "None" ? "None" : option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="mainMuscle">Main Muscle</label>
            <select
              id="mainMuscle"
              name="mainMuscle"
              value={filters.mainMuscle}
              onChange={handleFilterChange}
              className="filter-select"
            >
              {muscleOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option === "" ? "All" : option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label htmlFor="equipment">Equipment</label>
            <select
              id="equipment"
              name="equipment"
              value={filters.equipment}
              onChange={handleFilterChange}
              className="filter-select"
            >
              {equipmentOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option === "" ? "All" : option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-buttons">
            <button onClick={applyFilters} className="apply-filters-button">
              Apply Filters
            </button>
            <button onClick={resetFilters} className="reset-filters-button">
              Reset Filters
            </button>
          </div>
        </div>
        
        {loadingExercises ? (
          <p>Cargando ejercicios...</p>
        ) : libraryError ? (
          <p style={{ color: "red" }}>{libraryError}</p>
        ) : filteredExercises.length === 0 ? (
          <p>Usa los filtros para buscar ejercicios en la biblioteca.</p>
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
  };

  // Renderizar la sección de Importación (Storage)
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
              <select
                name="mainMuscle"
                value={importMetadata.mainMuscle}
                onChange={handleImportMetadataChange}
                required
              >
                {muscleOptions.map(option => (
                  <option key={option} value={option}>{option || "Selecciona"}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Músculo secundario (opcional):</label>
              <select
                name="secondaryMuscle"
                value={importMetadata.secondaryMuscle}
                onChange={handleImportMetadataChange}
              >
                {muscleOptions.map(option => (
                  <option key={option} value={option}>{option || "Ninguno"}</option>
                ))}
              </select>
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
            {/* Botón para auto-importar todos los archivos de la categoría */}
            {files.length > 0 && (
              <button onClick={handleAutoImportCategory} disabled={importing} className="auto-import-button">
                {importing ? "Importando..." : "Auto-importar todos"}
              </button>
            )}
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
    <div className="exercise-manager-container">
      <div className="exercise-manager">
        <div className="exercise-manager-header">
          <Typography variant="h4" component="h2">Exercise Library</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleNavigateToUpload}
            className="add-exercise-button"
          >
            Add New Exercise
          </Button>
        </div>
        
        <div className="tabs">
          <button 
            className={activeTab === 'library' ? 'active' : ''} 
            onClick={() => setActiveTab('library')}
          >
            Library
          </button>
          <button 
            className={activeTab === 'import' ? 'active' : ''} 
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
        </div>
        
        {/* Render the content based on active tab */}
        {activeTab === 'library' ? renderLibrary() : renderImport()}
      </div>
    </div>
  );
};

export default ExerciseManager;
