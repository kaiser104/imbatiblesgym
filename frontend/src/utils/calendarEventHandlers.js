import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Manejar apertura del modal
export const handleOpenModal = (event, setSelectedEvent, setEventForm, setOpenModal) => {
  if (event) {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      start: event.start,
      end: event.end,
      client: event.client || '',
      plan: event.plan || '',
      notes: event.notes || '',
      color: event.color || '#BBFF00'
    });
  } else {
    setSelectedEvent(null);
    const startDate = new Date();
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);
    
    setEventForm({
      title: '',
      start: startDate,
      end: endDate,
      client: '',
      plan: '',
      notes: '',
      color: '#BBFF00'
    });
  }
  setOpenModal(true);
};

// Manejar cierre del modal
export const handleCloseModal = (setOpenModal, setSelectedEvent) => {
  setOpenModal(false);
  setSelectedEvent(null);
};

// Manejar cambios en el formulario
export const handleFormChange = (e, eventForm, setEventForm) => {
  const { name, value } = e.target;
  setEventForm({
    ...eventForm,
    [name]: value
  });
};

// Manejar cambios en las fechas
export const handleDateChange = (name, value, eventForm, setEventForm) => {
  setEventForm({
    ...eventForm,
    [name]: value
  });
};

// Guardar evento
export const handleSaveEvent = async (selectedEvent, eventForm, events, setEvents, handleCloseModal) => {
  try {
    if (selectedEvent) {
      // Actualizar evento existente
      await updateDoc(doc(db, 'sesiones', selectedEvent.id), {
        title: eventForm.title,
        start: eventForm.start,
        end: eventForm.end,
        client: eventForm.client,
        plan: eventForm.plan,
        notes: eventForm.notes,
        color: eventForm.color,
        updatedAt: new Date()
      });
      
      // Actualizar estado local
      setEvents(events.map(event => 
        event.id === selectedEvent.id 
          ? { ...event, ...eventForm } 
          : event
      ));
    } else {
      // Crear nuevo evento
      const docRef = await addDoc(collection(db, 'sesiones'), {
        title: eventForm.title,
        start: eventForm.start,
        end: eventForm.end,
        client: eventForm.client,
        plan: eventForm.plan,
        notes: eventForm.notes,
        color: eventForm.color,
        createdAt: new Date()
      });
      
      // Actualizar estado local
      setEvents([...events, { id: docRef.id, ...eventForm }]);
    }
    
    handleCloseModal();
  } catch (error) {
    console.error("Error al guardar el evento:", error);
  }
};

// Eliminar evento
export const handleDeleteEvent = async (selectedEvent, events, setEvents, handleCloseModal) => {
  if (!selectedEvent) return;
  
  try {
    await deleteDoc(doc(db, 'sesiones', selectedEvent.id));
    setEvents(events.filter(event => event.id !== selectedEvent.id));
    handleCloseModal();
  } catch (error) {
    console.error("Error al eliminar el evento:", error);
  }
};

// Cargar las sesiones de un plan
export const loadPlanSessions = async (planId, setPlanSessions, setSelectedPlan) => {
  try {
    const planDoc = await getDoc(doc(db, 'trainingPlans', planId));
    if (planDoc.exists()) {
      const planData = planDoc.data();
      // Ordenar las sesiones por número de sesión
      const sessions = planData.trainingPlan || [];
      const sortedSessions = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
      setPlanSessions(sortedSessions);
      setSelectedPlan({...planData, id: planId});
    }
  } catch (error) {
    console.error("Error al cargar las sesiones del plan:", error);
  }
};