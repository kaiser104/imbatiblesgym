import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Box, IconButton, useMediaQuery } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import './Sidebar.css';

function Sidebar() {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:768px)');
  const drawerWidth = 240;

  // Cerrar automáticamente en dispositivos móviles cuando se cambia de ruta
  const handleNavigation = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  // Determinar el tipo de drawer según el dispositivo
  const drawerVariant = isMobile ? "temporary" : "permanent";

  return (
    <>
      {/* Botón de menú para móviles */}
      {isMobile && (
        <IconButton
          color="primary"
          aria-label="open drawer"
          onClick={() => setOpen(!open)}
          edge="start"
          sx={{
            position: 'fixed',
            top: '70px',
            left: '10px',
            zIndex: 1200,
            backgroundColor: 'background.paper',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.15)',
            }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={drawerVariant}
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          },
        }}
        className="sidebar-drawer"
      >
        <Box sx={{ overflow: 'auto', mt: 8, position: 'relative' }}>
          {isMobile && (
            <IconButton
              onClick={() => setOpen(false)}
              sx={{
                position: 'absolute',
                right: 10,
                top: -40,
                color: 'primary.main',
              }}
            >
              <CloseIcon />
            </IconButton>
          )}

          <List>
            <ListItem button component={Link} to="/" onClick={handleNavigation}>
              <ListItemIcon>
                <DashboardIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard" 
                primaryTypographyProps={{ 
                  sx: { color: '#F5F5F5', fontWeight: 'medium' } 
                }} 
              />
            </ListItem>
            <ListItem button component={Link} to="/gimnasios" onClick={handleNavigation}>
              <ListItemIcon>
                <FitnessCenterIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Gimnasios" 
                primaryTypographyProps={{ 
                  sx: { color: '#F5F5F5', fontWeight: 'medium' } 
                }} 
              />
            </ListItem>
            <ListItem button component={Link} to="/entrenadores" onClick={handleNavigation}>
              <ListItemIcon>
                <PeopleIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Entrenadores" 
                primaryTypographyProps={{ 
                  sx: { color: '#F5F5F5', fontWeight: 'medium' } 
                }} 
              />
            </ListItem>
            <ListItem button component={Link} to="/trainees" onClick={handleNavigation}>
              <ListItemIcon>
                <PersonIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Trainees" 
                primaryTypographyProps={{ 
                  sx: { color: '#F5F5F5', fontWeight: 'medium' } 
                }} 
              />
            </ListItem>
          </List>
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
          <List>
            <ListItem button component={Link} to="/library" onClick={handleNavigation}>
              <ListItemIcon>
                <LibraryBooksIcon color="secondary" />
              </ListItemIcon>
              <ListItemText 
                primary="Biblioteca de Ejercicios" 
                primaryTypographyProps={{ 
                  sx: { color: '#F5F5F5', fontWeight: 'medium' } 
                }} 
              />
            </ListItem>
            <ListItem button component={Link} to="/upload" onClick={handleNavigation}>
              <ListItemIcon>
                <CloudUploadIcon color="secondary" />
              </ListItemIcon>
              <ListItemText 
                primary="Subir Ejercicio" 
                primaryTypographyProps={{ 
                  sx: { color: '#F5F5F5', fontWeight: 'medium' } 
                }} 
              />
            </ListItem>
            <ListItem button component={Link} to="/training-plan" onClick={handleNavigation}>
              <ListItemIcon>
                <EventNoteIcon color="secondary" />
              </ListItemIcon>
              <ListItemText 
                primary="Plan de Entrenamiento" 
                primaryTypographyProps={{ 
                  sx: { color: '#F5F5F5', fontWeight: 'medium' } 
                }} 
              />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Sidebar;
