import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Alert, Box, Grid, Card, CardContent, 
  CardActions, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, CircularProgress, Accordion, 
  AccordionSummary, AccordionDetails, Chip, IconButton,
  Divider, Paper, List, ListItem, ListItemText, MenuItem
} from '@mui/material';
import { 
  collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import RepeatIcon from '@mui/icons-material/Repeat';
import { useNavigate } from 'react-router-dom';

const TrainingPlanManager = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Estado para el diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  
  // Estado para el diálogo de edición
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    fitnessObjective: '',
    duration: '',
    frequency: '',
    timeAvailable: ''
  });
  
  // Estado para el diálogo de detalles
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Cargar planes del usuario actual
  useEffect(() => {
    const fetchPlans = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const plansQuery = query(
          collection(db, "trainingPlans"), 
          where("userId", "==", currentUser.uid)
        );
        const plansSnapshot = await getDocs(plansQuery);
        
        const plansData = plansSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Ordenar por fecha de creación (más reciente primero)
        plansData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setPlans(plansData);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Error al cargar los planes de entrenamiento");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, [currentUser]);
  
  // Handlers para el diálogo de eliminación
  const handleOpenDeleteDialog = (plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };
  
  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      await deleteDoc(doc(db, "trainingPlans", planToDelete.id));
      
      // Actualizar la lista de planes
      setPlans(plans.filter(plan => plan.id !== planToDelete.id));
      setMessage("Plan eliminado correctamente");
      
      // Cerrar el diálogo
      handleCloseDeleteDialog();
    } catch (err) {
      console.error("Error deleting plan:", err);
      setError("Error al eliminar el plan");
    }
  };
  
  // Handlers para el diálogo de edición
  const handleOpenEditDialog = (plan) => {
    setEditingPlan(plan);
    setEditFormData({
      name: plan.name || '',
      fitnessObjective: plan.fitnessObjective || 'muscleMass',
      duration: plan.duration || '1',
      frequency: plan.frequency || '3',
      timeAvailable: plan.timeAvailable || '60'
    });
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingPlan(null);
  };
  
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUpdatePlan = async () => {
    if (!editingPlan) return;
    
    try {
      const planRef = doc(db, "trainingPlans", editingPlan.id);
      
      // Actualizar solo los campos editables
      await updateDoc(planRef, {
        name: editFormData.name,
        fitnessObjective: editFormData.fitnessObjective,
        duration: editFormData.duration,
        frequency: editFormData.frequency,
        timeAvailable: editFormData.timeAvailable
      });
      
      // Actualizar la lista de planes
      setPlans(plans.map(plan => 
        plan.id === editingPlan.id 
          ? { ...plan, ...editFormData } 
          : plan
      ));
      
      setMessage("Plan actualizado correctamente");
      
      // Cerrar el diálogo
      handleCloseEditDialog();
    } catch (err) {
      console.error("Error updating plan:", err);
      setError("Error al actualizar el plan");
    }
  };
  
  // Handlers para el diálogo de detalles
  const handleOpenDetailsDialog = (plan) => {
    setSelectedPlan(plan);
    setDetailsDialogOpen(true);
  };
  
  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedPlan(null);
  };
  
  // Función para agrupar ejercicios por sesión
  const groupExercisesBySession = (trainingPlan) => {
    if (!trainingPlan || !Array.isArray(trainingPlan)) return {};
    
    const sessions = {};
    
    trainingPlan.forEach(exercise => {
      const sessionKey = `Sesión ${exercise.sessionNumber}`;
      
      if (!sessions[sessionKey]) {
        sessions[sessionKey] = [];
      }
      
      sessions[sessionKey].push(exercise);
    });
    
    // Ordenar ejercicios dentro de cada sesión por número de ejercicio
    Object.keys(sessions).forEach(sessionKey => {
      sessions[sessionKey].sort((a, b) => a.exerciseNumber - b.exerciseNumber);
    });
    
    // Devolver las sesiones ordenadas por número de sesión
    const orderedSessions = {};
    Object.keys(sessions)
      .sort((a, b) => {
        // Extraer el número de sesión y comparar numéricamente
        const numA = parseInt(a.replace('Sesión ', ''), 10);
        const numB = parseInt(b.replace('Sesión ', ''), 10);
        return numA - numB;
      })
      .forEach(key => {
        orderedSessions[key] = sessions[key];
      });
    
    return orderedSessions;
  };
  
  // Función para crear un nuevo plan basado en uno existente
  const handleDuplicatePlan = async (plan) => {
    try {
      // Crear una copia del plan con un nuevo nombre
      const newPlan = {
        ...plan,
        name: `${plan.name} (Copia)`,
        createdAt: new Date().toISOString()
      };
      
      // Eliminar el ID para que Firestore genere uno nuevo
      delete newPlan.id;
      
      // Guardar en Firestore
      const plansCollection = collection(db, "trainingPlans");
      const docRef = await addDoc(plansCollection, newPlan);
      
      // Añadir el nuevo plan a la lista
      setPlans([
        {
          id: docRef.id,
          ...newPlan
        },
        ...plans
      ]);
      
      setMessage("Plan duplicado correctamente");
    } catch (err) {
      console.error("Error duplicating plan:", err);
      setError("Error al duplicar el plan");
    }
  };
  
  // Función para navegar al editor con un plan cargado
  const handleEditFullPlan = (plan) => {
    // Aquí podrías implementar la navegación al editor con el plan cargado
    // Por ejemplo, usando localStorage para pasar los datos o un estado global
    localStorage.setItem('editingPlan', JSON.stringify(plan));
    navigate('/training-plan-designer');
  };
  
  // Función para obtener el texto del objetivo de fitness
  const getFitnessObjectiveText = (objective) => {
    switch (objective) {
      case 'muscleMass':
        return 'Hipertrofia';
      case 'strength':
        return 'Fuerza';
      case 'conditioning':
        return 'Acondicionamiento';
      default:
        return objective;
    }
  };
  
  // Función para obtener el color del chip según el objetivo
  const getObjectiveColor = (objective) => {
    switch (objective) {
      case 'muscleMass':
        return '#BBFF00';
      case 'strength':
        return '#FF9800';
      case 'conditioning':
        return '#2196F3';
      default:
        return '#757575';
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#BBFF00' }}>
        Mis Planes de Entrenamiento
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/training-plan-designer')}
          startIcon={<FitnessCenterIcon />}
        >
          Crear Nuevo Plan
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : plans.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#121212' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            No tienes planes de entrenamiento guardados
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/training-plan-designer')}
          >
            Crear tu primer plan
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} md={6} lg={4} key={plan.id}>
              <Card sx={{ 
                bgcolor: '#121212', 
                border: '1px solid rgba(187, 255, 0, 0.2)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="div" gutterBottom>
                    {plan.name}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={getFitnessObjectiveText(plan.fitnessObjective)}
                      sx={{ 
                        bgcolor: getObjectiveColor(plan.fitnessObjective),
                        color: '#000000',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon fontSize="small" />
                      <Typography variant="body2">
                        Duración: {plan.duration} {parseInt(plan.duration) === 1 ? 'mes' : 'meses'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RepeatIcon fontSize="small" />
                      <Typography variant="body2">
                        Frecuencia: {plan.frequency} {parseInt(plan.frequency) === 1 ? 'día' : 'días'} por semana
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="body2">
                        Tiempo disponible: {plan.timeAvailable} minutos
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Creado el {new Date(plan.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    size="small" 
                    onClick={() => handleOpenDetailsDialog(plan)}
                    sx={{ color: '#BBFF00' }}
                  >
                    Ver Detalles
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => handleOpenEditDialog(plan)}
                    startIcon={<EditIcon />}
                  >
                    Editar
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => handleOpenDeleteDialog(plan)}
                    startIcon={<DeleteIcon />}
                  >
                    Eliminar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: { bgcolor: '#1E1E1E', color: '#FFFFFF' }
        }}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el plan "{planToDelete?.name}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeletePlan} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de edición */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { bgcolor: '#1E1E1E', color: '#FFFFFF' }
        }}
      >
        <DialogTitle>Editar Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nombre del Plan"
              name="name"
              value={editFormData.name}
              onChange={handleEditFormChange}
              margin="normal"
              variant="outlined"
              InputLabelProps={{
                sx: { color: '#BBFF00' }
              }}
              InputProps={{
                sx: { color: '#FFFFFF' }
              }}
            />
            
            <TextField
              select
              fullWidth
              label="Objetivo"
              name="fitnessObjective"
              value={editFormData.fitnessObjective}
              onChange={handleEditFormChange}
              margin="normal"
              variant="outlined"
              InputLabelProps={{
                sx: { color: '#BBFF00' }
              }}
              InputProps={{
                sx: { color: '#FFFFFF' }
              }}
            >
              <MenuItem value="muscleMass">Hipertrofia</MenuItem>
              <MenuItem value="strength">Fuerza</MenuItem>
              <MenuItem value="conditioning">Acondicionamiento</MenuItem>
            </TextField>
            
            <TextField
              select
              fullWidth
              label="Duración (meses)"
              name="duration"
              value={editFormData.duration}
              onChange={handleEditFormChange}
              margin="normal"
              variant="outlined"
              InputLabelProps={{
                sx: { color: '#BBFF00' }
              }}
              InputProps={{
                sx: { color: '#FFFFFF' }
              }}
            >
              <MenuItem value="1">1 mes</MenuItem>
              <MenuItem value="2">2 meses</MenuItem>
              <MenuItem value="3">3 meses</MenuItem>
              <MenuItem value="4">4 meses</MenuItem>
              <MenuItem value="6">6 meses</MenuItem>
            </TextField>
            
            <TextField
              select
              fullWidth
              label="Frecuencia (días por semana)"
              name="frequency"
              value={editFormData.frequency}
              onChange={handleEditFormChange}
              margin="normal"
              variant="outlined"
              InputLabelProps={{
                sx: { color: '#BBFF00' }
              }}
              InputProps={{
                sx: { color: '#FFFFFF' }
              }}
            >
              <MenuItem value="1">1 día</MenuItem>
              <MenuItem value="2">2 días</MenuItem>
              <MenuItem value="3">3 días</MenuItem>
              <MenuItem value="4">4 días</MenuItem>
              <MenuItem value="5">5 días</MenuItem>
              <MenuItem value="6">6 días</MenuItem>
            </TextField>
            
            <TextField
              select
              fullWidth
              label="Tiempo disponible (minutos)"
              name="timeAvailable"
              value={editFormData.timeAvailable}
              onChange={handleEditFormChange}
              margin="normal"
              variant="outlined"
              InputLabelProps={{
                sx: { color: '#BBFF00' }
              }}
              InputProps={{
                sx: { color: '#FFFFFF' }
              }}
            >
              <MenuItem value="30">30 minutos</MenuItem>
              <MenuItem value="45">45 minutos</MenuItem>
              <MenuItem value="60">60 minutos</MenuItem>
              <MenuItem value="90">90 minutos</MenuItem>
              <MenuItem value="120">120 minutos</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleUpdatePlan} color="primary" variant="contained">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de detalles del plan */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { bgcolor: '#1E1E1E', color: '#FFFFFF' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{selectedPlan?.name}</Typography>
            <IconButton onClick={handleCloseDetailsDialog} sx={{ color: '#FFFFFF' }}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#121212' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Detalles del Plan
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Objetivo" 
                            secondary={getFitnessObjectiveText(selectedPlan.fitnessObjective)} 
                            secondaryTypographyProps={{ color: 'primary' }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Duración" 
                            secondary={`${selectedPlan.duration} ${parseInt(selectedPlan.duration) === 1 ? 'mes' : 'meses'}`} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Frecuencia" 
                            secondary={`${selectedPlan.frequency} ${parseInt(selectedPlan.frequency) === 1 ? 'día' : 'días'} por semana`} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Tiempo por sesión" 
                            secondary={`${selectedPlan.timeAvailable} minutos`} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Priorización" 
                            secondary={selectedPlan.prioritizacion === 'control' ? 'Control (mismos ejercicios)' : 'Diversidad (ejercicios variados)'} 
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#121212' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Equipamiento
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedPlan.equipment && selectedPlan.equipment.map((eq, index) => (
                          <Chip 
                            key={index} 
                            label={eq} 
                            size="small" 
                            sx={{ bgcolor: 'rgba(187, 255, 0, 0.2)' }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Sesiones de Entrenamiento
              </Typography>
              
              {Object.entries(groupExercisesBySession(selectedPlan.trainingPlan)).map(([sessionKey, exercises]) => (
                <Accordion 
                  key={sessionKey} 
                  sx={{ 
                    mb: 2, 
                    bgcolor: '#121212',
                    '&:before': {
                      display: 'none',
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#BBFF00' }} />}
                    sx={{ borderBottom: '1px solid rgba(187, 255, 0, 0.2)' }}
                  >
                    <Typography>{sessionKey}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {exercises.map((exercise, index) => (
                        <React.Fragment key={index}>
                          <ListItem 
                            sx={{ 
                              bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
                              borderRadius: '4px',
                              mb: 1
                            }}
                          >
                            <Grid container spacing={1} alignItems="center">
                              <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">
                                  {exercise.nombreEjercicio}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {exercise.patronMovimiento} • {exercise.equipmentUsed}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                  <Chip 
                                    label={`${exercise.series} series`} 
                                    size="small" 
                                    sx={{ bgcolor: 'rgba(187, 255, 0, 0.2)' }}
                                  />
                                  <Chip 
                                    label={`${exercise.rest}s descanso`} 
                                    size="small" 
                                    sx={{ bgcolor: 'rgba(187, 255, 0, 0.2)' }}
                                  />
                                  <Chip 
                                    label={exercise.metodo} 
                                    size="small" 
                                    sx={{ bgcolor: 'rgba(187, 255, 0, 0.2)' }}
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              handleDuplicatePlan(selectedPlan);
              handleCloseDetailsDialog();
            }} 
            color="primary"
          >
            Duplicar Plan
          </Button>
          <Button 
            onClick={() => {
              handleEditFullPlan(selectedPlan);
              handleCloseDetailsDialog();
            }} 
            color="primary" 
            variant="contained"
          >
            Editar Plan Completo
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TrainingPlanManager;