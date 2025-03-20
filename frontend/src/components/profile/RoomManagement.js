import React from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Button, 
  Card,
  CardContent,
  IconButton,
  Chip
} from '@mui/material';
import { 
  Add,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const RoomManagement = ({ rooms, handleOpenRoomDialog, handleEditRoom, handleDeleteRoom }) => {
  return (
    <Box>
      <Box className="profile-section-header">
        <Typography variant="h6">Mis Salas</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleOpenRoomDialog}
        >
          Agregar Sala
        </Button>
      </Box>
      
      {rooms.length > 0 ? (
        <Grid container spacing={2}>
          {rooms.map((room) => (
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
                          <Chip key={index} label={item} size="small" />
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

export default RoomManagement;