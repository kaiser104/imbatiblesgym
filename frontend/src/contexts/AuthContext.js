import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext();

// Make sure the export is correct
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Después de iniciar sesión, obtener el rol del usuario
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          // Si es la primera vez, asumimos que es super-administrador
          setUserRole('super-administrador');
        }
        return userCredential;
      });
  }

  function logout() {
    return signOut(auth);
  }

  // Asegúrate de que estás verificando el estado de autenticación al cargar la aplicación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      console.log("Estado de autenticación cambiado:", user ? "Usuario autenticado" : "No hay usuario");
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}