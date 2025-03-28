// Asegúrate de que tienes estos imports correctos
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { 
  CalendarMonth, 
  AccessTime, 
  Room, 
  Cancel, 
  Event, 
  EventAvailable,
  EventBusy
} from '@mui/icons-material';
import { collection, getDocs, query, where, doc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

const ReservationList = ({ userId, userType }) => {
  const [reservations, setReservations] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [events, setEvents] = useState([]);
  const [gymRooms, setGymRooms] = useState([]);

  // Función para cargar las reservas del usuario
  const loadUserReservations = async () => {
    try {
      setLoading(true);
      const reservationsRef = collection(db, 'reservas');
      const q = query(reservationsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const reservationsData = [];
      for (const docRef of querySnapshot.docs) {
        const reservation = { id: docRef.id, ...docRef.data() };
        
        // Obtener detalles de la clase
        if (reservation.horarioId) {
          const horarioDoc = await getDoc(doc(db, 'horarios_gimnasios', reservation.horarioId));
          if (horarioDoc.exists()) {
            reservation.horario = horarioDoc.data();
          }
        }
        
        // Obtener detalles de la sala
        if (reservation.salaId) {
          const salaDoc = await getDoc(doc(db, 'salas', reservation.salaId));
          if (salaDoc.exists()) {
            reservation.sala = salaDoc.data();
          }
        }
        
        // Obtener detalles del gimnasio
        if (reservation.gymId) {
          const gymDoc = await getDoc(doc(db, 'gimnasios', reservation.gymId));
          if (gymDoc.exists()) {
            reservation.gym = gymDoc.data();
          }
        }
        
        reservationsData.push(reservation);
      }
      
      setReservations(reservationsData);
      
      // Convertir reservas a eventos para el calendario
      const calendarEvents = reservationsData.map(res => ({
        id: res.id,
        title: res.horario?.description || 'Clase reservada',
        start: new Date(res.fecha.toDate()),
        end: new Date(new Date(res.fecha.toDate()).getTime() + (res.horario?.duration || 60) * 60000),
        resource: res
      }));
      
      setEvents(calendarEvents);
      
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar reservas:", err);
      setError("Error al cargar tus reservas. Inténtalo de nuevo más tarde.");
      setLoading(false);
    }
  };

  // Función para cargar las clases disponibles
  const loadAvailableClasses = async () => {
    try {
      // Primero obtenemos el gimnasio al que está inscrito el usuario
      const userDoc = await getDoc(doc(db, 'deportistas', userId));
      if (userDoc.exists() && userDoc.data().gymId) {
        const gymId = userDoc.data().gymId;
        setSelectedGym(gymId);
        
        // Obtenemos las salas del gimnasio
        const roomsRef = collection(db, 'salas');
        const roomsQuery = query(roomsRef, where('gymId', '==', gymId));
        const roomsSnapshot = await getDocs(roomsQuery);
        const roomsData = roomsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGymRooms(roomsData);
        
        // Obtenemos los horarios del gimnasio
        const horariosRef = collection(db, 'horarios_gimnasios');
        const q = query(horariosRef, where('gymId', '==', gymId));
        const querySnapshot = await getDocs(q);
        
        const classesData = [];
        for (const docRef of querySnapshot.docs) {
          const horario = { id: docRef.id, ...docRef.data() };
          
          // Verificar si la sala existe
          if (horario.roomId) {
            const roomData = roomsData.find(room => room.id === horario.roomId);
            if (roomData) {
              horario.room = roomData;
            }
          }
          
          classesData.push(horario);
        }
        
        setAvailableClasses(classesData);
      }
    } catch (err) {
      console.error("Error al cargar clases disponibles:", err);
      setError("Error al cargar las clases disponibles. Inténtalo de nuevo más tarde.");
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (userId) {
      loadUserReservations();
      // Asegurarnos de cargar las clases disponibles independientemente del tipo de usuario
      loadAvailableClasses();
    }
  }, [userId, userType]);

  // Función para cancelar una reserva
  const handleCancelReservation = async (reservationId) => {
    try {
      await deleteDoc(doc(db, 'reservas', reservationId));
      setReservations(reservations.filter(res => res.id !== reservationId));
      setEvents(events.filter(event => event.id !== reservationId));
      alert('Reserva cancelada con éxito');
    } catch (err) {
      console.error("Error al cancelar reserva:", err);
      alert('Error al cancelar la reserva. Inténtalo de nuevo más tarde.');
    }
  };

  // Función para reservar una clase
  const handleBookClass = async () => {
    if (!selectedClass) return;
    
    try {
      // Verificar si ya existe una reserva para esta clase y fecha
      const reservasRef = collection(db, 'reservas');
      const q = query(
        reservasRef, 
        where('userId', '==', userId),
        where('horarioId', '==', selectedClass.id),
        where('fecha', '==', selectedDate)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('Ya tienes una reserva para esta clase en esta fecha');
        return;
      }
      
      // Crear la nueva reserva
      const newReservation = {
        userId,
        horarioId: selectedClass.id,
        salaId: selectedClass.roomId,
        gymId: selectedClass.gymId,
        fecha: selectedDate,
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'reservas'), newReservation);
      
      // Actualizar la lista de reservas
      const reservationWithId = { 
        id: docRef.id, 
        ...newReservation,
        horario: selectedClass,
        sala: selectedClass.room
      };
      
      setReservations([...reservations, reservationWithId]);
      
      // Añadir al calendario
      const newEvent = {
        id: docRef.id,
        title: selectedClass.description || 'Clase reservada',
        start: new Date(selectedDate),
        end: new Date(new Date(selectedDate).getTime() + (selectedClass.duration || 60) * 60000),
        resource: reservationWithId
      };
      
      setEvents([...events, newEvent]);
      
      setOpenDialog(false);
      alert('Clase reservada con éxito');
    } catch (err) {
      console.error("Error al reservar clase:", err);
      alert('Error al reservar la clase. Inténtalo de nuevo más tarde.');
    }
  };

  // Función para abrir el diálogo de reserva
  const handleOpenBookingDialog = (date) => {
    setSelectedDate(date);
    setOpenDialog(true);
  };

  // Función para filtrar clases disponibles por día de la semana
  const getAvailableClassesForDate = (date) => {
    const dayOfWeek = moment(date).format('dddd');
    const dayMapping = {
      'Monday': 'Lunes',
      'Tuesday': 'Martes',
      'Wednesday': 'Miércoles',
      'Thursday': 'Jueves',
      'Friday': 'Viernes',
      'Saturday': 'Sábado',
      'Sunday': 'Domingo'
    };
    
    const spanishDay = dayMapping[moment(date).format('dddd')] || moment(date).format('dddd');
    
    return availableClasses.filter(clase => 
      clase.days && clase.days.includes(spanishDay)
    );
  };

  // Manejador de cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Función para manejar la selección de fecha en el calendario
  const handleSelectSlot = (slotInfo) => {
    setSelectedDate(slotInfo.start);
    setOpenDialog(true);
  };

  // Función para manejar el clic en un evento del calendario
  const handleSelectEvent = (event) => {
    // Mostrar detalles del evento o permitir cancelar
    const reservation = event.resource;
    if (window.confirm(`¿Deseas cancelar tu reserva para ${event.title}?`)) {
      handleCancelReservation(reservation.id);
    }
  };

  // Renderizar las reservas del usuario
  const renderUserReservations = () => {
    if (loading) {
      return <Typography>Cargando tus reservas...</Typography>;
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Calendario de Reservas
        </Typography>
        <Box sx={{ height: 500, mb: 4 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={{
              next: "Siguiente",
              previous: "Anterior",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              noEventsInRange: "No hay reservas en este período"
            }}
            onSelectEvent={handleSelectEvent}
          />
        </Box>

        {/* Resto del código para mostrar las tarjetas de reservas */}
      </Box>
    );
  };

  // Renderizar el formulario de reserva
  const renderBookingForm = () => {
    if (loading) {
      return <Typography>Cargando clases disponibles...</Typography>;
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Reservar Nueva Clase
        </Typography>
        <Box sx={{ height: 500, mb: 4 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            selectable
            onSelectSlot={handleSelectSlot}
            messages={{
              next: "Siguiente",
              previous: "Anterior",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              noEventsInRange: "No hay reservas en este período"
            }}
          />
        </Box>

        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<EventAvailable />}
          onClick={() => setOpenDialog(true)}
        >
          Reservar Clase
        </Button>
      </Box>
    );
  };

  // Diálogo para seleccionar clase
  const renderBookingDialog = () => {
    return (
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reservar Clase para {moment(selectedDate).format('LL')}</DialogTitle>
        <DialogContent>
          {availableClasses.length === 0 ? (
            <Alert severity="info">No hay clases disponibles para este día</Alert>
          ) : (
            <Grid container spacing={2}>
              {getAvailableClassesForDate(selectedDate).map((clase) => (
                <Grid item xs={12} sm={6} md={4} key={clase.id}>
                  <Card 
                    sx={{ 
                      border: selectedClass?.id === clase.id ? '2px solid #1976d2' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedClass(clase)}
                  >
                    <CardContent>
                      <Typography variant="h6">{clase.description}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {clase.startTime} - {clase.endTime}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Room sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">
                          {clase.room?.name || 'Sala sin especificar'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleBookClass} 
            color="primary" 
            variant="contained"
            disabled={!selectedClass}
          >
            Confirmar Reserva
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<EventBusy />} label="Mis Reservas" />
          <Tab icon={<EventAvailable />} label="Reservar Clase" />
        </Tabs>
      </Paper>

      {tabValue === 0 && renderUserReservations()}
      {tabValue === 1 && renderBookingForm()}
      
      {renderBookingDialog()}
    </Box>
  );
};

export default ReservationList;