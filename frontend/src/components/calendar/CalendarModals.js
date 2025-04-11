import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, MenuItem, FormControl, InputLabel, 
  Select, Grid, Typography, Box, Checkbox, Divider, 
  ListItemText, Chip, OutlinedInput, FormGroup, FormControlLabel
} from '@mui/material';
import { FitnessCenter as FitnessCenterIcon, Delete as DeleteIcon } from '@mui/icons-material';
import moment from 'moment';

// Modal para crear/editar eventos
export const EventModal = ({ 
  openModal, 
  handleCloseModal, 
  selectedEvent, 
  eventForm, 
  handleFormChange, 
  handleDateChange, 
  handleSaveEvent, 
  handleDeleteEvent,
  trainingPlans,
  activeUsers
}) => {
  return (
    <Dialog 
      open={openModal} 
      onClose={handleCloseModal}
      maxWidth="md"
      fullWidth
      className="event-modal"
    >
      <DialogTitle className="event-modal-title">
        {selectedEvent ? 'Editar Sesión' : 'Nueva Sesión'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="title"
              label="Título de la sesión"
              value={eventForm.title}
              onChange={handleFormChange}
              fullWidth
              required
              variant="outlined"
              className="event-form-field"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="start"
              label="Fecha y hora de inicio"
              type="datetime-local"
              value={moment(eventForm.start).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleDateChange('start', new Date(e.target.value))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              className="event-form-field"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="end"
              label="Fecha y hora de fin"
              type="datetime-local"
              value={moment(eventForm.end).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleDateChange('end', new Date(e.target.value))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              className="event-form-field"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" className="event-form-field">
              <InputLabel>Plan de entrenamiento</InputLabel>
              <Select
                name="plan"
                value={eventForm.plan}
                onChange={handleFormChange}
                label="Plan de entrenamiento"
              >
                <MenuItem value="">
                  <em>Ninguno</em>
                </MenuItem>
                {trainingPlans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name || plan.nombre || plan.planName || 'Plan sin nombre'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined" className="event-form-field">
              <InputLabel>Cliente</InputLabel>
              <Select
                name="client"
                value={eventForm.client}
                onChange={handleFormChange}
                label="Cliente"
              >
                <MenuItem value="">
                  <em>Ninguno</em>
                </MenuItem>
                {activeUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.nombre} {user.apellido || ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="notes"
              label="Notas"
              value={eventForm.notes}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              className="event-form-field"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" className="event-form-field">
              <InputLabel>Color</InputLabel>
              <Select
                name="color"
                value={eventForm.color}
                onChange={handleFormChange}
                label="Color"
              >
                <MenuItem value="#BBFF00">Verde Neón</MenuItem>
                <MenuItem value="#FF00BB">Rosa Neón</MenuItem>
                <MenuItem value="#00BBFF">Azul Neón</MenuItem>
                <MenuItem value="#FFBB00">Naranja Neón</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCloseModal} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSaveEvent} 
          variant="contained" 
          color="primary"
        >
          Guardar
        </Button>
        {selectedEvent && (
          <Button 
            onClick={handleDeleteEvent} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Eliminar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Modal para programar un plan completo
// Update the PlanModal component props to include gymHours
export const PlanModal = ({
  openPlanModal,
  setOpenPlanModal,
  selectedPlan,
  loadPlanSessions,
  trainingPlans,
  startDate,
  setStartDate,
  frequency,
  setFrequency,
  planSessions,
  sessionsToSkip,
  setSessionsToSkip,
  selectAllUsers,
  handleSelectAllUsers,
  activeUsers,
  selectedUsers,
  handleUserSelection,
  schedulePlan,
  selectedDays,
  handleDaySelection,
  gymHours
}) => {
  return (
    <Dialog 
      open={openPlanModal} 
      onClose={() => setOpenPlanModal(false)}
      maxWidth="md"
      fullWidth
      className="event-modal"
    >
      <DialogTitle className="event-modal-title">
        Programar Plan de Entrenamiento
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" className="event-form-field">
              <InputLabel>Plan de entrenamiento</InputLabel>
              <Select
                value={selectedPlan ? selectedPlan.id : ''}
                onChange={(e) => loadPlanSessions(e.target.value)}
                label="Plan de entrenamiento"
              >
                <MenuItem value="">
                  <em>Seleccionar un plan</em>
                </MenuItem>
                {trainingPlans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name || plan.nombre || plan.planName || 'Plan sin nombre'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Fecha de inicio"
              type="date"
              value={moment(startDate).format('YYYY-MM-DD')}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              className="event-form-field"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Frecuencia:
            </Typography>
            <FormControl fullWidth variant="outlined" className="event-form-field">
              <InputLabel>Tipo de frecuencia</InputLabel>
              <Select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                label="Tipo de frecuencia"
              >
                <MenuItem value="daily">Diario</MenuItem>
                <MenuItem value="alternate">Días alternos</MenuItem>
                <MenuItem value="weekdays">Solo días laborables</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
              </Select>
            </FormControl>
            
            {frequency === 'custom' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selecciona los días de la semana:
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={<Checkbox checked={selectedDays.includes(1)} onChange={(e) => handleDaySelection(e, 1)} />}
                    label="Lunes"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={selectedDays.includes(2)} onChange={(e) => handleDaySelection(e, 2)} />}
                    label="Martes"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={selectedDays.includes(3)} onChange={(e) => handleDaySelection(e, 3)} />}
                    label="Miércoles"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={selectedDays.includes(4)} onChange={(e) => handleDaySelection(e, 4)} />}
                    label="Jueves"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={selectedDays.includes(5)} onChange={(e) => handleDaySelection(e, 5)} />}
                    label="Viernes"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={selectedDays.includes(6)} onChange={(e) => handleDaySelection(e, 6)} />}
                    label="Sábado"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={selectedDays.includes(0)} onChange={(e) => handleDaySelection(e, 0)} />}
                    label="Domingo"
                  />
                </FormGroup>
              </Box>
            )}
          </Grid>
          
          {planSessions.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Sesiones a programar:
              </Typography>
              <FormControl fullWidth variant="outlined" className="event-form-field">
                <InputLabel>Sesiones a omitir</InputLabel>
                <Select
                  multiple
                  value={sessionsToSkip}
                  onChange={(e) => setSessionsToSkip(e.target.value)}
                  input={<OutlinedInput label="Sesiones a omitir" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={`Sesión ${value}`} />
                      ))}
                    </Box>
                  )}
                >
                  {planSessions.map((session) => (
                    <MenuItem key={session.sessionNumber} value={session.sessionNumber}>
                      <Checkbox checked={sessionsToSkip.indexOf(session.sessionNumber) > -1} />
                      <ListItemText primary={`Sesión ${session.sessionNumber}: ${session.nombreEjercicio || 'Entrenamiento'}`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Seleccionar usuarios:
            </Typography>
            <FormControl fullWidth variant="outlined" className="event-form-field">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Checkbox
                  checked={selectAllUsers}
                  onChange={handleSelectAllUsers}
                  color="primary"
                />
                <Typography variant="body1">Seleccionar todos</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {activeUsers.map((user) => (
                  <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Checkbox
                      checked={selectedUsers.indexOf(user.id) !== -1}
                      onChange={(event) => handleUserSelection(event, user.id)}
                      color="primary"
                    />
                    <Typography variant="body1">
                      {user.nombre} {user.apellido || ''}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setOpenPlanModal(false)} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={schedulePlan} 
          variant="contained" 
          color="primary"
          startIcon={<FitnessCenterIcon />}
          disabled={!selectedPlan || planSessions.length === 0 || selectedUsers.length === 0}
        >
          Programar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 5. Crear un nuevo componente modal para configurar horarios

// Add this component to your existing CalendarModals.js file

export const GymHoursModal = ({ 
  open, 
  onClose, 
  gymHours, 
  handleGymHoursChange, 
  saveGymHours 
}) => {
  const dayNames = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 
    'Jueves', 'Viernes', 'Sábado'
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configurar Horarios del Gimnasio</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {Object.keys(gymHours).map(day => (
            <Grid item xs={12} key={day}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={gymHours[day].isOpen}
                      onChange={(e) => handleGymHoursChange(day, 'isOpen', e.target.checked)}
                    />
                  }
                  label={dayNames[day]}
                />
                
                {gymHours[day].isOpen && (
                  <>
                    <TextField
                      label="Hora de apertura"
                      type="time"
                      value={gymHours[day].open}
                      onChange={(e) => handleGymHoursChange(day, 'open', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ ml: 2, width: 150 }}
                    />
                    <TextField
                      label="Hora de cierre"
                      type="time"
                      value={gymHours[day].close}
                      onChange={(e) => handleGymHoursChange(day, 'close', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ ml: 2, width: 150 }}
                    />
                  </>
                )}
              </Box>
              {parseInt(day) < 6 && <Divider />}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={saveGymHours} variant="contained" color="primary">
          Guardar Horarios
        </Button>
      </DialogActions>
    </Dialog>
  );
};