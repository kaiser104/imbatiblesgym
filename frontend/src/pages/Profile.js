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
    IconButton,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    Edit,
    Save,
    Cancel,
    PhotoCamera,
    Person,
    Email,
    Phone,
    LocationOn,
    Description,
    CalendarToday,
    FitnessCenter,
    EmojiEvents,
    Timeline
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
    // Añadir estado para la foto de portada
    const [coverPhoto, setCoverPhoto] = useState('');
    const [stats, setStats] = useState({
        sessions: 0,
        achievements: 0,
        progress: 0
    });

    // Estados existentes para salas y horarios
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
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                // Intentar encontrar al usuario en las diferentes colecciones
                const collections = ['trainees', 'entrenadores', 'gimnasios'];
                let userData = null;
                let type = null;

                for (const collectionName of collections) {
                    // Buscar por uid para todos los tipos de usuario
                    const q = query(collection(db, collectionName), where("uid", "==", currentUser.uid));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        userData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                        type = collectionName === 'trainees' ? 'deportista' :
                            collectionName === 'entrenadores' ? 'entrenador' : 'gimnasio';
                        break;
                    }

                    // Si es gimnasio, también intentar buscar por adminId
                    if (collectionName === 'gimnasios') {
                        const qAdmin = query(collection(db, collectionName), where("adminId", "==", currentUser.uid));
                        const querySnapshotAdmin = await getDocs(qAdmin);

                        if (!querySnapshotAdmin.empty) {
                            userData = { id: querySnapshotAdmin.docs[0].id, ...querySnapshotAdmin.docs[0].data() };
                            type = 'gimnasio';
                            break;
                        }
                    }
                }

                if (userData) {
                    console.log("Perfil encontrado:", userData, "Tipo:", type);
                    setUserProfile(userData);
                    setUserType(type);

                    // Establecer foto de portada predeterminada según el tipo de usuario
                    if (type === 'deportista') {
                        setCoverPhoto(userData.coverPhoto || 'https://source.unsplash.com/random/1200x400/?fitness');
                        setStats({
                            sessions: Math.floor(Math.random() * 50),
                            achievements: Math.floor(Math.random() * 10),
                            progress: Math.floor(Math.random() * 100)
                        });
                    } else if (type === 'entrenador') {
                        setCoverPhoto(userData.coverPhoto || 'https://source.unsplash.com/random/1200x400/?trainer');
                        setStats({
                            clients: Math.floor(Math.random() * 30),
                            sessions: Math.floor(Math.random() * 100),
                            rating: (4 + Math.random()).toFixed(1)
                        });
                    } else {
                        setCoverPhoto(userData.coverPhoto || 'https://source.unsplash.com/random/1200x400/?gym');
                        setStats({
                            members: Math.floor(Math.random() * 200),
                            trainers: Math.floor(Math.random() * 15),
                            classes: Math.floor(Math.random() * 40)
                        });
                    }
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

    const handleCoverPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const storageRef = ref(storage, `cover_photos/${userProfile.id}`);
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);

            const collectionName = userType === 'deportista' ? 'trainees' :
                userType === 'entrenador' ? 'entrenadores' : 'gimnasios';

            await updateDoc(doc(db, collectionName, userProfile.id), {
                coverPhoto: photoURL
            });

            setCoverPhoto(photoURL);

        } catch (error) {
            console.error("Error al subir la foto de portada:", error);
        }
    };

    // Componente para mostrar estadísticas según el tipo de usuario
    const renderStats = () => {
        if (userType === 'deportista') {
            return (
                <Box className="stats-container">
                    <Box className="stat-item">
                        <Typography className="stat-value">{stats.sessions}</Typography>
                        <Typography className="stat-label">Sesiones</Typography>
                    </Box>
                    <Box className="stat-item">
                        <Typography className="stat-value">{stats.achievements}</Typography>
                        <Typography className="stat-label">Logros</Typography>
                    </Box>
                    <Box className="stat-item">
                        <Typography className="stat-value">{stats.progress}%</Typography>
                        <Typography className="stat-label">Progreso</Typography>
                    </Box>
                </Box>
            );
        } else if (userType === 'entrenador') {
            return (
                <Box className="stats-container">
                    <Box className="stat-item">
                        <Typography className="stat-value">{stats.clients}</Typography>
                        <Typography className="stat-label">Clientes</Typography>
                    </Box>
                    <Box className="stat-item">
                        <Typography className="stat-value">{stats.sessions}</Typography>
                        <Typography className="stat-label">Sesiones</Typography>
                    </Box>
                    <Box className="stat-item">
                        <Typography className="stat-value">{stats.rating}</Typography>
                        <Typography className="stat-label">Valoración</Typography>
                    </Box>
                </Box>
            );
        } else {
            return (
                <Box className="stats-container">
                    <Box className="stat-item">
                        <Typography className="stat-value">{stats.members}</Typography>
                        <Typography className="stat-label">Miembros</Typography>
                    </Box>
                    <Box className="stat-item">
                        <Typography className="stat-value">{stats.trainers}</Typography>
                        <Typography className="stat-label">Entrenadores</Typography>
                    </Box>
                    <Box className="stat-item">
                        <Typography className="stat-value">{stats.classes}</Typography>
                        <Typography className="stat-label">Clases</Typography>
                    </Box>
                </Box>
            );
        }
    };

    return (
        <Container className="profile-container">
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                </Box>
            ) : userProfile ? (
                <>
                    <Paper elevation={3} className="profile-paper animate-fade-in">
                        {/* Sección de estadísticas (antes era la imagen de portada) */}
                        <Box className="profile-cover">
                            {renderStats()}
                        </Box>

                        <Box className="profile-box">
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4} className="profile-user-info">
                                    <Box className="profile-avatar-container">
                                        <Avatar
                                            src={userProfile.photoURL}
                                            alt={userProfile.displayName || userProfile.nombre || 'Usuario'}
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
                                                aria-label="Cambiar foto de perfil"
                                            >
                                                <PhotoCamera />
                                            </IconButton>
                                        </label>
                                    </Box>

                                    {/* Nombre y botón de editar perfil */}
                                    <Box className="profile-name-container">
                                        <Typography variant="h5" component="h1" gutterBottom>
                                            {userProfile.displayName || userProfile.nombre || 'Usuario'}
                                        </Typography>

                                        {/* Botón de editar perfil justo debajo del nombre */}
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Edit />}
                                            onClick={handleEditToggle}
                                            className="profile-edit-button"
                                        >
                                            Editar Perfil
                                        </Button>

                                        <Chip
                                            label={userType === 'deportista' ? 'Deportista' :
                                                userType === 'entrenador' ? 'Entrenador' : 'Gimnasio'}
                                            color="primary"
                                            variant="outlined"
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>

                                    {/* Resto del contenido... Aquí podrías agregar más información del perfil */}
                                    {editing && (
                                        <PersonalInfo userProfile={userProfile} handleInputChange={handleInputChange} />
                                    )}
                                    {!editing && userProfile && (
                                        <Box mt={2}>
                                            <Typography variant="subtitle1"><Person />{' '} {userProfile.displayName || userProfile.nombre}</Typography>
                                            <Typography variant="subtitle1"><Email />{' '} {currentUser.email}</Typography>
                                            {userProfile.phone && <Typography variant="subtitle1"><Phone />{' '} {userProfile.phone}</Typography>}
                                            {userProfile.location && <Typography variant="subtitle1"><LocationOn />{' '} {userProfile.location}</Typography>}
                                            {userProfile.description && <Typography variant="body2" mt={1}><Description />{' '} {userProfile.description}</Typography>}
                                            {userProfile.birthDate && <Typography variant="body2"><CalendarToday />{' '} {new Date(userProfile.birthDate).toLocaleDateString()}</Typography>}
                                            {userType === 'deportista' && (
                                                <>
                                                    {userProfile.fitnessGoal && <Typography variant="body2"><FitnessCenter />{' '} Objetivo: {userProfile.fitnessGoal}</Typography>}
                                                    {userProfile.level && <Typography variant="body2"><EmojiEvents />{' '} Nivel: {userProfile.level}</Typography>}
                                                </>
                                            )}
                                            {userType === 'entrenador' && (
                                                <>
                                                    {userProfile.specialty && <Typography variant="body2"><Timeline />{' '} Especialidad: {userProfile.specialty}</Typography>}
                                                </>
                                            )}
                                            {userType === 'gimnasio' && (
                                                <>
                                                    {userProfile.address && <Typography variant="body2"><LocationOn />{' '} Dirección: {userProfile.address}</Typography>}
                                                </>
                                            )}
                                        </Box>
                                    )}

                                    <Box mt={2}>
                                        {editing ? (
                                            <Box>
                                                <Button variant="contained" color="secondary" startIcon={<Save />} onClick={handleSaveProfile}>Guardar</Button>
                                                <Button sx={{ ml: 1 }} onClick={handleEditToggle} startIcon={<Cancel />}>Cancelar</Button>
                                            </Box>
                                        ) : (
                                            <></>
                                        )}
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={8}>
                                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
                                        <Tab label="Actividad" />
                                        {userType === 'gimnasio' && <Tab label="Salas" />}
                                        {(userType === 'entrenador' || userType === 'gimnasio') && <Tab label="Horarios" />}
                                        {userType === 'deportista' && <Tab label="Reservaciones" />}
                                    </Tabs>
                                    <Divider sx={{ mb: 2 }} />
                                    {tabValue === 0 && <Typography>Aquí irá la actividad del usuario.</Typography>}
                                    {tabValue === 1 && userType === 'gimnasio' && (
                                        <RoomManagement
                                            rooms={rooms}
                                            handleOpenRoomDialog={handleOpenRoomDialog}
                                            handleEditRoom={handleEditRoom}
                                            handleDeleteRoom={handleDeleteRoom}
                                        />
                                    )}
                                    {tabValue === 2 && (userType === 'entrenador' || userType === 'gimnasio') && (
                                        <ScheduleManagement handleOpenScheduleDialog={handleOpenScheduleDialog} />
                                    )}
                                    {tabValue === (userType === 'gimnasio' ? 3 : 2) && userType === 'deportista' && (
                                        <ReservationList />
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>

                    <ScheduleDialog
                        open={openScheduleDialog}
                        onClose={handleCloseScheduleDialog}
                        newSchedule={newSchedule}
                        setNewSchedule={setNewSchedule}
                        handleScheduleInputChange={handleScheduleInputChange}
                        handleAddSchedule={handleAddSchedule}
                        userType={userType}
                    />

                    <RoomDialog
                        open={openRoomDialog}
                        onClose={handleCloseRoomDialog}
                        newRoom={newRoom}
                        handleRoomInputChange={handleRoomInputChange}
                        handleAddEquipment={handleAddEquipment}
                        handleRemoveEquipment={handleRemoveEquipment}
                        handleAddRoom={handleAddRoom}
                        editingRoom={editingRoom}
                        editRoomData={editRoomData}
                        setEditRoomData={setEditRoomData}
                        handleUpdateRoom={handleUpdateRoom}
                    />
                </>
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <Typography variant="h6" color="text.secondary">
                        No se encontró el perfil de usuario
                    </Typography>
                </Box>
            )}
        </Container>
    );
};

export default Profile;