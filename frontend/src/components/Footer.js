import React from 'react';
import { Box, Typography, Container, Link, IconButton, Grid, Divider } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import './Footer.css'; // Importar el archivo CSS

function Footer() {
  return (
    <Box 
      component="footer" 
      className="app-footer"
      sx={{ 
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FitnessCenterIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6" color="primary" fontWeight="bold">
                Imbatibles Gym
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Transformando vidas a través del fitness y el entrenamiento personalizado.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" color="primary" fontWeight="medium" sx={{ mb: 2 }}>
              Enlaces Rápidos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link href="/training-plan" color="inherit" sx={{ mb: 1 }}>Planes de Entrenamiento</Link>
              <Link href="/library" color="inherit" sx={{ mb: 1 }}>Biblioteca de Ejercicios</Link>
              <Link href="/gimnasios" color="inherit" sx={{ mb: 1 }}>Nuestros Gimnasios</Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" color="primary" fontWeight="medium" sx={{ mb: 2 }}>
              Síguenos
            </Typography>
            <Box>
              <IconButton color="primary" aria-label="facebook" sx={{ mr: 1 }}>
                <FacebookIcon />
              </IconButton>
              <IconButton color="primary" aria-label="twitter" sx={{ mr: 1 }}>
                <TwitterIcon />
              </IconButton>
              <IconButton color="primary" aria-label="instagram">
                <InstagramIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3, backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', sm: 'center' } }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 0 } }}>
            © {new Date().getFullYear()} Imbatibles Gym. Todos los derechos reservados.
          </Typography>
          <Box sx={{ display: 'flex' }}>
            <Link href="#" color="inherit" sx={{ mx: 1 }}>Política de Privacidad</Link>
            <Link href="#" color="inherit" sx={{ mx: 1 }}>Términos de Servicio</Link>
            <Link href="#" color="inherit" sx={{ mx: 1 }}>Contacto</Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
