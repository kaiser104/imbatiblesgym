import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton } from '@mui/material';
import { FitnessCenter, Facebook, Twitter, Instagram } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" className="footer">
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Box className="footer-brand">
              <FitnessCenter />
              <Typography variant="h6">Imbatibles Gym</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Tu camino hacia un estilo de vida más saludable y fuerte comienza aquí.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Enlaces Rápidos
            </Typography>
            <ul className="footer-links">
              <li>
                <Link component={RouterLink} to="/exercises" color="inherit">
                  Biblioteca de Ejercicios
                </Link>
              </li>
              <li>
                <Link component={RouterLink} to="/upload" color="inherit">
                  Sugiere un Ejercicio
                </Link>
              </li>
            </ul>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Síguenos
            </Typography>
            <Box className="social-icons">
              <IconButton color="inherit" aria-label="facebook">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="twitter">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="instagram">
                <Instagram />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        
        <Box className="footer-bottom">
          <Typography variant="body2" color="text.secondary">
            &copy; {currentYear} Imbatibles Gym. Todos los derechos reservados.
          </Typography>
          <Box className="footer-legal">
            <Link color="inherit" component={RouterLink} to="/privacy">
              Política de Privacidad
            </Link>
            <Link color="inherit" component={RouterLink} to="/terms">
              Términos de Servicio
            </Link>
            <Link color="inherit" component={RouterLink} to="/contact">
              Contacto
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
