import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, 
  Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, FormControl, InputLabel, Select, 
  MenuItem, Chip, IconButton, Tooltip
} from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Configurar el localizador para el calendario
moment.locale('es');
const localizer = momentLocalizer(moment);

const GymCalendar = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  
  // Cargar planes, usuarios y eventos al iniciar
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        // Obtener planes del entrenador o gimnasio
        const plansQuery = query(
          collection(db, "trainingPlans"), 
          where("userId", "==", currentUser.uid)
        );
        const plansSnapshot = await getDocs(plansQuery);
        const plansData = plansSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlans(plansData);
        
        // Obtener usuarios del gimnasio
        // Esto dependerá de tu estructura de datos
        const usersQuery = query(
          collection(db, "trainees"),
          where("gymId", "==", "ID_DE_TU_GIMNASIO") // Ajustar según tu estructura
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        
        // Obtener eventos del calendario
        const eventsQuery = query(
          collection(db, "calendarEvents"),
          where("gymId", "==", "ID_DE_TU_GIMNASIO") // Ajustar según tu estructura
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsData = eventsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            start: data.start.toDate(),
            end: data.end.toDate(),
            userId: data.userId,
            planId: data.planId,
            sessionNumber: data.sessionNumber,
            completed: data.completed || false,
            allDay: data.allDay || false,
            resource: data
          };
        });
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, [currentUser]);
  
  // Función para agrupar ejercicios por sesión
  const groupExercisesBySession = (trainingPlan) => {
    if (!trainingPlan || !Array.isArray(trainingPlan)) return {};
    
    const sessions = {};
    
    trainingPlan.forEach(exercise => {
      const sessionKey = `Sesión ${exercise.sessionNumber}`;
      
      if (!sessions[sessionKey]) {
        sessions[sessionKey] = [];
      }
      
      sessions[sessionKey].push(exercise);
    });
    
    return sessions;
  };
  
  // Función para asignar un plan a un usuario
  const handleAssignPlan = async () => {
    if (!selectedPlan || !selectedUser || !startDate) return;
    
    try {
      const plan = plans.find(p => p.id === selectedPlan);
      const sessions = groupExercisesBySession(plan.trainingPlan);
      const sessionCount = Object.keys(sessions).length;
      
      // Determinar los días de la semana para entrenar basado en la frecuencia
      const frequency = parseInt(plan.frequency);
      let trainingDays = [];
      
      // Distribuir los días de entrenamiento en la semana
      // Por ejemplo, si la frecuencia es 3, podríamos elegir lunes, miércoles y viernes
      if (frequency === 1) trainingDays = [1]; // Solo lunes
      else if (frequency === 2) trainingDays = [1, 4]; // Lunes y jueves
      else if (frequency === 3) trainingDays = [1, 3, 5]; // Lunes, miércoles y viernes
      else if (frequency === 4) trainingDays = [1, 2, 4, 5]; // Lunes, martes, jueves y viernes
      else if (frequency === 5) trainingDays = [1, 2, 3, 4, 5]; // Lunes a viernes
      else if (frequency === 6) trainingDays = [1, 2, 3, 4, 5, 6]; // Lunes a sábado
      else if (frequency === 7) trainingDays = [0, 1, 2, 3, 4, 5, 6]; // Todos los días
      
      // Crear eventos para cada sesión en los días correspondientes
      const newEvents = [];
      let currentDate = new Date(startDate);
      let sessionIndex = 0;
      
      // Calcular cuántas semanas necesitamos para completar todas las sesiones
      const weeksNeeded = Math.ceil(sessionCount / frequency);
      
      for (let week = 0; week < weeksNeeded; week++) {
        for (let dayIndex = 0; dayIndex < trainingDays.length; dayIndex++) {
          if (sessionIndex >= sessionCount) break;
          
          // Encontrar el próximo día de entrenamiento
          while (currentDate.getDay() !== trainingDays[dayIndex]) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Crear el evento para esta sesión
          const sessionNumber = sessionIndex + 1;
          const sessionKey = `Sesión ${sessionNumber}`;
          const sessionExercises = sessions[sessionKey] || [];
          
          if (sessionExercises.length > 0) {
            const eventDate = new Date(currentDate);
            const eventTitle = `${plan.name} - ${sessionKey} - ${selectedUser.name || 'Usuario'}`;
            
            // Crear el evento en Firestore
            const eventData = {
              title: eventTitle,
              start: eventDate,
              end: new Date(eventDate.getTime() + (parseInt(plan.timeAvailable) * 60000)),
              userId: selectedUser.id,
              planId: plan.id,
              sessionNumber: sessionNumber,
              completed: false,
              allDay: false,
              gymId: "ID_DE_TU_GIMNASIO", // Ajustar según tu estructura
              createdAt: new Date(),
              createdBy: currentUser.uid
            };
            
            const docRef = await addDoc(collection(db, "calendarEvents"), eventData);
            
            newEvents.push({
              id: docRef.id,
              ...eventData,
              resource: eventData
            });
          }
          
          sessionIndex++;
        }
        
        // Avanzar al inicio de la próxima semana
        currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + (7 * (week + 1)));
      }
      
      // Actualizar la lista de eventos
      setEvents([...events, ...newEvents]);
      
      // Cerrar el diálogo
      setAssignDialogOpen(false);
      setSelectedPlan(null);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error assigning plan:", error);
    }
  };
  
  // Función para marcar un evento como completado
  const handleMarkCompleted = async (event) => {
    try {
      const eventRef = doc(db, "calendarEvents", event.id);
      await updateDoc(eventRef, {
        completed: !event.completed
      });
      
      // Actualizar la lista de eventos
      setEvents(events.map(e => 
        e.id === event.id 
          ? { ...e, completed: !e.completed } 
          : e
      ));
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };
  
  // Personalizar la apariencia de los eventos en el calendario
  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: event.completed ? '#4CAF50' : '#2196F3',
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    
    return {
      style
    };
  };
  
  // Componente personalizado para mostrar eventos
  const EventComponent = ({ event }) => (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        {event.title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
        <Chip 
          label={`Sesión ${event.sessionNumber}`} 
          size="small" 
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)', 
            fontSize: '0.6rem' 
          }} 
        />
        <Tooltip title={event.completed ? "Marcar como no completado" : "Marcar como completado"}>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleMarkCompleted(event);
            }}
            sx={{ color: 'white' }}
          >
            {event.completed ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#BBFF00' }}>
        Calendario del Gimnasio
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AssignmentIcon />}
          onClick={() => setAssignDialogOpen(true)}
        >
          Asignar Plan
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, bgcolor: '#121212', height: 'calc(100vh - 200px)' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day']}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent
          }}
          messages={{
            today: 'Hoy',
            previous: 'Anterior',
            next: 'Siguiente',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'No hay eventos en este rango'
          }}
        />
      </Paper>
      
      {/* Diálogo para asignar plan */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { bgcolor: '#1E1E1E', color: '#FFFFFF' }
        }}
      >
        <DialogTitle>Asignar Plan de Entrenamiento</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Plan de Entrenamiento</InputLabel>
              <Select
                value={selectedPlan || ''}
                onChange={(e) => setSelectedPlan(e.target.value)}
                label="Plan de Entrenamiento"
              >
                {plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Usuario</InputLabel>
              <Select
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value)}
                label="Usuario"
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user}>
                    {user.name || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Fecha de Inicio</InputLabel>
              <TextField
                type="date"
                value={startDate ? moment(startDate).format('YYYY-MM-DD') : ''}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAssignPlan} 
            variant="contained" 
            color="primary"
            disabled={!selectedPlan || !selectedUser || !startDate}
          >
            Asignar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GymCalendar;