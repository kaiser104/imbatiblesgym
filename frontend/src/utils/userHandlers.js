import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Determinar tipo de usuario
export const determineUserType = async (currentUser, setUserType, setGymId, loadActiveGymUsers, loadAllUsers) => {
  if (!currentUser) return;
  
  try {
    console.log("Determinando tipo de usuario para:", currentUser.uid);
    
    // Verificar si es gimnasio - primero por adminId
    const gymAdminQuery = query(
      collection(db, 'gimnasios'),
      where('adminId', '==', currentUser.uid)
    );
    const gymAdminSnapshot = await getDocs(gymAdminQuery);
    
    if (!gymAdminSnapshot.empty) {
      console.log("Usuario identificado como gimnasio (adminId)");
      setUserType('gimnasio');
      setGymId(currentUser.uid); // Usar el UID del usuario actual
      
      // Cargar usuarios activos del gimnasio
      await loadActiveGymUsers(currentUser.uid);
      return;
    }
    
    // Verificar si es gimnasio - por uid
    const gymUidQuery = query(
      collection(db, 'gimnasios'),
      where('uid', '==', currentUser.uid)
    );
    const gymUidSnapshot = await getDocs(gymUidQuery);
    
    if (!gymUidSnapshot.empty) {
      console.log("Usuario identificado como gimnasio (uid)");
      setUserType('gimnasio');
      setGymId(currentUser.uid); // Usar el UID del usuario actual
      
      // Cargar usuarios activos del gimnasio
      await loadActiveGymUsers(currentUser.uid);
      return;
    }
    
    // Verificar si es entrenador
    const trainerQuery = query(
      collection(db, 'entrenadores'),
      where('uid', '==', currentUser.uid)
    );
    const trainerSnapshot = await getDocs(trainerQuery);
    
    if (!trainerSnapshot.empty) {
      console.log("Usuario identificado como entrenador");
      setUserType('entrenador');
      // Cargar todos los usuarios
      await loadAllUsers();
      return;
    }
    
    // Verificar si es deportista
    const traineeQuery = query(
      collection(db, 'trainees'),
      where('uid', '==', currentUser.uid)
    );
    const traineeSnapshot = await getDocs(traineeQuery);
    
    if (!traineeSnapshot.empty) {
      console.log("Usuario identificado como deportista");
      setUserType('deportista');
      // Cargar todos los usuarios
      await loadAllUsers();
      return;
    }
    
    // Si no es ninguno de los anteriores, cargar todos los usuarios
    console.log("Usuario identificado como otro tipo");
    setUserType('usuario');
    await loadAllUsers();
    
  } catch (error) {
    console.error("Error al determinar tipo de usuario:", error);
  }
};

// Cargar usuarios activos del gimnasio
export const loadActiveGymUsers = async (gymUid, setUsers, setActiveUsers) => {
  try {
    console.log("Cargando usuarios para el gimnasio con UID:", gymUid);
    
    // Obtener todos los trainees
    const traineesSnapshot = await getDocs(collection(db, 'trainees'));
    const allUsers = traineesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log("Total de usuarios encontrados:", allUsers.length);
    
    // Filtrar usuarios que fueron registrados por este gimnasio
    const gymUsers = allUsers.filter(user => {
      // Verificar si el usuario tiene registradoPor y si el uid coincide con el del gimnasio
      if (user.registradoPor && user.registradoPor.uid === gymUid) {
        console.log("Usuario registrado por este gimnasio:", user.nombre || user.email);
        return true;
      }
      
      // También incluir usuarios que tienen gimnasioId igual al ID del gimnasio
      // (Esto es para compatibilidad con diferentes formas de registro)
      if (user.gimnasioId === gymUid) {
        console.log("Usuario con gimnasioId igual al UID del gimnasio:", user.nombre || user.email);
        return true;
      }
      
      return false;
    });
    
    console.log("Usuarios filtrados para este gimnasio:", gymUsers.length);
    
    if (gymUsers.length === 0) {
      console.log("No se encontraron usuarios para este gimnasio. Mostrando información de depuración:");
      
      // Mostrar información de depuración para los primeros 5 usuarios
      allUsers.slice(0, 5).forEach((user, index) => {
        console.log(`Usuario ${index + 1}:`, {
          id: user.id,
          nombre: user.nombre,
          email: user.email || user.correo,
          registradoPor: user.registradoPor ? {
            uid: user.registradoPor.uid,
            email: user.registradoPor.email
          } : 'No tiene',
          gimnasioId: user.gimnasioId || 'No tiene'
        });
      });
      
      // Buscar gimnasio por UID para verificar
      try {
        const gymQuery = query(collection(db, 'gimnasios'), where('uid', '==', gymUid));
        const gymSnapshot = await getDocs(gymQuery);
        
        if (!gymSnapshot.empty) {
          const gymData = gymSnapshot.docs[0].data();
          console.log("Datos del gimnasio encontrado:", {
            id: gymSnapshot.docs[0].id,
            uid: gymData.uid,
            adminId: gymData.adminId,
            nombre: gymData.nombre || gymData.name,
            email: gymData.email || gymData.correo
          });
        } else {
          console.log("No se encontró el gimnasio con UID:", gymUid);
        }
      } catch (error) {
        console.error("Error al buscar gimnasio:", error);
      }
    }
    
    setUsers(gymUsers);
    setActiveUsers(gymUsers);
    
  } catch (error) {
    console.error("Error al cargar usuarios del gimnasio:", error);
  }
};

// Cargar todos los usuarios
export const loadAllUsers = async (setUsers, setActiveUsers) => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'trainees'));
    const usersData = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsers(usersData);
    setActiveUsers(usersData);
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
  }
};

// Manejar selección de todos los usuarios
export const handleSelectAllUsers = (event, activeUsers, setSelectAllUsers, setSelectedUsers) => {
  if (event.target.checked) {
    setSelectAllUsers(true);
    setSelectedUsers(activeUsers.map(user => user.id));
  } else {
    setSelectAllUsers(false);
    setSelectedUsers([]);
  }
};

// Manejar selección de usuarios individuales
export const handleUserSelection = (event, userId, selectedUsers, setSelectedUsers, activeUsers, setSelectAllUsers) => {
  const selectedIndex = selectedUsers.indexOf(userId);
  let newSelected = [];

  if (selectedIndex === -1) {
    newSelected = [...selectedUsers, userId];
  } else {
    newSelected = selectedUsers.filter(id => id !== userId);
  }

  setSelectedUsers(newSelected);
  setSelectAllUsers(newSelected.length === activeUsers.length);
};