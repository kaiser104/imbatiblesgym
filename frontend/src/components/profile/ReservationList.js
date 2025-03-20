import React from 'react';
import { 
  Typography, 
  Box
} from '@mui/material';

const ReservationList = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Mis Reservas
      </Typography>
      
      {/* Aquí iría la lista de reservas */}
      <Typography variant="body2" color="text.secondary">
        No tienes reservas activas. Puedes reservar clases en la sección de horarios.
      </Typography>
    </Box>
  );
};

export default ReservationList;