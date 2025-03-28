import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Paper,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControlLabel,
  Switch,
  Checkbox
} from '@mui/material';
import {
  Add,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Room,
  Schedule,
  FitnessCenter,
  AccessTime,
  CalendarMonth
} from '@mui/icons-material';
import { collection, getDocs, query, where, doc, deleteDoc, addDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import './RoomManagement.css';

const roomTypes = [
  'Musculación',
  'Cardio',
  'Clases grupales',
  'Funcional',
  'Spinning',
  'Yoga',
  'Pilates',
  'Otro'
];

const RoomManagement = ({ 
  userId, 
  userType, 
  simplified = false,
  rooms: externalRooms,
  handleOpenRoomDialog: externalHandleOpenRoomDialog,
  handleEditRoom: externalHandleEditRoom,
  handleDeleteRoom: externalHandleDeleteRoom
}) => {
  // Estados solo para el modo completo
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(!simplified);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para manejar las salas seleccionadas y los horarios filtrados
  const [selectedRooms, setSelectedRooms] = useState({});
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  
  // Estados para el formulario de sala
  const [openRoomDialog, setOpenRoomDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(10);
  const [roomDescription, setRoomDescription] = useState('');
  const [roomType, setRoomType] = useState(roomTypes[0]);
  const [customRoomType, setCustomRoomType] = useState('');
  const [roomEquipment, setRoomEquipment] = useState([]);
  const [newEquipment, setNewEquipment] = useState('');
  const [newEquipmentQuantity, setNewEquipmentQuantity] = useState(1);
  const [requiresReservation, setRequiresReservation] = useState(true);
  
  // Estados para el formulario de horario
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [scheduleDay, setScheduleDay] = useState('Lunes');
  const [scheduleStartTime, setScheduleStartTime] = useState('08:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('09:00');
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [scheduleCapacity, setScheduleCapacity] = useState(10);

  // Cargar salas del gimnasio (solo en modo completo)
  const loadRooms = async () => {
    if (simplified) return;
    
    try {
      setLoading(true);
      const roomsRef = collection(db, 'salas');
      let q;
      
      if (userType === 'gimnasio') {
        q = query(roomsRef, where('gymId', '==', userId));
      } else if (userType === 'entrenador') {
        // Para entrenadores, cargar salas a las que tiene acceso
        q = query(roomsRef, where('trainers', 'array-contains', userId));
      } else {
        // Para super usuario, cargar todas las salas
        q = roomsRef;
      }
      
      const querySnapshot = await getDocs(q);
      const roomsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRooms(roomsData);
      
      // Inicializar el estado de selección de salas
      const initialSelectedRooms = {};
      roomsData.forEach(room => {
        initialSelectedRooms[room.id] = false;
      });
      setSelectedRooms(initialSelectedRooms);
      
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar salas:", err);
      setError("Error al cargar las salas. Inténtalo de nuevo más tarde.");
      setLoading(false);
    }
  };

  // Cargar horarios (solo en modo completo)
  const loadSchedules = async () => {
    if (simplified) return;
    
    try {
      const schedulesRef = collection(db, 'horarios_gimnasios');
      let q;
      
      if (userType === 'gimnasio') {
        q = query(schedulesRef, where('gymId', '==', userId));
      } else if (userType === 'entrenador') {
        q = query(schedulesRef, where('userId', '==', userId));
      } else {
        q = schedulesRef;
      }
      
      const querySnapshot = await getDocs(q);
      const schedulesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSchedules(schedulesData);
      setFilteredSchedules(schedulesData); // Inicialmente mostrar todos los horarios
    } catch (err) {
      console.error("Error al cargar horarios:", err);
      setError("Error al cargar los horarios. Inténtalo de nuevo más tarde.");
    }
  };

  // Cargar datos al montar el componente (solo en modo completo)
  useEffect(() => {
    if (!simplified && userId) {
      loadRooms();
      loadSchedules();
    }
  }, [userId, userType, simplified]);

  // Efecto para filtrar horarios cuando cambian las salas seleccionadas
  useEffect(() => {
    const selectedRoomIds = Object.keys(selectedRooms).filter(id => selectedRooms[id]);
    
    if (selectedRoomIds.length === 0) {
      // Si no hay salas seleccionadas, mostrar todos los horarios
      setFilteredSchedules(schedules);
    } else {
      // Filtrar horarios por las salas seleccionadas
      const filtered = schedules.filter(schedule => 
        selectedRoomIds.includes(schedule.roomId)
      );
      setFilteredSchedules(filtered);
    }
  }, [selectedRooms, schedules]);

  // Función para obtener los horarios de una sala específica
  const getRoomSchedules = (roomId) => {
    return schedules.filter(schedule => schedule.roomId === roomId);
  };

  // Función para cambiar a la pestaña de horarios
  const goToSchedulesTab = () => {
    setTabValue(1);
  };

  // Función para manejar el cambio en los checkboxes
  const handleRoomSelection = (roomId) => {
    const newValue = !selectedRooms[roomId];
    setSelectedRooms(prev => ({
      ...prev,
      [roomId]: newValue
    }));
    // Ya no cambiamos automáticamente a la pestaña de horarios
  };

  // Manejador de cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Abrir diálogo para crear/editar sala
  const handleOpenRoomDialog = (room = null) => {
    if (simplified && externalHandleOpenRoomDialog) {
      externalHandleOpenRoomDialog();
      return;
    }
    
    if (room) {
      setEditingRoom(room);
      setRoomName(room.name || '');
      setRoomCapacity(room.capacity || 10);
      setRoomDescription(room.description || '');
      setRoomType(roomTypes.includes(room.type) ? room.type : 'Otro');
      setCustomRoomType(roomTypes.includes(room.type) ? '' : room.type);
      setRoomEquipment(room.equipment || []);
      setRequiresReservation(room.requiresReservation !== false);
    } else {
      setEditingRoom(null);
      setRoomName('');
      setRoomCapacity(10);
      setRoomDescription('');
      setRoomType(roomTypes[0]);
      setCustomRoomType('');
      setRoomEquipment([]);
      setRequiresReservation(true);
    }
    setOpenRoomDialog(true);
  };

  // Función para editar sala (modo simplificado)
  const handleEditRoom = (room) => {
    if (simplified && externalHandleEditRoom) {
      externalHandleEditRoom(room);
      return;
    }
    
    handleOpenRoomDialog(room);
  };

  // Añadir equipamiento a la lista
  const handleAddEquipment = () => {
    if (newEquipment.trim() === '') return;
    
    const equipment = {
      name: newEquipment,
      quantity: newEquipmentQuantity
    };
    
    setRoomEquipment([...roomEquipment, equipment]);
    setNewEquipment('');
    setNewEquipmentQuantity(1);
  };

  // Eliminar equipamiento de la lista
  const handleRemoveEquipment = (index) => {
    const updatedEquipment = [...roomEquipment];
    updatedEquipment.splice(index, 1);
    setRoomEquipment(updatedEquipment);
  };

  // Guardar sala
  const handleSaveRoom = async () => {
    try {
      const roomData = {
        name: roomName,
        capacity: roomCapacity,
        description: roomDescription,
        type: roomType === 'Otro' ? customRoomType : roomType,
        equipment: roomEquipment,
        requiresReservation,
        gymId: userId,
        updatedAt: serverTimestamp()
      };
      
      if (editingRoom) {
        // Actualizar sala existente
        await updateDoc(doc(db, 'salas', editingRoom.id), roomData);
        
        // Actualizar la lista de salas
        setRooms(rooms.map(room => 
          room.id === editingRoom.id ? { ...room, ...roomData, id: editingRoom.id } : room
        ));
      } else {
        // Crear nueva sala
        roomData.createdAt = serverTimestamp();
        
        const docRef = await addDoc(collection(db, 'salas'), roomData);
        
        // Añadir a la lista de salas
        setRooms([...rooms, { id: docRef.id, ...roomData }]);
        
        // Actualizar el estado de selección de salas
        setSelectedRooms(prev => ({
          ...prev,
          [docRef.id]: false
        }));
      }
      
      setOpenRoomDialog(false);
    } catch (err) {
      console.error("Error al guardar sala:", err);
      alert('Error al guardar la sala. Inténtalo de nuevo más tarde.');
    }
  };

  // Eliminar sala
  const handleDeleteRoom = async (roomId) => {
    if (simplified && externalHandleDeleteRoom) {
      externalHandleDeleteRoom(roomId);
      return;
    }
    
    if (window.confirm('¿Estás seguro de que deseas eliminar esta sala? Esta acción no se puede deshacer.')) {
      try {
        await deleteDoc(doc(db, 'salas', roomId));
        setRooms(rooms.filter(room => room.id !== roomId));
        
        // Actualizar el estado de selección de salas
        setSelectedRooms(prev => {
          const updated = { ...prev };
          delete updated[roomId];
          return updated;
        });
      } catch (err) {
        console.error("Error al eliminar sala:", err);
        alert('Error al eliminar la sala. Inténtalo de nuevo más tarde.');
      }
    }
  };

  // Abrir diálogo para crear/editar horario
  const handleOpenScheduleDialog = (schedule = null, room = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setSelectedRoom(room || rooms.find(r => r.id === schedule.roomId) || null);
      setScheduleDescription(schedule.description || '');
      setScheduleDay(schedule.day || 'Lunes');
      setScheduleStartTime(schedule.startTime || '08:00');
      setScheduleEndTime(schedule.endTime || '09:00');
      setScheduleDuration(schedule.duration || 60);
      setScheduleCapacity(schedule.capacity || 10);
    } else {
      setEditingSchedule(null);
      setSelectedRoom(room);
      setScheduleDescription('');
      setScheduleDay('Lunes');
      setScheduleStartTime('08:00');
      setScheduleEndTime('09:00');
      setScheduleDuration(60);
      setScheduleCapacity(room ? room.capacity : 10);
    }
    setOpenScheduleDialog(true);
  };

  // Guardar horario
  const handleSaveSchedule = async () => {
    if (!selectedRoom) {
      alert('Debes seleccionar una sala para el horario');
      return;
    }
    
    try {
      const scheduleData = {
        description: scheduleDescription,
        day: scheduleDay,
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
        duration: scheduleDuration,
        capacity: scheduleCapacity,
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        gymId: userId,
        userId: userId,
        userType: userType,
        available: true,
        currentBookings: 0,
        updatedAt: serverTimestamp()
      };
      
      if (editingSchedule) {
        // Actualizar horario existente
        await updateDoc(doc(db, 'horarios_gimnasios', editingSchedule.id), scheduleData);
        
        // Actualizar la lista de horarios
        const updatedSchedules = schedules.map(schedule => 
          schedule.id === editingSchedule.id ? { ...schedule, ...scheduleData, id: editingSchedule.id } : schedule
        );
        setSchedules(updatedSchedules);
        
        // Actualizar los horarios filtrados
        const selectedRoomIds = Object.keys(selectedRooms).filter(id => selectedRooms[id]);
        if (selectedRoomIds.length === 0 || selectedRoomIds.includes(selectedRoom.id)) {
          setFilteredSchedules(updatedSchedules.filter(schedule => 
            selectedRoomIds.length === 0 || selectedRoomIds.includes(schedule.roomId)
          ));
        }
      } else {
        // Crear nuevo horario
        scheduleData.createdAt = serverTimestamp();
        
        const docRef = await addDoc(collection(db, 'horarios_gimnasios'), scheduleData);
        
        // Añadir a la lista de horarios
        const newSchedule = { id: docRef.id, ...scheduleData };
        const updatedSchedules = [...schedules, newSchedule];
        setSchedules(updatedSchedules);
        
        // Actualizar los horarios filtrados
        const selectedRoomIds = Object.keys(selectedRooms).filter(id => selectedRooms[id]);
        if (selectedRoomIds.length === 0 || selectedRoomIds.includes(selectedRoom.id)) {
          setFilteredSchedules([...filteredSchedules, newSchedule]);
        }
      }
      
      setOpenScheduleDialog(false);
    } catch (err) {
      console.error("Error al guardar horario:", err);
      alert('Error al guardar el horario. Inténtalo de nuevo más tarde.');
    }
  };

  // Eliminar horario
  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este horario? Esta acción no se puede deshacer.')) {
      try {
        await deleteDoc(doc(db, 'horarios_gimnasios', scheduleId));
        const updatedSchedules = schedules.filter(schedule => schedule.id !== scheduleId);
        setSchedules(updatedSchedules);
        setFilteredSchedules(filteredSchedules.filter(schedule => schedule.id !== scheduleId));
      } catch (err) {
        console.error("Error al eliminar horario:", err);
        alert('Error al eliminar el horario. Inténtalo de nuevo más tarde.');
      }
    }
  };

  // Renderizar versión simplificada (para perfil)
  const renderSimplifiedView = () => {
    const roomsToRender = externalRooms || [];
    
    return (
      <Box>
        <Box className="profile-section-header">
          <Typography variant="h6">Mis Salas</Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => handleOpenRoomDialog()}
          >
            Agregar Sala
          </Button>
        </Box>
        
        {roomsToRender.length > 0 ? (
          <Grid container spacing={2}>
            {roomsToRender.map((room) => (
              <Grid item xs={12} sm={6} md={4} key={room.id}>
                <Card>
                  <CardContent>
                    <Box className="room-card-header">
                      <Typography variant="h6">{room.name}</Typography>
                      <Box>
                        <IconButton size="small" onClick={() => handleEditRoom(room)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteRoom(room.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Capacidad: {room.capacity} personas
                    </Typography>
                    <Typography variant="body2" className="room-description">
                      {room.description}
                    </Typography>
                    {room.equipment && room.equipment.length > 0 && (
                      <Box className="room-equipment-container">
                        <Typography variant="subtitle2">Equipamiento:</Typography>
                        <Box className="room-equipment-chips">
                          {room.equipment.map((item, index) => (
                            <Chip 
                              key={index} 
                              label={typeof item === 'object' ? `${item.name} (${item.quantity})` : item} 
                              size="small" 
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No has agregado ninguna sala aún. Las salas te permiten organizar mejor tus espacios y horarios.
          </Typography>
        )}
      </Box>
    );
  };

  // Renderizar lista de salas (modo completo)
  const renderRooms = () => {
    if (loading) {
      return <Typography>Cargando salas...</Typography>;
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (rooms.length === 0) {
      return (
        <Alert severity="info">
          No hay salas registradas. Crea una nueva sala para comenzar.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3} className="rooms-grid">
        {rooms.map((room) => {
          const roomSchedules = getRoomSchedules(room.id);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={room.id}>
              <Card className="room-card">
                <CardContent>
                  <Box className="room-header">
                    <Typography variant="h6">{room.name}</Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!selectedRooms[room.id]}
                          onChange={() => handleRoomSelection(room.id)}
                          color="primary"
                        />
                      }
                      label="Seleccionar"
                    />
                  </Box>
                  <Box className="room-info-item">
                    <FitnessCenter className="room-icon" />
                    <Typography variant="body2">
                      Tipo: {room.type || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box className="room-info-item">
                    <Room className="room-icon" />
                    <Typography variant="body2">
                      Capacidad: {room.capacity || 0} personas
                    </Typography>
                  </Box>
                  {room.description && (
                    <Typography variant="body2" color="text.secondary" className="room-description">
                      {room.description}
                    </Typography>
                  )}
                  {room.equipment && room.equipment.length > 0 && (
                    <Box className="room-equipment">
                      <Typography variant="subtitle2" gutterBottom>
                        Equipamiento:
                      </Typography>
                      <Box className="equipment-chips">
                        {room.equipment.map((item, index) => (
                          <Chip 
                            key={index} 
                            label={typeof item === 'object' ? `${item.name} (${item.quantity})` : item} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Vista previa de horarios */}
                  {roomSchedules.length > 0 && (
                    <Box className="room-schedules-preview">
                      <Box className="room-schedules-title">
                        <Schedule className="room-icon" />
                        <Typography variant="subtitle2">
                          Horarios disponibles ({roomSchedules.length})
                        </Typography>
                      </Box>
                      <Box className="room-schedules-list">
                        {roomSchedules.slice(0, 3).map((schedule) => (
                          <Box key={schedule.id} className="room-schedule-item">
                            <Box sx={{ display: 'flex' }}>
                              <Typography className="room-schedule-day">
                                {schedule.day}
                              </Typography>
                              <Typography className="room-schedule-time">
                                {schedule.startTime} - {schedule.endTime}
                              </Typography>
                            </Box>
                            <Typography className="room-schedule-description">
                              {schedule.description || 'Sin título'}
                            </Typography>
                          </Box>
                        ))}
                        {roomSchedules.length > 3 && (
                          <Typography variant="body2" align="center" sx={{ mt: 1, fontSize: '0.8rem', color: '#666' }}>
                            +{roomSchedules.length - 3} horarios más
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
                <CardActions className="room-actions">
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenRoomDialog(room)}
                  >
                    Editar
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<Schedule />} 
                    onClick={() => handleOpenScheduleDialog(null, room)}
                  >
                    Añadir Horario
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteRoom(room.id)}
                  >
                    Eliminar
                  </Button>
                </CardActions>
                {roomSchedules.length > 0 && (
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Button 
                      variant="outlined"
                      size="small"
                      className="view-schedules-button"
                      onClick={goToSchedulesTab}
                      startIcon={<Schedule />}
                    >
                      Ver todos los horarios
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // Renderizar lista de horarios (modo completo)
  const renderSchedules = () => {
    if (loading) {
      return <Typography>Cargando horarios...</Typography>;
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    // Obtener las salas seleccionadas
    const selectedRoomsList = rooms.filter(room => selectedRooms[room.id]);

    if (filteredSchedules.length === 0) {
      return (
        <Alert severity="info">
          {Object.values(selectedRooms).some(selected => selected) 
            ? "No hay horarios disponibles para las salas seleccionadas. Puedes crear nuevos horarios usando el botón 'Nuevo Horario'." 
            : "No hay horarios registrados. Crea un nuevo horario para comenzar o selecciona salas para ver sus horarios."}
        </Alert>
      );
    }

    // Agrupar horarios por día
    const schedulesByDay = {
      'Lunes': [],
      'Martes': [],
      'Miércoles': [],
      'Jueves': [],
      'Viernes': [],
      'Sábado': [],
      'Domingo': []
    };

    filteredSchedules.forEach(schedule => {
      if (schedulesByDay[schedule.day]) {
        schedulesByDay[schedule.day].push(schedule);
      }
    });

    return (
      <Box className="schedules-container">
        {/* Barra de filtros */}
        {selectedRoomsList.length > 0 && (
          <Box className="schedules-filter-bar">
            <Typography variant="subtitle2">
              Salas seleccionadas:
            </Typography>
            <Box className="selected-rooms-chips">
              {selectedRoomsList.map(room => (
                <Chip 
                  key={room.id}
                  label={room.name}
                  onDelete={() => handleRoomSelection(room.id)}
                  color="primary"
                  size="small"
                />
              ))}
              <Chip 
                label="Limpiar selección"
                onClick={() => {
                  const resetSelection = {};
                  rooms.forEach(room => {
                    resetSelection[room.id] = false;
                  });
                  setSelectedRooms(resetSelection);
                }}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        )}

        <Box className="schedules-header">
          <Typography variant="subtitle1">
            {Object.values(selectedRooms).some(selected => selected) 
              ? "Mostrando horarios de las salas seleccionadas" 
              : "Mostrando todos los horarios"}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={() => handleOpenScheduleDialog()}
          >
            Nuevo Horario
          </Button>
        </Box>
        
        {Object.entries(schedulesByDay).map(([day, daySchedules]) => {
          if (daySchedules.length === 0) return null;
          
          return (
            <Box key={day} className="day-schedules">
              <Typography variant="h6" gutterBottom>
                {day}
              </Typography>
              <Grid container spacing={2}>
                {daySchedules
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((schedule) => (
                    <Grid item xs={12} sm={6} md={4} key={schedule.id}>
                      <Card className="schedule-card">
                        <CardContent>
                          <Box className="schedule-header">
                            <Typography variant="h6" gutterBottom>
                              {schedule.description || 'Horario sin título'}
                            </Typography>
                            <Chip 
                              label={schedule.available ? 'Disponible' : 'No disponible'} 
                              color={schedule.available ? 'success' : 'error'} 
                              size="small" 
                            />
                          </Box>
                          <Box className="schedule-info-item">
                            <AccessTime className="schedule-icon" />
                            <Typography variant="body2">
                              {schedule.startTime} - {schedule.endTime}
                            </Typography>
                          </Box>
                          <Box className="schedule-info-item">
                            <Room className="schedule-icon" />
                            <Typography variant="body2">
                              Sala: {schedule.roomName || 'No especificada'}
                            </Typography>
                          </Box>
                          <Box className="schedule-info-item">
                            <CalendarMonth className="schedule-icon" />
                            <Typography variant="body2">
                              Duración: {schedule.duration || 60} minutos
                            </Typography>
                          </Box>
                          <Box className="schedule-capacity">
                            <Box className="schedule-info-item">
                              <FitnessCenter className="schedule-icon" />
                              <Typography variant="body2">
                                Capacidad: {schedule.capacity || 0}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Reservas: {schedule.currentBookings || 0}/{schedule.capacity || 0}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions className="schedule-actions">
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />} 
                            onClick={() => handleOpenScheduleDialog(schedule)}
                          >
                            Editar
                          </Button>
                          <Button 
                            size="small" 
                            color="error" 
                            startIcon={<DeleteIcon />} 
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            Eliminar
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
              <Divider className="day-divider" />
            </Box>
          );
        })}
      </Box>
    );
  };

  // Diálogo para crear/editar sala
  const renderRoomDialog = () => {
    return (
      <Dialog open={openRoomDialog} onClose={() => setOpenRoomDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRoom ? 'Editar Sala' : 'Crear Nueva Sala'}</DialogTitle>
        <DialogContent>
          <Box className="dialog-content">
            <TextField
              label="Nombre de la sala"
              fullWidth
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              margin="normal"
              required
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tipo de sala</InputLabel>
                  <Select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    label="Tipo de sala"
                  >
                    {roomTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Capacidad"
                  type="number"
                  fullWidth
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(parseInt(e.target.value) || 0)}
                  margin="normal"
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
            </Grid>
            
            {roomType === 'Otro' && (
              <TextField
                label="Especificar tipo"
                fullWidth
                value={customRoomType}
                onChange={(e) => setCustomRoomType(e.target.value)}
                margin="normal"
                required
              />
            )}
            
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              margin="normal"
              placeholder="Describe las características de la sala..."
            />
            
            <Box className="equipment-section">
              <Typography variant="subtitle1" gutterBottom>
                Equipamiento
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre del equipamiento"
                    fullWidth
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    placeholder="Ej: Mancuernas, Bicicletas, etc."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Cantidad"
                    type="number"
                    fullWidth
                    value={newEquipmentQuantity}
                    onChange={(e) => setNewEquipmentQuantity(parseInt(e.target.value) || 1)}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button 
                    variant="contained" 
                    onClick={handleAddEquipment}
                    fullWidth
                    sx={{ height: '100%' }}
                  >
                    Añadir
                  </Button>
                </Grid>
              </Grid>
              
              {roomEquipment.length > 0 && (
                <Box className="equipment-list">
                  <Typography variant="subtitle2" gutterBottom>
                    Equipamiento añadido:
                  </Typography>
                  <List dense>
                    {roomEquipment.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={item.name} 
                          secondary={`Cantidad: ${item.quantity}`} 
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleRemoveEquipment(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={requiresReservation}
                  onChange={(e) => setRequiresReservation(e.target.checked)}
                  color="primary"
                />
              }
              label="Requiere reserva previa"
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoomDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveRoom} 
            variant="contained" 
            color="primary"
            disabled={!roomName || (roomType === 'Otro' && !customRoomType)}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Diálogo para crear/editar horario
  const renderScheduleDialog = () => {
    if (simplified) return null;
    
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    return (
      <Dialog open={openScheduleDialog} onClose={() => setOpenScheduleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingSchedule ? 'Editar Horario' : 'Crear Nuevo Horario'}</DialogTitle>
        <DialogContent>
          <Box className="dialog-content">
            <TextField
              label="Descripción del horario"
              fullWidth
              value={scheduleDescription}
              onChange={(e) => setScheduleDescription(e.target.value)}
              margin="normal"
              placeholder="Ej: Clase de spinning, Entrenamiento funcional, etc."
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Sala</InputLabel>
              <Select
                value={selectedRoom ? selectedRoom.id : ''}
                onChange={(e) => {
                  const room = rooms.find(r => r.id === e.target.value);
                  setSelectedRoom(room);
                  if (room) {
                    setScheduleCapacity(room.capacity);
                  }
                }}
                label="Sala"
                disabled={!!editingSchedule}
                required
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    {room.name} ({room.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Día</InputLabel>
              <Select
                value={scheduleDay}
                onChange={(e) => setScheduleDay(e.target.value)}
                label="Día"
              >
                {days.map((day) => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hora de inicio"
                  type="time"
                  fullWidth
                  value={scheduleStartTime}
                  onChange={(e) => {
                    setScheduleStartTime(e.target.value);
                    // Calcular hora de fin basada en duración
                    const startHour = parseInt(e.target.value.split(':')[0]);
                    const startMinute = parseInt(e.target.value.split(':')[1]);
                    const durationHours = Math.floor(scheduleDuration / 60);
                    const durationMinutes = scheduleDuration % 60;
                    
                    let endHour = startHour + durationHours;
                    let endMinute = startMinute + durationMinutes;
                    
                    if (endMinute >= 60) {
                      endHour += 1;
                      endMinute -= 60;
                    }
                    
                    if (endHour >= 24) {
                      endHour -= 24;
                    }
                    
                    const formattedEndHour = endHour.toString().padStart(2, '0');
                    const formattedEndMinute = endMinute.toString().padStart(2, '0');
                    
                    setScheduleEndTime(`${formattedEndHour}:${formattedEndMinute}`);
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hora de fin"
                  type="time"
                  fullWidth
                  value={scheduleEndTime}
                  onChange={(e) => {
                    setScheduleEndTime(e.target.value);
                    // Calcular duración basada en hora de inicio y fin
                    const startHour = parseInt(scheduleStartTime.split(':')[0]);
                    const startMinute = parseInt(scheduleStartTime.split(':')[1]);
                    const endHour = parseInt(e.target.value.split(':')[0]);
                    const endMinute = parseInt(e.target.value.split(':')[1]);
                    
                    let durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
                    
                    if (durationMinutes < 0) {
                      durationMinutes += 24 * 60; // Añadir un día completo si cruza la medianoche
                    }
                    
                    setScheduleDuration(durationMinutes);
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 300 }}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Duración (minutos)"
              type="number"
              fullWidth
              value={scheduleDuration}
              onChange={(e) => {
                const newDuration = parseInt(e.target.value) || 0;
                setScheduleDuration(newDuration);
                
                // Actualizar hora de fin basada en nueva duración
                const startHour = parseInt(scheduleStartTime.split(':')[0]);
                const startMinute = parseInt(scheduleStartTime.split(':')[1]);
                const durationHours = Math.floor(newDuration / 60);
                const durationMinutes = newDuration % 60;
                
                let endHour = startHour + durationHours;
                let endMinute = startMinute + durationMinutes;
                
                if (endMinute >= 60) {
                  endHour += 1;
                  endMinute -= 60;
                }
                
                if (endHour >= 24) {
                  endHour -= 24;
                }
                
                const formattedEndHour = endHour.toString().padStart(2, '0');
                const formattedEndMinute = endMinute.toString().padStart(2, '0');
                
                setScheduleEndTime(`${formattedEndHour}:${formattedEndMinute}`);
              }}
              margin="normal"
              InputProps={{ inputProps: { min: 15, step: 15 } }}
            />
            
            <TextField
              label="Capacidad"
              type="number"
              fullWidth
              value={scheduleCapacity}
              onChange={(e) => setScheduleCapacity(parseInt(e.target.value) || 0)}
              margin="normal"
              InputProps={{ inputProps: { min: 1 } }}
              helperText={selectedRoom ? `Capacidad máxima de la sala: ${selectedRoom.capacity}` : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScheduleDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveSchedule} 
            variant="contained" 
            color="primary"
            disabled={!selectedRoom || scheduleDuration <= 0}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Renderizado principal del componente
  return (
    <Box>
      {simplified ? (
        // Versión simplificada para perfil
        renderSimplifiedView()
      ) : (
        // Versión completa con pestañas
        <>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab icon={<Room />} label="Salas" />
              <Tab icon={<Schedule />} label="Horarios" />
            </Tabs>
          </Paper>
          
          <Box sx={{ mt: 3, mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            {tabValue === 0 ? (
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Add />}
                onClick={() => handleOpenRoomDialog()}
              >
                Nueva Sala
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Add />}
                onClick={() => handleOpenScheduleDialog()}
              >
                Nuevo Horario
              </Button>
            )}
          </Box>
          
          {tabValue === 0 ? renderRooms() : renderSchedules()}
          
          {renderRoomDialog()}
          {renderScheduleDialog()}
        </>
      )}
    </Box>
  );
};

export default RoomManagement;