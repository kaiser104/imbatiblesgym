import React from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Box, 
  Rating, 
  Chip, 
  CardActions 
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

function Gimnasios() {
  // Datos de ejemplo para los gimnasios
  const gimnasios = [
    {
      id: 1,
      nombre: "Imbatibles Central",
      direccion: "Av. Principal 123, Ciudad",
      horario: "Lun-Vie: 6am-10pm, Sab-Dom: 8am-8pm",
      rating: 4.8,
      imagen: "https://source.unsplash.com/random/800x600/?gym",
      servicios: ["Pesas", "Cardio", "Clases grupales", "Sauna"]
    },
    {
      id: 2,
      nombre: "Imbatibles Norte",
      direccion: "Calle Norte 456, Ciudad",
      horario: "Lun-Vie: 5am-11pm, Sab-Dom: 7am-9pm",
      rating: 4.5,
      imagen: "https://source.unsplash.com/random/800x600/?fitness",
      servicios: ["Pesas", "Cardio", "Piscina", "Spa"]
    },
    {
      id: 3,
      nombre: "Imbatibles Elite",
      direccion: "Plaza Central 789, Ciudad",
      horario: "24/7",
      rating: 4.9,
      imagen: "https://source.unsplash.com/random/800x600/?workout",
      servicios: ["Pesas", "Cardio", "Entrenamiento personal", "Nutrición"]
    },
  ];

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Sedes Inscritas
      </Typography>
      
      <Grid container spacing={3}>
        {gimnasios.map((gimnasio) => (
          <Grid item xs={12} md={6} lg={4} key={gimnasio.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={gimnasio.imagen}
                alt={gimnasio.nombre}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {gimnasio.nombre}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={gimnasio.rating} precision={0.1} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {gimnasio.rating}/5
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOnIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {gimnasio.direccion}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTimeIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {gimnasio.horario}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Servicios:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {gimnasio.servicios.map((servicio, index) => (
                      <Chip 
                        key={index} 
                        label={servicio} 
                        size="small" 
                        icon={<FitnessCenterIcon />} 
                        color="primary" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">Ver Detalles</Button>
                <Button size="small" variant="contained" color="primary">Reservar Visita</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Gimnasios;
