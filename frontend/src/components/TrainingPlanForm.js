import React from 'react';
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
  CircularProgress
} from '@mui/material';

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
  equipmentOptions
}) => {
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
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
        
        {/* Duración */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="duration-label">Duración (meses)</InputLabel>
            <Select
              labelId="duration-label"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              label="Duración (meses)"
            >
              <MenuItem value="1">1 mes</MenuItem>
              <MenuItem value="2">2 meses</MenuItem>
              <MenuItem value="3">3 meses</MenuItem>
              <MenuItem value="6">6 meses</MenuItem>
              <MenuItem value="12">12 meses</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Frecuencia */}
        <Grid item xs={12} md={4}>
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
        <Grid item xs={12} md={4}>
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
        
        {/* Selección de músculos */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="muscle-selection-label">Selección de Músculos</InputLabel>
            <Select
              labelId="muscle-selection-label"
              id="muscleSelection"
              name="muscleSelection"
              value={formData.muscleSelection}
              onChange={handleChange}
              label="Selección de Músculos"
            >
              {muscleOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Músculos personalizados */}
        {formData.muscleSelection === 'Personalizado' && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Selecciona los grupos musculares:
            </Typography>
            <FormGroup row>
              {customMuscleOptions.map((muscle) => (
                <FormControlLabel
                  key={muscle}
                  control={
                    <Checkbox
                      checked={formData.customMuscles.includes(muscle)}
                      onChange={handleCustomMuscleChange}
                      value={muscle}
                    />
                  }
                  label={muscle}
                />
              ))}
            </FormGroup>
          </Grid>
        )}
        
        {/* Equipamiento disponible */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Equipamiento disponible:
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={selectAllEquipment}
            >
              Seleccionar todo
            </Button>
          </Box>
          <FormGroup row>
            {equipmentOptions.map((equipment) => (
              <FormControlLabel
                key={equipment}
                control={
                  <Checkbox
                    checked={formData.equipment.includes(equipment)}
                    onChange={handleEquipmentChange}
                    value={equipment}
                  />
                }
                label={equipment}
              />
            ))}
          </FormGroup>
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