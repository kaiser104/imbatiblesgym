import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarPage.css';
import { 
  Box, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem,
  FormControl, InputLabel, Select, Grid, Chip, IconButton,
  Tooltip, Checkbox, ListItemText, Divider, OutlinedInput,
  FormGroup, FormControlLabel
} from '@mui/material';
import { 
  Add as AddIcon, 
  FitnessCenter as FitnessCenterIcon
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Importar utilidades y componentes
import { eventPropGetter, formats, messages } from '../utils/calendarConfig';
import { 
  handleOpenModal as openModal, 
  handleCloseModal as closeModal,
  handleFormChange as formChange,
  handleDateChange as dateChange,
  handleSaveEvent as saveEvent,
  handleDeleteEvent as deleteEvent,
  loadPlanSessions as loadSessions
} from '../utils/calendarEventHandlers';
import {
  determineUserType as getUserType,
  loadActiveGymUsers as getActiveGymUsers,
  loadAllUsers as getAllUsers,
  handleSelectAllUsers as selectAll,
  handleUserSelection as selectUser
} from '../utils/userHandlers';
import { schedulePlan as scheduleTrainingPlan } from '../utils/planScheduler';
import { EventModal, PlanModal, GymHoursModal } from '../components/calendar/CalendarModals';

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment);

// Añadir después de las importaciones y antes del componente principal

// Componente personalizado para la barra de herramientas del calendario
const CustomToolbar = ({ label, onNavigate, onView }) => {
  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={() => onNavigate('TODAY')}>Hoy</button>
        <button type="button" onClick={() => onNavigate('PREV')}>Anterior</button>
        <button type="button" onClick={() => onNavigate('NEXT')}>Siguiente</button>
      </span>
      <span className="rbc-toolbar-label">{label}</span>
      <span className="rbc-btn-group">
        <button type="button" onClick={() => onView('month')}>Mes</button>
        <button type="button" onClick={() => onView('week')}>Semana</button>
        <button type="button" onClick={() => onView('day')}>Día</button>
      </span>
    </div>
  );
};

const CalendarPage = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  // Make sure you have these state declarations at the top of your component
  const [openModal, setOpenModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month');
  const [userType, setUserType] = useState('');
  const [gymId, setGymId] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAllUsers, setSelectAllUsers] = useState(false);
  
  // Estados para el modal de programación de plan
  const [openPlanModal, setOpenPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planSessions, setPlanSessions] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [frequency, setFrequency] = useState('daily'); // daily, alternate, weekdays
  const [sessionsToSkip, setSessionsToSkip] = useState([]);
  
  // Nuevos estados para horarios del gimnasio
  const [gymHours, setGymHours] = useState({
    1: { open: '06:00', close: '22:00', isOpen: true }, // Lunes
    2: { open: '06:00', close: '22:00', isOpen: true }, // Martes
    3: { open: '06:00', close: '22:00', isOpen: true }, // Miércoles
    4: { open: '06:00', close: '22:00', isOpen: true }, // Jueves
    5: { open: '06:00', close: '22:00', isOpen: true }, // Viernes
    6: { open: '08:00', close: '14:00', isOpen: true }, // Sábado
    0: { open: '00:00', close: '00:00', isOpen: false } // Domingo (cerrado por defecto)
  });
  
  // Estado para controlar el modal de configuración de horarios
  const [openHoursModal, setOpenHoursModal] = useState(false);
  
  // Estado para las franjas horarias disponibles (por ejemplo, cada hora)
  const [timeSlots, setTimeSlots] = useState([]);
  
  // Estado para el formulario de evento
  const [eventForm, setEventForm] = useState({
    title: '',
    start: new Date(),
    end: new Date(new Date().setHours(new Date().getHours() + 1)),
    client: '',
    plan: '',
    notes: '',
    color: '#BBFF00'
  });

  // Add this to your state declarations
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Por defecto lunes a viernes

  const handleOpenModal = (event = null) => {
    // Si event es un objeto de slot (cuando se hace clic en una fecha)
    if (event && event.start && !event.id) {
      // Reset the form for a new event
      setEventForm({
        title: '',
        start: event.start,
        end: event.end || new Date(new Date(event.start).setHours(new Date(event.start).getHours() + 1)),
        client: '',
        plan: '',
        notes: '',
        color: '#BBFF00'
      });
      setSelectedEvent(null);
      setOpenModal(true);
    } 
    // Si event es un evento existente (cuando se hace clic en un evento)
    else if (event && event.id) {
      setSelectedEvent(event);
      setEventForm({
        title: event.title || '',
        start: event.start || new Date(),
        end: event.end || new Date(new Date().setHours(new Date().getHours() + 1)),
        client: event.client || '',
        plan: event.plan || '',
        notes: event.notes || '',
        color: event.color || '#BBFF00'
      });
      setOpenModal(true);
    } 
    // Si no hay evento (cuando se hace clic en el botón "Nueva Sesión")
    else {
      setSelectedEvent(null);
      setEventForm({
        title: '',
        start: new Date(),
        end: new Date(new Date().setHours(new Date().getHours() + 1)),
        client: '',
        plan: '',
        notes: '',
        color: '#BBFF00'
      });
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEvent(null);
  };

  // Añadir la función handleSelectEvent que falta
  const handleSelectEvent = (event) => {
    // Cuando se selecciona un evento existente, abrimos el modal con ese evento
    handleOpenModal(event);
  };

  const handleFormChange = (e) => {
    formChange(e, eventForm, setEventForm);
  };

  const handleDateChange = (name, value) => {
    dateChange(name, value, eventForm, setEventForm);
  };

  const handleSaveEvent = async () => {
    await saveEvent(selectedEvent, eventForm, events, setEvents, handleCloseModal);
  };

  const handleDeleteEvent = async () => {
    await deleteEvent(selectedEvent, events, setEvents, handleCloseModal);
  };

  const loadPlanSessions = async (planId) => {
    await loadSessions(planId, setPlanSessions, setSelectedPlan);
  };

  const handleSelectAllUsers = (event) => {
    selectAll(event, activeUsers, setSelectAllUsers, setSelectedUsers);
  };

  const handleUserSelection = (event, userId) => {
    selectUser(event, userId, selectedUsers, setSelectedUsers, activeUsers, setSelectAllUsers);
  };

  // Función para manejar cambios en los horarios del gimnasio
  const handleGymHoursChange = (day, field, value) => {
    setGymHours(prevHours => ({
      ...prevHours,
      [day]: {
        ...prevHours[day],
        [field]: value
      }
    }));
  };
  
  // Función para generar franjas horarias basadas en los horarios del gimnasio
  const generateTimeSlots = (day) => {
    if (!gymHours[day] || !gymHours[day].isOpen) return [];
    
    const slots = [];
    const openTime = gymHours[day].open.split(':');
    const closeTime = gymHours[day].close.split(':');
    
    let startHour = parseInt(openTime[0]);
    const endHour = parseInt(closeTime[0]);
    
    while (startHour < endHour) {
      slots.push(`${startHour.toString().padStart(2, '0')}:00`);
      slots.push(`${startHour.toString().padStart(2, '0')}:30`);
      startHour++;
    }
    
    // Añadir la última hora si no es medianoche
    if (endHour > 0) {
      slots.push(`${endHour.toString().padStart(2, '0')}:00`);
    }
    
    return slots;
  };
  
  // Función para guardar los horarios del gimnasio en Firestore
  const saveGymHours = async () => {
    try {
      // Aquí implementarías la lógica para guardar los horarios en Firestore
      // Por ejemplo:
      // await setDoc(doc(db, 'gimnasios', gymId), { horarios: gymHours }, { merge: true });
      setOpenHoursModal(false);
    } catch (error) {
      console.error("Error al guardar horarios:", error);
    }
  };

  // Add this function to handle day selection
  const handleDaySelection = (event, day) => {
    if (event.target.checked) {
      setSelectedDays([...selectedDays, day]);
    } else {
      setSelectedDays(selectedDays.filter(d => d !== day));
    }
  };
  
  const schedulePlan = () => {
    // Filtrar solo los días que están abiertos
    const availableDays = selectedDays.filter(day => gymHours[day].isOpen);
    
    if (availableDays.length === 0) {
      alert("No hay días disponibles seleccionados. Por favor, selecciona al menos un día en que el gimnasio esté abierto.");
      return;
    }
    
    scheduleTrainingPlan(
      selectedPlan, 
      planSessions, 
      selectedUsers, 
      activeUsers, 
      startDate, 
      frequency, 
      sessionsToSkip, 
      events, 
      setEvents, 
      setOpenPlanModal, 
      setSelectedUsers, 
      setSelectAllUsers,
      availableDays,
      gymHours
    );
  };

  // Añadir la función eventStyleGetter
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color || '#BBFF00',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'black',
        border: '0px',
        display: 'block'
      }
    };
  };

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Determinar tipo de usuario
        await getUserType(currentUser, setUserType, setGymId, 
          async (gymId) => await getActiveGymUsers(gymId, setUsers, setActiveUsers),
          async () => await getAllUsers(setUsers, setActiveUsers)
        );
        
        // Cargar eventos
        const eventsSnapshot = await getDocs(collection(db, 'sesiones'));
        const eventsData = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          start: doc.data().start.toDate(),
          end: doc.data().end.toDate()
        }));
        setEvents(eventsData);
        
        // Cargar planes de entrenamiento
        const plansSnapshot = await getDocs(collection(db, 'trainingPlans'));
        const plansData = plansSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTrainingPlans(plansData);
        
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  return (
    <div className="calendar-page">
      <Typography variant="h4" className="calendar-title">
        Mi Calendario de Sesiones
      </Typography>
      
      <Box className="calendar-actions">
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          className="neon-button neon-button-filled"
          sx={{ mr: 1 }}
        >
          Nueva Sesión
        </Button>
        
        <Button 
          variant="contained" 
          startIcon={<FitnessCenterIcon />}
          onClick={() => setOpenPlanModal(true)}
          className="neon-button"
          sx={{ mr: 1 }}
        >
          Programar Plan
        </Button>
        
        {userType === 'gimnasio' && (
          <Button 
            variant="contained"
            onClick={() => setOpenHoursModal(true)}
            className="neon-button"
            sx={{ mr: 'auto' }}
          >
            Configurar Horarios
          </Button>
        )}
        
        <Box>
          <Button 
            variant={viewMode === 'month' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('month')}
            className={`neon-button ${viewMode === 'month' ? 'neon-button-filled' : ''}`}
            sx={{ mr: 1 }}
          >
            Mes
          </Button>
          <Button 
            variant={viewMode === 'week' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('week')}
            className={`neon-button ${viewMode === 'week' ? 'neon-button-filled' : ''}`}
            sx={{ mr: 1 }}
          >
            Semana
          </Button>
          <Button 
            variant={viewMode === 'day' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('day')}
            className={`neon-button ${viewMode === 'day' ? 'neon-button-filled' : ''}`}
          >
            Día
          </Button>
        </Box>
      </Box>
      
      <Box className="calendar-container">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 120px)' }}
          views={['month', 'week', 'day']}
          defaultView="month"
          selectable={true}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleOpenModal} // Make sure this is a function reference, not a function call
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar
          }}
        />
      </Box>
      
      {/* Usar los componentes de modal importados */}
      <EventModal 
        openModal={openModal}
        handleCloseModal={handleCloseModal}
        selectedEvent={selectedEvent}
        eventForm={eventForm}
        handleFormChange={handleFormChange}
        handleDateChange={handleDateChange}
        handleSaveEvent={handleSaveEvent}
        handleDeleteEvent={handleDeleteEvent}
        trainingPlans={trainingPlans}
        activeUsers={activeUsers}
      />
      
      {/* Asegúrate de pasar los nuevos props al componente PlanModal */}
      <PlanModal
        openPlanModal={openPlanModal}
        setOpenPlanModal={setOpenPlanModal}
        selectedPlan={selectedPlan}
        loadPlanSessions={loadPlanSessions}
        trainingPlans={trainingPlans}
        startDate={startDate}
        setStartDate={setStartDate}
        frequency={frequency}
        setFrequency={setFrequency}
        planSessions={planSessions}
        sessionsToSkip={sessionsToSkip}
        setSessionsToSkip={setSessionsToSkip}
        selectAllUsers={selectAllUsers}
        handleSelectAllUsers={handleSelectAllUsers}
        activeUsers={activeUsers}
        selectedUsers={selectedUsers}
        handleUserSelection={handleUserSelection}
        schedulePlan={schedulePlan}
        selectedDays={selectedDays}
        handleDaySelection={handleDaySelection}
        gymHours={gymHours}
      />
      
      {/* Nuevo modal para configurar horarios */}
      <GymHoursModal
        open={openHoursModal}
        onClose={() => setOpenHoursModal(false)}
        gymHours={gymHours}
        handleGymHoursChange={handleGymHoursChange}
        saveGymHours={saveGymHours}
      />
    </div>
  );
};

export default CalendarPage;