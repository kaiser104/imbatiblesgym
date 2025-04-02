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
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InfoIcon from '@mui/icons-material/Info';

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
  methodOptions
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
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                              <InputLabel>Enfoque</InputLabel>
                              <Select
                                value={exercise.enfoque}
                                onChange={(e) => handleExerciseChange(e, globalIndex)}
                                label="Enfoque"
                              >
                                {enfoqueOptions.map((option) => (
                                  <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <FormControl fullWidth size="small" margin="dense">
                              <InputLabel>Patrón de Movimiento</InputLabel>
                              <Select
                                value={exercise.patronMovimiento}
                                onChange={(e) => handlePatternMovementChange(e, globalIndex)}
                                label="Patrón de Movimiento"
                              >
                                {allMovementPatterns.map((pattern) => (
                                  <MenuItem key={pattern} value={pattern}>{pattern}</MenuItem>
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
                                <MenuItem value="30-60">30-60 seg</MenuItem>
                                <MenuItem value="60-90">60-90 seg</MenuItem>
                                <MenuItem value="90-120">90-120 seg</MenuItem>
                                <MenuItem value="120-180">2-3 min</MenuItem>
                                <MenuItem value="180-240">3-4 min</MenuItem>
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
      
      {/* Popover para ejercicios alternativos */}
      <Popover
        open={Boolean(alternativesAnchorEl)}
        anchorEl={alternativesAnchorEl}
        onClose={handleAlternativesClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Ejercicios Alternativos
          </Typography>
          <Divider sx={{ mb: 1 }} />
          
          {alternativeExercises.length === 0 ? (
            <Typography variant="body2">
              No hay ejercicios alternativos disponibles para este patrón de movimiento.
            </Typography>
          ) : (
            <List>
              {alternativeExercises.map((exercise) => (
                <ListItem 
                  key={exercise.id}
                  button
                  onClick={() => handleSelectAlternative(exercise)}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <ListItemText 
                    primary={exercise.nombre} 
                    secondary={`Equipo: ${exercise.equipo}`}
                  />
                  {exercise.previewURL && (
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <img 
                        src={exercise.previewURL} 
                        alt={exercise.nombre}
                        style={{ width: '100%', height: 'auto', maxHeight: 100, objectFit: 'contain' }}
                      />
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default TrainingPlanDisplay;