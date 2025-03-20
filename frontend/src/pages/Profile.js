import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Avatar, 
  Button, 
  Tabs, 
  Tab, 
  IconButton
} from '@mui/material';
import { 
  Edit, 
  Save, 
  Cancel
} from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Profile.css';

// Importar componentes
import PersonalInfo from '../components/profile/PersonalInfo';
import RoomManagement from '../components/profile/RoomManagement';
import ScheduleManagement from '../components/profile/ScheduleManagement';
import ReservationList from '../components/profile/ReservationList';
import { RoomDialog, ScheduleDialog } from '../components/profile/ProfileDialogs';

const Profile = () => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [openRoomDialog, setOpenRoomDialog] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    capacity: '',
    description: '',
    equipment: [],
    currentEquipment: ''
  });
  
  const [newSchedule, setNewSchedule] = useState({
    days: [],
    startTime: '',
    duration: 60,
    capacity: '',
    unlimitedCapacity: false,
    description: '',
    location: 'sede',
    travelTime: 15
  });
  
  const [editingRoom, setEditingRoom] = useState(null);
  const [editRoomData, setEditRoomData] = useState({
    name: '',
    capacity: '',
    description: '',
    equipment: [],
    currentEquipment: ''
  });

  // Cargar datos del perfil
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;

      try {
        // Intentar encontrar al usuario en las diferentes colecciones
        const collections = ['trainees', 'entrenadores', 'gimnasios'];
        let userData = null;
        let type = null;

        for (const collectionName of collections) {
          // Modificar esta parte para buscar tanto por uid como por adminId para gimnasios
          if (collectionName === 'gimnasios') {
            // Primero intentar con adminId
            const qAdmin = query(collection(db, collectionName), where("adminId", "==", currentUser.uid));
            const querySnapshotAdmin = await getDocs(qAdmin);
            
            if (!querySnapshotAdmin.empty) {
              userData = { id: querySnapshotAdmin.docs[0].id, ...querySnapshotAdmin.docs[0].data() };
              type = 'gimnasio';
              break;
            }
            
            // Si no se encuentra, intentar con uid
            const qUid = query(collection(db, collectionName), where("uid", "==", currentUser.uid));
            const querySnapshotUid = await getDocs(qUid);
            
            if (!querySnapshotUid.empty) {
              userData = { id: querySnapshotUid.docs[0].id, ...querySnapshotUid.docs[0].data() };
              type = 'gimnasio';
              break;
            }
          } else {
            // Para otras colecciones, buscar normalmente por uid
            const q = query(collection(db, collectionName), where("uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              userData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
              type = collectionName === 'trainees' ? 'deportista' : 'entrenador';
              break;
            }
          }
        }

        // Si aún no se encuentra, buscar por correo electrónico
        if (!userData && currentUser.email) {
          for (const collectionName of collections) {
            const qEmail = query(collection(db, collectionName), where("email", "==", currentUser.email));
            const querySnapshotEmail = await getDocs(qEmail);
            
            if (!querySnapshotEmail.empty) {
              userData = { id: querySnapshotEmail.docs[0].id, ...querySnapshotEmail.docs[0].data() };
              type = collectionName === 'trainees' ? 'deportista' : 
                     collectionName === 'entrenadores' ? 'entrenador' : 'gimnasio';
              break;
            }
            
            // También intentar con campo "correo" si existe
            const qCorreo = query(collection(db, collectionName), where("correo", "==", currentUser.email));
            const querySnapshotCorreo = await getDocs(qCorreo);
            
            if (!querySnapshotCorreo.empty) {
              userData = { id: querySnapshotCorreo.docs[0].id, ...querySnapshotCorreo.docs[0].data() };
              type = collectionName === 'trainees' ? 'deportista' : 
                     collectionName === 'entrenadores' ? 'entrenador' : 'gimnasio';
              break;
            }
          }
        }

        if (userData) {
          console.log("Perfil encontrado:", userData, "Tipo:", type);
          setUserProfile(userData);
          setUserType(type);
        } else {
          console.log("No se encontró perfil para el usuario:", currentUser.uid, currentUser.email);
        }
      } catch (error) {
        console.error("Error al cargar el perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Fetch rooms for gyms
  useEffect(() => {
    const fetchRooms = async () => {
      if (userType === 'gimnasio' && userProfile) {
        try {
          const roomsQuery = query(collection(db, "salas"), where("gymId", "==", userProfile.id));
          const roomsSnapshot = await getDocs(roomsQuery);
          const roomsList = roomsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setRooms(roomsList);
        } catch (error) {
          console.error("Error al cargar las salas:", error);
        }
      }
    };
  
    if (userProfile && userType === 'gimnasio') {
      fetchRooms();
    }
  }, [userProfile, userType]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserProfile({
      ...userProfile,
      [name]: value
    });
  };

  const handleSaveProfile = async () => {
    try {
      const collectionName = userType === 'deportista' ? 'trainees' : 
                            userType === 'entrenador' ? 'entrenadores' : 'gimnasios';
      
      await updateDoc(doc(db, collectionName, userProfile.id), userProfile);
      setEditing(false);
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Create a reference to the storage location
      const storageRef = ref(storage, `profile_photos/${userProfile.id}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const photoURL = await getDownloadURL(storageRef);
      
      // Update the user profile with the new photo URL
      const collectionName = userType === 'deportista' ? 'trainees' : 
                            userType === 'entrenador' ? 'entrenadores' : 'gimnasios';
      
      await updateDoc(doc(db, collectionName, userProfile.id), {
        photoURL: photoURL
      });
      
      // Update the local state
      setUserProfile({
        ...userProfile,
        photoURL: photoURL
      });
      
    } catch (error) {
      console.error("Error al subir la foto de perfil:", error);
    }
  };

  // Schedule management functions
  const handleOpenScheduleDialog = () => {
    setOpenScheduleDialog(true);
  };

  const handleCloseScheduleDialog = () => {
    setOpenScheduleDialog(false);
    setNewSchedule({
      days: [],
      startTime: '',
      duration: 60,
      capacity: '',
      unlimitedCapacity: false,
      description: '',
      location: 'sede',
      travelTime: 15
    });
  };

  const handleScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule({
      ...newSchedule,
      [name]: value
    });
  };

  const handleAddSchedule = async () => {
    try {
      const collectionName = userType === 'entrenador' ? 'horarios_entrenadores' : 'horarios_gimnasios';
      
      // Calcular la hora de finalización basada en la hora de inicio y la duración
      const [hours, minutes] = newSchedule.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + parseInt(newSchedule.duration));
      
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Crear un horario para cada día seleccionado
      const promises = newSchedule.days.map(day => {
        return addDoc(collection(db, collectionName), {
          day,
          startTime: newSchedule.startTime,
          endTime,
          duration: parseInt(newSchedule.duration),
          capacity: newSchedule.unlimitedCapacity ? 'unlimited' : parseInt(newSchedule.capacity),
          description: newSchedule.description,
          userId: userProfile.id,
          userType: userType,
          createdAt: new Date(),
          // Campos adicionales para entrenadores
          ...(userType === 'entrenador' && {
            location: newSchedule.location,
            travelTime: parseInt(newSchedule.travelTime)
          })
        });
      });
      
      await Promise.all(promises);
      
      handleCloseScheduleDialog();
      // Aquí podrías recargar los horarios si los estás mostrando
    } catch (error) {
      console.error("Error al agregar horario:", error);
    }
  };

  // Room management functions
  const handleOpenRoomDialog = () => {
    setOpenRoomDialog(true);
  };
  
  const handleCloseRoomDialog = () => {
    setOpenRoomDialog(false);
    setNewRoom({
      name: '',
      capacity: '',
      description: '',
      equipment: [],
      currentEquipment: ''
    });
    setEditingRoom(null);
    setEditRoomData({
      name: '',
      capacity: '',
      description: '',
      equipment: [],
      currentEquipment: ''
    });
  };
  
  const handleRoomInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoom({
      ...newRoom,
      [name]: value
    });
  };
  
  const handleAddEquipment = () => {
    if (newRoom.currentEquipment && !newRoom.equipment.includes(newRoom.currentEquipment)) {
      setNewRoom({
        ...newRoom,
        equipment: [...newRoom.equipment, newRoom.currentEquipment],
        currentEquipment: ''
      });
    }
  };
  
  const handleRemoveEquipment = (item) => {
    setNewRoom({
      ...newRoom,
      equipment: newRoom.equipment.filter(eq => eq !== item)
    });
  };
  
  const handleAddRoom = async () => {
    try {
      const roomData = {
        name: newRoom.name,
        capacity: parseInt(newRoom.capacity),
        description: newRoom.description,
        equipment: newRoom.equipment,
        gymId: userProfile.id,
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, "salas"), roomData);
      setRooms([...rooms, { id: docRef.id, ...roomData }]);
      handleCloseRoomDialog();
    } catch (error) {
      console.error("Error al agregar sala:", error);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room.id);
    setEditRoomData({
      name: room.name,
      capacity: room.capacity,
      description: room.description || '',
      equipment: room.equipment || [],
      currentEquipment: ''
    });
    handleOpenRoomDialog();
  };
  
  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta sala?')) {
      try {
        await deleteDoc(doc(db, "salas", roomId));
        setRooms(rooms.filter(room => room.id !== roomId));
      } catch (error) {
        console.error("Error al eliminar la sala:", error);
      }
    }
  };
  
  const handleUpdateRoom = async () => {
    try {
      const roomData = {
        name: editRoomData.name,
        capacity: parseInt(editRoomData.capacity),
        description: editRoomData.description,
        equipment: editRoomData.equipment,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, "salas", editingRoom), roomData);
      
      // Update the rooms list
      setRooms(rooms.map(room => 
        room.id === editingRoom 
          ? { ...room, ...roomData } 
          : room
      ));
      
      handleCloseRoomDialog();
    } catch (error) {
      console.error("Error al actualizar la sala:", error);
    }
  };

  if (loading) {
    return <Box className="loading-container"><Typography>Cargando perfil...</Typography></Box>;
  }
  
  if (!userProfile) {
    return (
      <Container className="profile-container">
        <Paper elevation={3} className="profile-paper">
          <Box className="profile-not-found">
            <Typography variant="h5" gutterBottom>
              Perfil no encontrado
            </Typography>
            <Typography variant="body1">
              No se encontró información de perfil para este usuario. 
              Si eres un nuevo usuario, por favor contacta al administrador.
            </Typography>
            <Typography variant="body2" color="text.secondary" className="profile-user-email">
              Usuario: {currentUser?.email}
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container className="profile-container">
      <Paper elevation={3} className="profile-paper">
        <Box className="profile-box">
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} className="profile-user-info">
              <Box className="profile-avatar-container">
                <Avatar 
                  src={userProfile.photoURL || ''} 
                  alt={userProfile.nombre || currentUser.email}
                  className="profile-avatar"
                />
                <label htmlFor="profile-photo-upload">
                  <input
                    accept="image/*"
                    id="profile-photo-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleProfilePhotoUpload}
                  />
                  <IconButton 
                    component="span" 
                    className="profile-avatar-edit-button"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </label>
              </Box>
              <Typography variant="h5" gutterBottom>
                {userProfile.nombre || currentUser.email}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {userType === 'deportista' ? 'Deportista' : 
                 userType === 'entrenador' ? 'Entrenador' : 'Gimnasio'}
              </Typography>
              
              {!editing ? (
                <Button 
                  variant="contained" 
                  startIcon={<Edit />}
                  onClick={handleEditToggle}
                  className="profile-edit-button"
                >
                  Editar Perfil
                </Button>
              ) : (
                <Box className="profile-edit-buttons">
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<Save />}
                    onClick={handleSaveProfile}
                  >
                    Guardar
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Cancel />}
                    onClick={handleEditToggle}
                  >
                    Cancelar
                  </Button>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box className="profile-tabs-container">
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Información Personal" />
                  {(userType === 'entrenador' || userType === 'gimnasio') && (
                    <Tab label="Horarios" />
                  )}
                  {userType === 'gimnasio' && (
                    <Tab label="Salas" />
                  )}
                  {userType === 'deportista' && (
                    <Tab label="Mis Reservas" />
                  )}
                </Tabs>
              </Box>
              
              {/* Tab de Información Personal */}
              {tabValue === 0 && (
                <PersonalInfo 
                  userProfile={userProfile}
                  currentUser={currentUser}
                  userType={userType}
                  editing={editing}
                  handleInputChange={handleInputChange}
                />
              )}
              
              {/* Tab de Horarios */}
              {tabValue === 1 && (userType === 'entrenador' || userType === 'gimnasio') && (
                <ScheduleManagement 
                  handleOpenScheduleDialog={handleOpenScheduleDialog}
                />
              )}
              
              {/* Tab de Salas para gimnasios */}
              {tabValue === 2 && userType === 'gimnasio' && (
                <RoomManagement 
                  rooms={rooms}
                  handleOpenRoomDialog={handleOpenRoomDialog}
                  handleEditRoom={handleEditRoom}
                  handleDeleteRoom={handleDeleteRoom}
                />
              )}
              
              {/* Tab de Reservas para deportistas */}
              {tabValue === 1 && userType === 'deportista' && (
                <ReservationList />
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Diálogo para agregar/editar sala */}
      <RoomDialog 
        open={openRoomDialog}
        onClose={handleCloseRoomDialog}
        editingRoom={editingRoom}
        editRoomData={editRoomData}
        newRoom={newRoom}
        handleRoomInputChange={handleRoomInputChange}
        handleAddEquipment={handleAddEquipment}
        handleRemoveEquipment={handleRemoveEquipment}
        handleAddRoom={handleAddRoom}
        handleUpdateRoom={handleUpdateRoom}
        setEditRoomData={setEditRoomData}
        setNewRoom={setNewRoom}
      />
      
      {/* Diálogo para agregar horario */}
      <ScheduleDialog 
        open={openScheduleDialog}
        onClose={handleCloseScheduleDialog}
        newSchedule={newSchedule}
        setNewSchedule={setNewSchedule}
        handleScheduleInputChange={handleScheduleInputChange}
        handleAddSchedule={handleAddSchedule}
        userType={userType}
      />
    </Container>
  );
};

export default Profile;