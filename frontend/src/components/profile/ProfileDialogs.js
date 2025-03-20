import React from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

export const RoomDialog = ({ 
  open, 
  onClose, 
  editingRoom, 
  editRoomData, 
  newRoom, 
  handleRoomInputChange, 
  handleAddEquipment, 
  handleRemoveEquipment, 
  handleAddRoom, 
  handleUpdateRoom, 
  setEditRoomData, 
  setNewRoom 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingRoom ? 'Editar Sala' : 'Agregar Nueva Sala'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} className="dialog-content-grid">
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre de la sala"
              name="name"
              value={editingRoom ? editRoomData.name : newRoom.name}
              onChange={editingRoom ? 
                (e) => setEditRoomData({...editRoomData, name: e.target.value}) : 
                handleRoomInputChange
              }
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Capacidad (personas)"
              name="capacity"
              type="number"
              value={editingRoom ? editRoomData.capacity : newRoom.capacity}
              onChange={editingRoom ? 
                (e) => setEditRoomData({...editRoomData, capacity: e.target.value}) : 
                handleRoomInputChange
              }
              InputProps={{ inputProps: { min: 1 } }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              name="description"
              multiline
              rows={2}
              value={editingRoom ? editRoomData.description : newRoom.description}
              onChange={editingRoom ? 
                (e) => setEditRoomData({...editRoomData, description: e.target.value}) : 
                handleRoomInputChange
              }
              placeholder="Describe esta sala y su propósito"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Equipamiento
            </Typography>
            <Box className="equipment-input-container">
              <TextField
                fullWidth
                label="Agregar equipamiento"
                name="currentEquipment"
                value={editingRoom ? editRoomData.currentEquipment : newRoom.currentEquipment}
                onChange={editingRoom ? 
                  (e) => setEditRoomData({...editRoomData, currentEquipment: e.target.value}) : 
                  (e) => setNewRoom({...newRoom, currentEquipment: e.target.value})
                }
                placeholder="Ej: Mancuernas, Bicicletas, etc."
              />
              <Button 
                variant="contained" 
                onClick={editingRoom ? 
                  () => {
                    if (editRoomData.currentEquipment && !editRoomData.equipment.includes(editRoomData.currentEquipment)) {
                      setEditRoomData({
                        ...editRoomData,
                        equipment: [...editRoomData.equipment, editRoomData.currentEquipment],
                        currentEquipment: ''
                      });
                    }
                  } : 
                  handleAddEquipment
                }
                disabled={(editingRoom ? editRoomData.currentEquipment : newRoom.currentEquipment) === ''}
              >
                Agregar
              </Button>
            </Box>
            
            <Box className="equipment-chips-container">
              {(editingRoom ? editRoomData.equipment : newRoom.equipment).map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  onDelete={editingRoom ? 
                    () => setEditRoomData({
                      ...editRoomData,
                      equipment: editRoomData.equipment.filter(eq => eq !== item)
                    }) : 
                    () => handleRemoveEquipment(item)
                  }
                  className="equipment-chip"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={editingRoom ? handleUpdateRoom : handleAddRoom} 
          variant="contained" 
          color="primary"
          disabled={(editingRoom ? 
            !editRoomData.name || !editRoomData.capacity : 
            !newRoom.name || !newRoom.capacity
          )}
        >
          {editingRoom ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ScheduleDialog = ({ 
  open, 
  onClose, 
  newSchedule, 
  setNewSchedule, 
  handleScheduleInputChange, 
  handleAddSchedule,
  userType,
  rooms // Añadimos las salas disponibles como prop
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar Nuevo Horario</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} className="dialog-content-grid">
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Días de la semana
            </Typography>
            <Box className="weekday-chips-container">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                <Chip
                  key={day}
                  label={day}
                  onClick={() => {
                    const days = newSchedule.days.includes(day)
                      ? newSchedule.days.filter(d => d !== day)
                      : [...newSchedule.days, day];
                    setNewSchedule({...newSchedule, days});
                  }}
                  color={newSchedule.days.includes(day) ? "primary" : "default"}
                  variant={newSchedule.days.includes(day) ? "filled" : "outlined"}
                  className="weekday-chip"
                />
              ))}
            </Box>
          </Grid>
          
          {/* Añadimos selector de sala para gimnasios */}
          {userType === 'gimnasio' && rooms && rooms.length > 0 && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Sala</InputLabel>
                <Select
                  name="roomId"
                  value={newSchedule.roomId || ''}
                  onChange={handleScheduleInputChange}
                  label="Sala"
                  required
                >
                  <MenuItem value="">
                    <em>Selecciona una sala</em>
                  </MenuItem>
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name} (Cap: {room.capacity})
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary">
                  Selecciona la sala donde se realizará esta actividad
                </Typography>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Hora de inicio"
              name="startTime"
              type="time"
              value={newSchedule.startTime}
              onChange={handleScheduleInputChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Duración (minutos)"
              name="duration"
              type="number"
              value={newSchedule.duration}
              onChange={handleScheduleInputChange}
              InputProps={{ inputProps: { min: 15, step: 15 } }}
              required
            />
          </Grid>
          
          {userType === 'entrenador' && (
            <>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Ubicación</InputLabel>
                  <Select
                    name="location"
                    value={newSchedule.location}
                    onChange={handleScheduleInputChange}
                    label="Ubicación"
                  >
                    <MenuItem value="sede">En sede</MenuItem>
                    <MenuItem value="domicilio">A domicilio</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tiempo de transporte (minutos)"
                  name="travelTime"
                  type="number"
                  value={newSchedule.travelTime}
                  onChange={handleScheduleInputChange}
                  helperText="Tiempo estimado para trasladarse a la siguiente clase"
                  InputProps={{ inputProps: { min: 0, step: 5 } }}
                />
              </Grid>
            </>
          )}
          
          <Grid item xs={12}>
            <Box className="capacity-toggle-container">
              <Chip
                label={newSchedule.unlimitedCapacity ? "Capacidad ilimitada" : "Capacidad limitada"}
                onClick={() => setNewSchedule({...newSchedule, unlimitedCapacity: !newSchedule.unlimitedCapacity})}
                color={newSchedule.unlimitedCapacity ? "primary" : "default"}
                variant={newSchedule.unlimitedCapacity ? "filled" : "outlined"}
                className="capacity-toggle-chip"
              />
            </Box>
            
            {!newSchedule.unlimitedCapacity && (
              <TextField
                fullWidth
                label="Capacidad (personas)"
                name="capacity"
                type="number"
                value={newSchedule.capacity}
                onChange={handleScheduleInputChange}
                InputProps={{ inputProps: { min: 1 } }}
                required
              />
            )}
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              name="description"
              multiline
              rows={2}
              value={newSchedule.description}
              onChange={handleScheduleInputChange}
              placeholder="Detalles adicionales sobre este horario"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={handleAddSchedule} 
          variant="contained" 
          color="primary"
          disabled={
            !newSchedule.startTime || 
            newSchedule.days.length === 0 || 
            (!newSchedule.unlimitedCapacity && !newSchedule.capacity) ||
            (userType === 'gimnasio' && !newSchedule.roomId) // Añadimos validación para la sala
          }
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};