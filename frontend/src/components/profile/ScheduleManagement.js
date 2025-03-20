import React from 'react';
import { 
  Typography, 
  Box, 
  Button
} from '@mui/material';
import { Add } from '@mui/icons-material';

const ScheduleManagement = ({ handleOpenScheduleDialog }) => {
  return (
    <Box>
      <Box className="profile-section-header">
        <Typography variant="h6">Mis Horarios</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleOpenScheduleDialog}
        >
          Agregar Horario
        </Button>
      </Box>
      
      {/* Aquí iría la lista de horarios */}
      <Typography variant="body2" color="text.secondary">
        No has agregado ningún horario aún. Los horarios te permiten organizar tu disponibilidad.
      </Typography>
    </Box>
  );
};

export default ScheduleManagement;