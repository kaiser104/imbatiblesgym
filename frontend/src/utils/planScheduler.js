import { collection, doc, writeBatch, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Programar plan para múltiples usuarios
export const schedulePlan = async (
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
  availableDays = [1, 2, 3, 4, 5], // Días disponibles (por defecto L-V)
  gymHours = {} // Horarios del gimnasio
) => {
  // Verificar que haya un plan seleccionado
  if (!selectedPlan) {
    alert('Por favor, selecciona un plan de entrenamiento');
    return;
  }
  
  // Verificar que haya usuarios seleccionados
  if (selectedUsers.length === 0) {
    alert('Por favor, selecciona al menos un usuario');
    return;
  }
  
  // Ordenar los días disponibles
  availableDays.sort((a, b) => a - b);
  
  // Filtrar las sesiones que no se deben omitir
  const sessionsToSchedule = planSessions.filter(
    session => !sessionsToSkip.includes(session.id)
  );
  
  if (sessionsToSchedule.length === 0) {
    alert('No hay sesiones para programar');
    return;
  }
  
  // Obtener usuarios seleccionados
  const usersToSchedule = activeUsers.filter(
    user => selectedUsers.includes(user.id)
  );
  
  // Crear nuevos eventos para cada sesión y usuario
  const newEvents = [];
  let currentDate = new Date(startDate);
  let sessionIndex = 0;
  
  // Programar sesiones según la frecuencia y días disponibles
  while (sessionIndex < sessionsToSchedule.length) {
    const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    // Verificar si el día actual está disponible
    if (availableDays.includes(dayOfWeek) && 
        gymHours[dayOfWeek] && 
        gymHours[dayOfWeek].isOpen) {
      
      const session = sessionsToSchedule[sessionIndex];
      
      // Obtener horario de apertura del gimnasio para este día
      const openTime = gymHours[dayOfWeek]?.open?.split(':') || ['9', '00'];
      const openHour = parseInt(openTime[0]);
      const openMinute = parseInt(openTime[1]);
      
      // Crear evento para cada usuario seleccionado
      for (const user of usersToSchedule) {
        // Crear fecha de inicio (usar la hora de apertura del gimnasio)
        const startDateTime = new Date(currentDate);
        startDateTime.setHours(openHour, openMinute, 0);
        
        // Crear fecha de fin (1 hora después)
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + 1);
        
        // Crear nuevo evento
        newEvents.push({
          title: `${session.nombre || 'Sesión'} - ${user.nombre || user.email}`,
          start: startDateTime,
          end: endDateTime,
          client: user.id,
          plan: selectedPlan.id,
          session: session.id,
          notes: session.descripcion || '',
          color: selectedPlan.color || '#BBFF00',
          exercises: session.ejercicios || []
        });
      }
      
      // Avanzar a la siguiente sesión
      sessionIndex++;
    }
    
    // Avanzar a la siguiente fecha según la frecuencia
    if (frequency === 'daily') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (frequency === 'alternate') {
      currentDate.setDate(currentDate.getDate() + 2);
    } else if (frequency === 'weekdays') {
      // Si es viernes, avanzar al lunes
      if (currentDate.getDay() === 5) {
        currentDate.setDate(currentDate.getDate() + 3);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }
  
  try {
    // Guardar eventos en Firestore
    const batch = writeBatch(db);
    const eventsWithFirestoreTimestamps = [];
    
    for (const event of newEvents) {
      // Crear nuevo documento en la colección 'sesiones'
      const eventRef = doc(collection(db, 'sesiones'));
      
      // Preparar datos para Firestore
      const eventData = {
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        createdAt: new Date()
      };
      
      // Añadir al batch
      batch.set(eventRef, eventData);
      
      // Añadir a la lista con ID para actualizar la UI
      eventsWithFirestoreTimestamps.push({
        ...eventData,
        id: eventRef.id
      });
    }
    
    // Ejecutar batch
    await batch.commit();
    
    // Actualizar eventos en el estado
    setEvents([...events, ...eventsWithFirestoreTimestamps]);
    
    // Mostrar mensaje de éxito
    alert(`Se han programado ${newEvents.length} sesiones correctamente.`);
  } catch (error) {
    console.error("Error al guardar eventos:", error);
    alert("Hubo un error al guardar las sesiones. Por favor, inténtalo de nuevo.");
  }
  
  // Cerrar modal y resetear selecciones
  setOpenPlanModal(false);
  setSelectedUsers([]);
  setSelectAllUsers(false);
};