import React from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  TextField, 
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { Person } from '@mui/icons-material';

const PersonalInfo = ({ userProfile, currentUser, userType, editing, handleInputChange }) => {
  return (
    <Box>
      {editing ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={userProfile.nombre || ''}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Correo electrónico"
              name="email"
              value={userProfile.email || ''}
              onChange={handleInputChange}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Teléfono"
              name="telefono"
              value={userProfile.telefono || ''}
              onChange={handleInputChange}
            />
          </Grid>
          {userType === 'gimnasio' && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  name="direccion"
                  value={userProfile.direccion || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  multiline
                  rows={3}
                  value={userProfile.descripcion || ''}
                  onChange={handleInputChange}
                />
              </Grid>
            </>
          )}
        </Grid>
      ) : (
        <List>
          <ListItem>
            <ListItemAvatar>
              <Avatar><Person /></Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary="Nombre" 
              secondary={userProfile.nombre || 'No especificado'} 
            />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar><Person /></Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary="Correo electrónico" 
              secondary={userProfile.email || currentUser.email} 
            />
          </ListItem>
          <ListItem>
            <ListItemAvatar>
              <Avatar><Person /></Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary="Teléfono" 
              secondary={userProfile.telefono || 'No especificado'} 
            />
          </ListItem>
          {userType === 'gimnasio' && (
            <>
              <ListItem>
                <ListItemAvatar>
                  <Avatar><Person /></Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="Dirección" 
                  secondary={userProfile.direccion || 'No especificado'} 
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar><Person /></Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="Descripción" 
                  secondary={userProfile.descripcion || 'No especificado'} 
                />
              </ListItem>
            </>
          )}
        </List>
      )}
    </Box>
  );
};

export default PersonalInfo;