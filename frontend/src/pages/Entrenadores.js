import React from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  Chip, 
  CardActions,
  IconButton
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import StarIcon from '@mui/icons-material/Star';

function Entrenadores() {
  // Datos de ejemplo para los entrenadores
  const entrenadores = [
    {
      id: 1,
      nombre: "Carlos Martínez",
      especialidad: "Entrenamiento Funcional",
      experiencia: "8 años",
      descripcion: "Especialista en entrenamiento funcional y preparación física para deportistas de alto rendimiento.",
      imagen: "https://source.unsplash.com/random/300x300/?trainer,man",
      certificaciones: ["CrossFit L3", "NSCA-CPT", "Nutrición Deportiva"],
      rating: 4.9
    },
    {
      id: 2,
      nombre: "Laura Sánchez",
      especialidad: "Yoga y Pilates",
      experiencia: "10 años",
      descripcion: "Instructora certificada de yoga y pilates con enfoque en bienestar integral y recuperación física.",
      imagen: "https://source.unsplash.com/random/300x300/?yoga,woman",
      certificaciones: ["Yoga Alliance 500h", "Pilates Mat", "Rehabilitación"],
      rating: 4.8
    },
    {
      id: 3,
      nombre: "Javier López",
      especialidad: "Musculación",
      experiencia: "12 años",
      descripcion: "Experto en hipertrofia y definición muscular. Competidor de fisicoculturismo y asesor nutricional.",
      imagen: "https://source.unsplash.com/random/300x300/?bodybuilder",
      certificaciones: ["IFBB Pro", "Nutrición Deportiva", "Entrenamiento de Fuerza"],
      rating: 4.7
    },
  ];

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Nuestros Entrenadores
      </Typography>
      
      <Grid container spacing={3}>
        {entrenadores.map((entrenador) => (
          <Grid item xs={12} md={6} lg={4} key={entrenador.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ position: 'relative', pt: '100%' }}>
                <CardMedia
                  component="img"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  image={entrenador.imagen}
                  alt={entrenador.nombre}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    padding: '10px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon sx={{ color: 'gold', mr: 0.5 }} fontSize="small" />
                    <Typography variant="body2">
                      {entrenador.rating} • {entrenador.experiencia} de experiencia
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {entrenador.nombre}
                </Typography>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {entrenador.especialidad}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {entrenador.descripcion}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Certificaciones:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {entrenador.certificaciones.map((cert, index) => (
                      <Chip 
                        key={index} 
                        label={cert} 
                        size="small" 
                        color="secondary" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button variant="contained" color="primary">
                  Agendar Clase
                </Button>
                <Box>
                  <IconButton color="primary" size="small">
                    <EmailIcon />
                  </IconButton>
                  <IconButton color="primary" size="small">
                    <WhatsAppIcon />
                  </IconButton>
                  <IconButton color="primary" size="small">
                    <InstagramIcon />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Entrenadores;
