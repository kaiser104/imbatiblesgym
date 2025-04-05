import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Popover,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  ListItemAvatar,
  Avatar,
  Menu
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

const TrainingPlanDisplay = ({
  formData,
  groupExercisesBySession,
  handleExerciseChange,
  handlePatternMovementChange,
  handleMethodChange,
  handleSeriesChange,
  handleRestChange,
  handlePopoverOpen,
  handleAlternativesOpen,
  open,
  anchorEl,
  handlePopoverClose,
  popoverExercise,
  alternativesAnchorEl,
  handleAlternativesClose,
  alternativeExercises,
  handleSelectAlternative,
  enfoqueOptions,
  allMovementPatterns,
  methodOptions,
  equipmentFilter,
  handleEquipmentFilterChange,
  filteredAlternatives,
  equipmentOptions
}) => {
  const sessions = groupExercisesBySession();
  
  if (formData.trainingPlan.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          No hay un plan generado. Configura los parámetros y haz clic en "Generar Plan".
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Plan de Entrenamiento: {formData.planName || "Sin nombre"}
      </Typography>
      
      {Object.keys(sessions).map((sessionKey) => (
        <Accordion key={sessionKey} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{sessionKey}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {sessions[sessionKey].map((exercise, index) => {
                const globalIndex = formData.trainingPlan.indexOf(exercise);
                return (
                  <Grid item xs={12} md={6} lg={4} key={`${exercise.sessionNumber}-${exercise.exerciseNumber}`}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      maxWidth: '300px', 
                      margin: '0 auto' 
                    }}>
                      {exercise.preview && (
                        <CardMedia
                          component="img"
                          height="140"
                          image={exercise.preview}
                          alt={exercise.nombreEjercicio}
                          sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div" gutterBottom>
                          {exercise.nombreEjercicio}
                          <IconButton 
                            size="small" 
                            sx={{ ml: 1 }}
                            onClick={(e) => handlePopoverOpen(e, exercise)}
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <FormControl fullWidth size="small" margin="dense">
                              <InputLabel>Patrón de Movimiento</InputLabel>
                              <Select
                                value={exercise.patronMovimiento}
                                onChange={(e) => handlePatternMovementChange(e, globalIndex)}
                                label="Patrón de Movimiento"
                              >
                                {allMovementPatterns.map((pattern) => (
                                  <MenuItem key={pattern} value={pattern}>
                                    {pattern}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <FormControl fullWidth size="small" margin="dense">
                              <InputLabel>Método</InputLabel>
                              <Select
                                value={exercise.metodo}
                                onChange={(e) => handleMethodChange(e, globalIndex)}
                                label="Método"
                              >
                                {methodOptions.map((method) => (
                                  <MenuItem key={method} value={method}>{method}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Series"
                              type="number"
                              size="small"
                              value={exercise.series}
                              onChange={(e) => handleSeriesChange(e, globalIndex)}
                              InputProps={{ inputProps: { min: 1, max: 10 } }}
                            />
                          </Grid>
                          
                          <Grid item xs={6}>
                            <FormControl fullWidth size="small" margin="dense">
                              <InputLabel>Descanso (seg)</InputLabel>
                              <Select
                                value={exercise.rest}
                                onChange={(e) => handleRestChange(e, globalIndex)}
                                label="Descanso (seg)"
                              >
                                <MenuItem value={15}>15</MenuItem>
                                <MenuItem value={30}>30</MenuItem>
                                <MenuItem value={45}>45</MenuItem>
                                <MenuItem value={60}>60</MenuItem>
                                <MenuItem value={90}>90</MenuItem>
                                <MenuItem value={120}>120</MenuItem>
                                <MenuItem value={180}>180</MenuItem>
                                <MenuItem value={240}>240</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </CardContent>
                      
                      <CardActions>
                        <Button 
                          size="small" 
                          startIcon={<SwapHorizIcon />}
                          onClick={(e) => handleAlternativesOpen(e, exercise, globalIndex)}
                        >
                          Alternativas
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
      
      {/* Popover para detalles del ejercicio */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {popoverExercise && (
          <Box sx={{ p: 2, maxWidth: 300 }}>
            <Typography variant="h6" gutterBottom>
              {popoverExercise.nombreEjercicio}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2" gutterBottom>
              <strong>Grupo muscular:</strong> {popoverExercise.seleccionMuscular}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Patrón de movimiento:</strong> {popoverExercise.patronMovimiento}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Equipamiento:</strong> {popoverExercise.equipmentUsed}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Series:</strong> {popoverExercise.series}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Descanso:</strong> {popoverExercise.rest} segundos
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Método:</strong> {popoverExercise.metodo}
            </Typography>
          </Box>
        )}
      </Popover>
      
      {/* Diálogo para ejercicios alternativos */}
      <Dialog
        open={Boolean(alternativesAnchorEl)}
        onClose={handleAlternativesClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Seleccionar ejercicio alternativo
          <IconButton
            aria-label="close"
            onClick={handleAlternativesClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Filtrar por equipo</InputLabel>
              <Select
                value={equipmentFilter || ''}
                onChange={handleEquipmentFilterChange}
                label="Filtrar por equipo"
              >
                <MenuItem value="">Todos</MenuItem>
                {equipmentOptions && equipmentOptions.map(eq => (
                  <MenuItem key={eq} value={eq}>{eq}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Grid container spacing={2}>
            {filteredAlternatives && filteredAlternatives.map((exercise, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  cursor: 'pointer'
                }} 
                onClick={() => handleSelectAlternative(exercise)}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={exercise.previewURL || '/placeholder.jpg'}
                    alt={exercise.nombre}
                  />
                  <CardContent>
                    <Typography variant="body2" component="div">
                      {exercise.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {exercise.equipo}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TrainingPlanDisplay;