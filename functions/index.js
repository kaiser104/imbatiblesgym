// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
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
  "Kettlebell": ["\\bkb\\b", "\\bkettlebell\\b"],
  "Disco": ["\\bplate\\b(?!ral)"],
  "Balón medicinal": ["\\bmb\\b", "\\bmedicine ball\\b"],
  "Pelota suiza": ["\\bsb\\b", "\\bswiss ball\\b"],
};

// Función para normalizar el nombre: quita la extensión, convierte a minúsculas y reemplaza guiones o guiones bajos por espacios.
const normalizeName = (name) => {
  return name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[_-]/g, " ").trim();
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
  return ""; // Si no coincide con ninguna palabra clave, devuelve cadena vacía
};

// Función HTTP para autoimportar ejercicios (ejecútala manualmente una vez)
exports.autoImportExercises = functions.https.onRequest(async (req, res) => {
  try {
    const bucket = storage.bucket(); // Usa el bucket predeterminado
    const prefix = "exercises/"; // Carpeta base en Storage
    const [files] = await bucket.getFiles({prefix});
    console.log(`Found ${files.length} files under ${prefix}`);

    let importedCount = 0;

    // Recorrer cada archivo
    for (const file of files) {
      // Solo procesar archivos que estén en una subcarpeta (estructura: "exercises/Categoria/archivo.gif")
      if (!file.name.includes("/", prefix.length)) continue;

      const parts = file.name.split("/");
      const category = parts[1]; // La subcarpeta es la categoría
      const fileName = parts.pop(); // Nombre del archivo con extensión
      const normalizedFileName = normalizeName(fileName);

      // Verificar si ya existe un documento en Firestore para este ejercicio
      const querySnapshot = await db.collection("exercises").where("normalizedName", "==", normalizedFileName).get();
      if (!querySnapshot.empty) {
        console.log(`File ${fileName} already imported.`);
        continue;
      }

      // Obtener una URL firmada para el archivo (válida hasta una fecha lejana)
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      });

      // Crear el documento en Firestore con los metadatos básicos y asignar equipamiento automáticamente
      const exerciseData = {
        name: fileName.replace(/\.[^/.]+$/, ""), // Nombre sin extensión
        normalizedName: normalizedFileName,
        movementCategory: category, // La categoría es la subcarpeta
        fileURL: url,
        mainMuscle: "", // Queda en blanco para luego editar manualmente
        secondaryMuscle: "", // Queda en blanco para luego editar manualmente
        equipment: assignEquipment(fileName), // Equipamiento asignado automáticamente
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("exercises").add(exerciseData);
      console.log(`Imported exercise: ${exerciseData.name} with equipment: ${exerciseData.equipment}`);
      importedCount++;
    }

    res.status(200).send(`Importación completada. Se importaron ${importedCount} ejercicios.`);
  } catch (error) {
    console.error("Error in autoImportExercises:", error);
    res.status(500).send("Error en la importación: " + error.message);
  }
});

// Versión simplificada para pruebas
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.status(200).send("¡Hola mundo desde Firebase Functions!");
});
