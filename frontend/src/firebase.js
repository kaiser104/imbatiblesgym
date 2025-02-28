import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHLCYjP74kM2X4v0HvlRyyCafcW3GH-eI",
  authDomain: "imbatiblesgym-7976f.firebaseapp.com",
  projectId: "imbatiblesgym-7976f",
  storageBucket: "imbatiblesgym-7976f.firebasestorage.app",
  messagingSenderId: "557069881698",
  appId: "1:557069881698:web:0f5a9cacda6c65c3a95c3b",
  measurementId: "G-25BH3E9FEW"
};

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);