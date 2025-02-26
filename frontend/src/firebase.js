// src/firebase.js

// Importa las funciones necesarias desde el SDK de Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";  // Si deseas usar Storage

// Tu configuración de Firebase que obtuviste de la consola:
const firebaseConfig = {
  apiKey: "AIzaSyCHLCYjP74kM2X4v0HvlRyyCafcW3GH-eI",
  authDomain: "imbatiblesgym-7976f.firebaseapp.com",
  projectId: "imbatiblesgym-7976f",
  storageBucket: "imbatiblesgym-7976f.firebasestorage.app",
  messagingSenderId: "557069881698",
  appId: "1:557069881698:web:0f5a9cacda6c65c3a95c3b",
  measurementId: "G-25BH3E9FEW"
};

// Inicializa la aplicación Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Analytics (opcional, si lo usas)
const analytics = getAnalytics(app);

// Inicializa Storage para subir y gestionar archivos (si lo vas a usar)
const storage = getStorage(app);

// Exporta las instancias para usarlas en otros componentes
export { app, analytics, storage };
