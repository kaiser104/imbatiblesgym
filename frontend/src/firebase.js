// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCHLCYjP74kM2X4v0HvlRyyCafcW3GH-eI",
  authDomain: "imbatiblesgym-7976f.firebaseapp.com",
  projectId: "imbatiblesgym-7976f",
  storageBucket: "imbatiblesgym-7976f.firebasestorage.app",
  messagingSenderId: "557069881698",
  appId: "1:557069881698:web:0f5a9cacda6c65c3a95c3b",
  measurementId: "G-25BH3E9FEW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, db, storage, analytics };

// Añade esta línea después de inicializar la app
export const auth = getAuth(app);
