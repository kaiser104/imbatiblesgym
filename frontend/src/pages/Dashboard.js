import React from 'react';
import { Grid, Card, CardContent, Typography, Box, CardHeader, Avatar, IconButton, CardActions, Button } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';

function Dashboard() {
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Panel de Control
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', backgroundColor: 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  Miembros Activos
                </Typography>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <GroupIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div">
                128
              </Typography>
              <Typography variant="body2" color="success.main">
                +12% este mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', backgroundColor: 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  Clases Programadas
                </Typography>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <EventIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div">
                42
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Esta semana
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', backgroundColor: 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  Entrenadores
                </Typography>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <FitnessCenterIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div">
                15
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Disponibles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', backgroundColor: 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  Ejercicios Realizados
                </Typography>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <DirectionsRunIcon />
                </Avatar>
              </Box>
              <Typography variant="h4" component="div">
                1,248
              </Typography>
              <Typography variant="body2" color="success.main">
                +8% esta semana
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Featured Class */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: 'background.paper' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <FitnessCenterIcon />
                </Avatar>
              }
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              title="Clase Destacada"
              subheader="CrossFit Avanzado"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Entrenamiento de alta intensidad que combina levantamiento de pesas, 
                ejercicios pliométricos y movimientos funcionales. Ideal para mejorar 
                fuerza, resistencia y agilidad.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary">Ver Detalles</Button>
              <Button size="small" variant="contained" color="primary">Inscribirse</Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: 'background.paper' }}>
            <CardHeader
              title="Actividades Recientes"
              subheader="Últimas actualizaciones"
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>JD</Avatar>
                <Box>
                  <Typography variant="body1">Juan Díaz completó su entrenamiento</Typography>
                  <Typography variant="body2" color="text.secondary">Hace 2 horas</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>MR</Avatar>
                <Box>
                  <Typography variant="body1">María Rodríguez se unió a la clase de Yoga</Typography>
                  <Typography variant="body2" color="text.secondary">Hace 3 horas</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>CL</Avatar>
                <Box>
                  <Typography variant="body1">Carlos López actualizó su plan de nutrición</Typography>
                  <Typography variant="body2" color="text.secondary">Hace 5 horas</Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary">Ver Todas</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
