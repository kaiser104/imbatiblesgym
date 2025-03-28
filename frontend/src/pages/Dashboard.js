import React from 'react';
import { Grid, Card, CardContent, Typography, Box, CardHeader, Avatar, IconButton, CardActions, Button } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import './Dashboard.css'; // Importamos el CSS
import { 
  AdminPanelSettings,
  PeopleAlt,
  ManageAccounts
} from '@mui/icons-material';

function Dashboard() {
  return (
    <Box className="dashboard">
      <Typography variant="h5" component="h2" gutterBottom className="dashboard-title">
        Panel de Control
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography className="card-title" gutterBottom>
                  Miembros Activos
                </Typography>
                <Avatar sx={{ bgcolor: '#BBFF00' }}>
                  <GroupIcon sx={{ color: '#000000' }} />
                </Avatar>
              </Box>
              <Typography className="card-value">
                128
              </Typography>
              <Typography className="card-subtitle" sx={{ color: '#33AAFF' }}>
                +12% este mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography className="card-title" gutterBottom>
                  Clases Programadas
                </Typography>
                <Avatar sx={{ bgcolor: '#33AAFF' }}>
                  <EventIcon sx={{ color: '#000000' }} />
                </Avatar>
              </Box>
              <Typography className="card-value">
                42
              </Typography>
              <Typography className="card-subtitle">
                Esta semana
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography className="card-title" gutterBottom>
                  Entrenadores
                </Typography>
                <Avatar sx={{ bgcolor: '#BBFF00' }}>
                  <FitnessCenterIcon sx={{ color: '#000000' }} />
                </Avatar>
              </Box>
              <Typography className="card-value">
                15
              </Typography>
              <Typography className="card-subtitle">
                Disponibles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="stat-card">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography className="card-title" gutterBottom>
                  Ejercicios Realizados
                </Typography>
                <Avatar sx={{ bgcolor: '#FF5533' }}>
                  <DirectionsRunIcon sx={{ color: '#000000' }} />
                </Avatar>
              </Box>
              <Typography className="card-value">
                1,248
              </Typography>
              <Typography className="card-subtitle" sx={{ color: '#33AAFF' }}>
                +8% esta semana
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Featured Class */}
        <Grid item xs={12} md={6}>
          <Card className="featured-card">
            <CardHeader
              className="card-header"
              avatar={
                <Avatar sx={{ bgcolor: '#BBFF00' }}>
                  <FitnessCenterIcon sx={{ color: '#000000' }} />
                </Avatar>
              }
              action={
                <IconButton aria-label="settings" sx={{ color: '#BBFF00' }}>
                  <MoreVertIcon />
                </IconButton>
              }
              title={<Typography className="card-title">Clase Destacada</Typography>}
              subheader={<Typography className="card-subtitle">CrossFit Avanzado</Typography>}
            />
            <CardContent>
              <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                Entrenamiento de alta intensidad que combina levantamiento de pesas, 
                ejercicios pliométricos y movimientos funcionales. Ideal para mejorar 
                fuerza, resistencia y agilidad.
              </Typography>
            </CardContent>
            <CardActions>
              <Button className="neon-button">Ver Detalles</Button>
              <Button className="neon-button neon-button-filled">Inscribirse</Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card className="featured-card">
            <CardHeader
              className="card-header"
              title={<Typography className="card-title">Actividades Recientes</Typography>}
              subheader={<Typography className="card-subtitle">Últimas actualizaciones</Typography>}
            />
            <CardContent>
              <Box className="activity-item">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#BBFF00', mr: 2 }}>JD</Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ color: '#FFFFFF' }}>Juan Díaz completó su entrenamiento</Typography>
                    <Typography className="activity-time">Hace 2 horas</Typography>
                  </Box>
                </Box>
              </Box>
              <Box className="activity-item">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#33AAFF', mr: 2 }}>MR</Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ color: '#FFFFFF' }}>María Rodríguez se unió a la clase de Yoga</Typography>
                    <Typography className="activity-time">Hace 3 horas</Typography>
                  </Box>
                </Box>
              </Box>
              <Box className="activity-item">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#FF5533', mr: 2 }}>CL</Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ color: '#FFFFFF' }}>Carlos López actualizó su plan de nutrición</Typography>
                    <Typography className="activity-time">Hace 5 horas</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button className="neon-button">Ver Todas</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
