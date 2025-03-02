const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Lista de palabras clave para asignar equipamiento automáticamente
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
  "Mancuerna rusa": ["\\bkb\\b", "\\bkettlebell\\b"],
  "Disco": ["\\bplate\\b(?!ral)"],
  "Balón medicinal": ["\\bmb\\b", "\\bmedicine ball\\b"],
  "Fit ball": ["\\bsb\\b", "\\bswiss ball\\b"]
};

// Función para normalizar el nombre: quita la extensión, convierte a minúsculas y reemplaza guiones o guiones bajos por espacios.
const normalizeName = (name) => {
  return name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[_-]/g, ' ').trim();
};

// Función para asignar equipamiento según el nombre del archivo
const assignEquipment = (fileName) => {
  const normalizedFileName = fileName.toLowerCase();
  for (const [equipment, patterns] of Object.entries(equipmentKeywords)) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern);
      if (regex.test(normalizedFileName)) {
        return equipment;
      }
    }
  }
  return ''; // Si no coincide con ninguna palabra clave, devuelve cadena vacía
};

// Función HTTP que puedes ejecutar una sola vez para importar todos los archivos
exports.importAllExercises = functions.runWith({
  timeoutSeconds: 540,  // 9 minutos (el máximo es 9 minutos para funciones HTTP)
  memory: '1GB'         // Más memoria para procesar muchos archivos
}).https.onRequest(async (req, res) => {
  try {
    const bucket = storage.bucket(); // Usa el bucket predeterminado
    const prefix = 'exercises/'; // Carpeta base donde están los ejercicios
    const [files] = await bucket.getFiles({ prefix });
    console.log(`Found ${files.length} files under ${prefix}`);
    
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Recorrer cada archivo
    for (const file of files) {
      try {
        // Solo procesar archivos que estén en una subcarpeta (estructura: "exercises/Categoria/archivo.gif")
        if (!file.name.includes('/', prefix.length)) {
          console.log(`Skipping file not in subcategory: ${file.name}`);
          skippedCount++;
          continue;
        }
        
        const parts = file.name.split('/');
        const category = parts[1]; // La subcarpeta es la categoría
        const fileName = parts[parts.length - 1]; // Nombre del archivo con extensión
        const normalizedFileName = normalizeName(fileName);
        
        // Verificar si ya existe un documento en Firestore para este ejercicio
        const querySnapshot = await db.collection('exercises')
          .where('normalizedName', '==', normalizedFileName)
          .get();
        
        if (!querySnapshot.empty) {
          console.log(`File ${fileName} already imported.`);
          skippedCount++;
          continue;
        }
        
        // Obtener una URL firmada para el archivo (válida por 10 años)
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2034'  // 10 años en el futuro
        });
        
        // Crear el documento en Firestore con los metadatos básicos
        const exerciseData = {
          name: fileName.replace(/\.[^/.]+$/, ""), // Nombre sin extensión
          normalizedName: normalizedFileName,
          movementCategory: category, // La categoría es la subcarpeta
          fileURL: url,
          mainMuscle: '',       // Queda en blanco para luego editar
          secondaryMuscle: '',  // Queda en blanco para luego editar
          equipment: assignEquipment(fileName),  // Equipamiento asignado automáticamente
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('exercises').add(exerciseData);
        console.log(`Imported exercise: ${exerciseData.name} with equipment: ${exerciseData.equipment}`);
        importedCount++;
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        errorCount++;
        errors.push({ file: file.name, error: fileError.message });
      }
    }
    
    // Preparar respuesta con estadísticas
    const result = {
      totalFiles: files.length,
      imported: importedCount,
      skipped: skippedCount,
      errors: errorCount,
      errorDetails: errors
    };
    
    res.status(200).send(result);
  } catch (error) {
    console.error("Error in importAllExercises:", error);
    res.status(500).send({ error: error.message });
  }
});