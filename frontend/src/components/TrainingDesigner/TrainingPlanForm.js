import React, { useState } from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Divider,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoIcon from '@mui/icons-material/Info';

const TrainingPlanForm = ({
  formData,
  handleChange,
  handleCustomMuscleChange,
  handleEquipmentChange,
  selectAllEquipment,
  generatePlan,
  savePlan,
  generatingPlan,
  muscleOptions,
  customMuscleOptions,
  equipmentOptions,
  handleDayCharacteristicChange
}) => {
  // Estados para la UI mejorada
  const [compactView, setCompactView] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});
  const [equipmentCompact, setEquipmentCompact] = useState(false);
  
  // Mapeo de características a etiquetas más amigables
  const characteristicLabels = {
    'push': 'Empuje',
    'pull': 'Tirón',
    'legs': 'Piernas',
    'upper': 'Superior',
    'lower': 'Inferior',
    'fullBody': 'Full Body',
    'hipDominant': 'Dom. Cadera',
    'kneeDominant': 'Dom. Rodilla',
    'core': 'Core',
    'explosive': 'Explosivo',
    'mobility': 'Movilidad',
    'cardio': 'Cardio',
    'auxiliary': 'Auxiliar'
  };
  
  // Función para manejar el drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // Actualizar el orden de los días
    const updatedTrainingDays = [...(formData.trainingDays || [])];
    const [movedDay] = updatedTrainingDays.splice(sourceIndex, 1);
    updatedTrainingDays.splice(destinationIndex, 0, movedDay);
    
    // Actualizar el estado
    const updatedFormData = {
      ...formData,
      trainingDays: updatedTrainingDays
    };
    
    // Actualizar el estado en el componente padre
    // Esto requiere una función adicional en el componente padre
    // Por ahora, simplemente actualizamos el estado local
    // handleUpdateTrainingDays(updatedTrainingDays);
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#121212', border: '1px solid rgba(187, 255, 0, 0.3)' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#BBFF00', fontWeight: 700 }}>
        Configuración del Plan
      </Typography>
      
      <Grid container spacing={3}>
        {/* Objetivo de fitness */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="fitness-objective-label">Objetivo de Fitness</InputLabel>
            <Select
              labelId="fitness-objective-label"
              id="fitnessObjective"
              name="fitnessObjective"
              value={formData.fitnessObjective}
              onChange={handleChange}
              label="Objetivo de Fitness"
            >
              <MenuItem value="muscleMass">Hipertrofia (Aumento de masa muscular)</MenuItem>
              <MenuItem value="strength">Fuerza</MenuItem>
              <MenuItem value="conditioning">Acondicionamiento</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Priorización */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="prioritizacion-label">Priorización</InputLabel>
            <Select
              labelId="prioritizacion-label"
              id="prioritizacion"
              name="prioritizacion"
              value={formData.prioritizacion}
              onChange={handleChange}
              label="Priorización"
            >
              <MenuItem value="diversidad">Diversidad (Ejercicios variados)</MenuItem>
              <MenuItem value="control">Control (Mismos ejercicios por semana)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Eliminar el campo de Duración aquí */}
        
        {/* Frecuencia */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="frequency-label">Frecuencia (sesiones/semana)</InputLabel>
            <Select
              labelId="frequency-label"
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              label="Frecuencia (sesiones/semana)"
            >
              <MenuItem value="2">2 veces por semana</MenuItem>
              <MenuItem value="3">3 veces por semana</MenuItem>
              <MenuItem value="4">4 veces por semana</MenuItem>
              <MenuItem value="5">5 veces por semana</MenuItem>
              <MenuItem value="6">6 veces por semana</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Tiempo disponible */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="time-available-label">Tiempo disponible (minutos)</InputLabel>
            <Select
              labelId="time-available-label"
              id="timeAvailable"
              name="timeAvailable"
              value={formData.timeAvailable}
              onChange={handleChange}
              label="Tiempo disponible (minutos)"
            >
              <MenuItem value="30">30 minutos</MenuItem>
              <MenuItem value="45">45 minutos</MenuItem>
              <MenuItem value="60">60 minutos</MenuItem>
              <MenuItem value="90">90 minutos</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Constructor de días de entrenamiento */}
        {formData.frequency > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#BBFF00', fontWeight: 700 }}>
                Constructor de Días
              </Typography>
              <Box>
                <Button 
                  size="small" 
                  variant="outlined" 
                  sx={{ 
                    color: '#BBFF00', 
                    borderColor: '#BBFF00', 
                    mr: 1,
                    '&:hover': { borderColor: '#CCFF33', backgroundColor: 'rgba(187, 255, 0, 0.1)' } 
                  }}
                  onClick={() => setCompactView(!compactView)}
                >
                  {compactView ? 'Vista Detallada' : 'Vista Compacta'}
                </Button>
              </Box>
            </Box>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="days">
                {(provided) => (
                  <Box {...provided.droppableProps} ref={provided.innerRef}>
                    {Array.from({ length: parseInt(formData.frequency) }).map((_, index) => (
                      <Draggable key={`day-${index}`} draggableId={`day-${index}`} index={index}>
                        {(provided) => (
                          <Paper 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{ 
                              p: 2, 
                              mb: 2, 
                              bgcolor: '#121212', 
                              border: '1px solid rgba(187, 255, 0, 0.3)', 
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 0 10px rgba(187, 255, 0, 0.2)'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <div {...provided.dragHandleProps}>
                                  <DragIndicatorIcon sx={{ color: '#BBFF00', mr: 1, cursor: 'grab' }} />
                                </div>
                                <Typography variant="subtitle1" sx={{ color: '#BBFF00', fontWeight: 600 }}>
                                  Día {index + 1}
                                  {formData.trainingDays?.[index]?.characteristics?.length > 0 && (
                                    <Typography component="span" sx={{ color: '#FFFFFF', ml: 1, fontSize: '0.9rem' }}>
                                      ({formData.trainingDays?.[index]?.characteristics.map(c => 
                                        characteristicLabels[c] || c
                                      ).join(', ')})
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                              <IconButton 
                                size="small" 
                                onClick={() => setExpandedDays(prev => ({...prev, [index]: !prev[index]}))}
                                sx={{ color: '#BBFF00' }}
                              >
                                {expandedDays[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </Box>
                            
                            <Collapse in={!compactView || expandedDays[index]}>
                              <Grid container spacing={1}>
                                <Grid item xs={12} md={4}>
                                  <FormGroup sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="caption" sx={{ color: '#BBFF00', mb: 1, fontWeight: 600 }}>
                                      PATRONES DE EMPUJE
                                    </Typography>
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('push') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'push')}
                                          sx={{ 
                                            color: 'rgba(255, 102, 102, 0.5)',
                                            '&.Mui-checked': { color: '#FF6666' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Push (Empuje)</Typography>
                                          <Tooltip title="Ejercicios que involucran empujar peso alejándolo del cuerpo, como press de banca o press de hombros">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('upper') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'upper')}
                                          sx={{ 
                                            color: 'rgba(255, 102, 102, 0.5)',
                                            '&.Mui-checked': { color: '#FF6666' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Upper (Superior)</Typography>
                                          <Tooltip title="Ejercicios enfocados en la parte superior del cuerpo, incluyendo pecho, espalda, hombros y brazos">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                  </FormGroup>
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                  <FormGroup sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="caption" sx={{ color: '#BBFF00', mb: 1, fontWeight: 600 }}>
                                      PATRONES DE TIRÓN
                                    </Typography>
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('pull') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'pull')}
                                          sx={{ 
                                            color: 'rgba(102, 178, 255, 0.5)',
                                            '&.Mui-checked': { color: '#66B2FF' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Pull (Tirón)</Typography>
                                          <Tooltip title="Ejercicios que involucran tirar del peso hacia el cuerpo, como dominadas o remos">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('hipDominant') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'hipDominant')}
                                          sx={{ 
                                            color: 'rgba(102, 178, 255, 0.5)',
                                            '&.Mui-checked': { color: '#66B2FF' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Dominantes de cadera</Typography>
                                          <Tooltip title="Ejercicios donde la cadera es el punto principal de movimiento, como peso muerto o hip thrust">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                  </FormGroup>
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                  <FormGroup sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="caption" sx={{ color: '#BBFF00', mb: 1, fontWeight: 600 }}>
                                      PIERNAS Y OTROS
                                    </Typography>
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('legs') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'legs')}
                                          sx={{ 
                                            color: 'rgba(102, 255, 178, 0.5)',
                                            '&.Mui-checked': { color: '#66FFB2' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Legs (Piernas)</Typography>
                                          <Tooltip title="Ejercicios enfocados en las piernas, incluyendo cuádriceps, isquiotibiales y pantorrillas">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('kneeDominant') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'kneeDominant')}
                                          sx={{ 
                                            color: 'rgba(102, 255, 178, 0.5)',
                                            '&.Mui-checked': { color: '#66FFB2' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Dominantes de rodilla</Typography>
                                          <Tooltip title="Ejercicios donde la rodilla es el punto principal de movimiento, como sentadillas o prensa de piernas">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                  </FormGroup>
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                  <FormGroup sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="caption" sx={{ color: '#BBFF00', mb: 1, fontWeight: 600 }}>
                                      COMPLEMENTARIOS
                                    </Typography>
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('core') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'core')}
                                          sx={{ 
                                            color: 'rgba(255, 204, 102, 0.5)',
                                            '&.Mui-checked': { color: '#FFCC66' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Core</Typography>
                                          <Tooltip title="Ejercicios enfocados en la zona media del cuerpo, incluyendo abdominales y lumbares">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('explosive') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'explosive')}
                                          sx={{ 
                                            color: 'rgba(255, 204, 102, 0.5)',
                                            '&.Mui-checked': { color: '#FFCC66' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Explosividad</Typography>
                                          <Tooltip title="Ejercicios que desarrollan potencia y velocidad, como saltos o lanzamientos">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                  </FormGroup>
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                  <FormGroup sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="caption" sx={{ color: '#BBFF00', mb: 1, fontWeight: 600 }}>
                                      FUNCIONALES
                                    </Typography>
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('mobility') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'mobility')}
                                          sx={{ 
                                            color: 'rgba(204, 102, 255, 0.5)',
                                            '&.Mui-checked': { color: '#CC66FF' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Movilidad</Typography>
                                          <Tooltip title="Ejercicios que mejoran el rango de movimiento y la flexibilidad">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('cardio') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'cardio')}
                                          sx={{ 
                                            color: 'rgba(204, 102, 255, 0.5)',
                                            '&.Mui-checked': { color: '#CC66FF' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Cardio</Typography>
                                          <Tooltip title="Ejercicios cardiovasculares que mejoran la resistencia y el sistema cardiovascular">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                  </FormGroup>
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                  <FormGroup sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="caption" sx={{ color: '#BBFF00', mb: 1, fontWeight: 600 }}>
                                      OTROS
                                    </Typography>
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('fullBody') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'fullBody')}
                                          sx={{ 
                                            color: 'rgba(187, 255, 0, 0.5)',
                                            '&.Mui-checked': { color: '#BBFF00' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Full Body (Cuerpo completo)</Typography>
                                          <Tooltip title="Entrenamiento que trabaja todos los grupos musculares principales en una sola sesión">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                    <FormControlLabel
                                      control={
                                        <Checkbox 
                                          checked={formData.trainingDays?.[index]?.characteristics?.includes('auxiliary') || false}
                                          onChange={(e) => handleDayCharacteristicChange(e, index, 'auxiliary')}
                                          sx={{ 
                                            color: 'rgba(187, 255, 0, 0.5)',
                                            '&.Mui-checked': { color: '#BBFF00' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Typography sx={{ color: '#FFFFFF' }}>Auxiliares</Typography>
                                          <Tooltip title="Ejercicios complementarios que se enfocan en músculos específicos o asistentes">
                                            <InfoIcon sx={{ ml: 0.5, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }} />
                                          </Tooltip>
                                        </Box>
                                      }
                                    />
                                  </FormGroup>
                                </Grid>
                              </Grid>
                            </Collapse>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          </Grid>
      )}
      
      {/* Equipamiento disponible */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ color: '#BBFF00', fontWeight: 600 }}>
          Equipamiento disponible:
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={selectAllEquipment}
            sx={{ 
              color: '#BBFF00', 
              borderColor: '#BBFF00',
              '&:hover': { borderColor: '#CCFF33', backgroundColor: 'rgba(187, 255, 0, 0.1)' } 
            }}
          >
            Seleccionar Todo
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => setEquipmentCompact(!equipmentCompact)}
            sx={{ 
              color: '#BBFF00', 
              borderColor: '#BBFF00',
              '&:hover': { borderColor: '#CCFF33', backgroundColor: 'rgba(187, 255, 0, 0.1)' } 
            }}
          >
            {equipmentCompact ? 'Mostrar Todos' : 'Vista Compacta'}
          </Button>
        </Box>
        
        <Grid container spacing={1}>
          {equipmentOptions.map((equipment, index) => (
            <Grid item xs={6} sm={4} md={3} key={equipment}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.equipment.includes(equipment)}
                    onChange={handleEquipmentChange}
                    value={equipment}
                    sx={{ 
                      color: 'rgba(187, 255, 0, 0.5)',
                      '&.Mui-checked': { color: '#BBFF00' }
                    }}
                  />
                }
                label={equipment}
                sx={{ 
                  color: '#FFFFFF',
                  display: equipmentCompact && !formData.equipment.includes(equipment) ? 'none' : 'flex'
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* Nombre del plan */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Nombre del Plan"
          name="planName"
          value={formData.planName}
          onChange={handleChange}
          variant="outlined"
        />
      </Grid>
    </Grid>
    
    <Divider sx={{ my: 3 }} />
    
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button
        variant="contained"
        color="primary"
        onClick={generatePlan}
        disabled={generatingPlan}
        startIcon={generatingPlan ? <CircularProgress size={20} /> : null}
      >
        {generatingPlan ? 'Generando...' : 'Generar Plan'}
      </Button>
      
      <Button
        variant="outlined"
        color="secondary"
        onClick={savePlan}
        disabled={formData.trainingPlan.length === 0 || generatingPlan}
      >
        Guardar Plan
      </Button>
    </Box>
  </Paper>
);
};

export default TrainingPlanForm;

const equipmentOptions = [
  'Trineo', 'Suspensión', 'Rodillo de espuma', 'Polea', 'Peso Corporal',
  'Fit ball', 'Mancuernas', 'Landmine', 'Kettlebell', 'Disco',
  'Cuerda de batida', 'Chaleco con peso', 'Bolsa de arena', 'Bola de lacrosse',
  'Barra', 'Power band', 'Balón medicinal', 'Máquinas', 'Bandas elásticas'
];