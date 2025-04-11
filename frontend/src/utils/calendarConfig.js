// Configuración para el aspecto de los eventos
export const eventPropGetter = (event) => {
  return {
    style: {
      backgroundColor: event.color || '#BBFF00',
      color: '#000000',
      borderRadius: '4px',
      border: 'none'
    }
  };
};

// Formato para los eventos
export const formats = {
  eventTimeRangeFormat: () => {
    return '';
  }
};

// Mensajes en español para el calendario
export const messages = {
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
  noEventsInRange: 'No hay sesiones en este período'
};