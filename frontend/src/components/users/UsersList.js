import React from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, Avatar, Button
} from '@mui/material';
import {
  Edit, CheckCircle, Block, Warning, LocationOn, AccessTime, WhatsApp
} from '@mui/icons-material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function UsersList({ 
  filteredUsers, 
  handleOpenMembershipDialog, 
  handleOpenPauseDialog, 
  handleUsersUpdate,
  users,
  userDetails
}) {
  
  // Cancelar membresía
  const handleCancelMembership = async (user, membershipId) => {
    if (!user || !membershipId) return;
    
    try {
      // Actualizar estado de la membresía a inactiva
      await updateDoc(doc(db, 'membresias', membershipId), {
        estado: 'inactiva'
      });
      
      // Actualizar datos locales
      const updatedUsers = [...users];
      const userIndex = updatedUsers.findIndex(u => u.id === user.id);
      
      if (userIndex !== -1) {
        // Actualizar membresías del usuario
        if (updatedUsers[userIndex].memberships) {
          const membershipIndex = updatedUsers[userIndex].memberships.findIndex(m => m.id === membershipId);
          
          if (membershipIndex !== -1) {
            updatedUsers[userIndex].memberships[membershipIndex].estado = 'inactiva';
          }
        }
        
        updatedUsers[userIndex].activeMembership = null;
        
        handleUsersUpdate(updatedUsers);
      }
    } catch (err) {
      console.error('Error al cancelar membresía:', err);
    }
  };

  // Reactivar membresía pausada
  const handleReactivateMembership = async (user, membershipId) => {
    if (!user || !membershipId) return;
    
    try {
      // Actualizar estado de la membresía a activa
      await updateDoc(doc(db, 'membresias', membershipId), {
        estado: 'activa',
        pausaInicio: null,
        pausaFin: null,
        pausaDias: null,
        pausaMotivo: null
      });
      
      // Actualizar datos locales
      const updatedUsers = [...users];
      const userIndex = updatedUsers.findIndex(u => u.id === user.id);
      
      if (userIndex !== -1) {
        // Actualizar membresías del usuario
        if (updatedUsers[userIndex].memberships) {
          const membershipIndex = updatedUsers[userIndex].memberships.findIndex(m => m.id === membershipId);
          
          if (membershipIndex !== -1) {
            updatedUsers[userIndex].memberships[membershipIndex].estado = 'activa';
            updatedUsers[userIndex].memberships[membershipIndex].pausaInicio = null;
            updatedUsers[userIndex].memberships[membershipIndex].pausaFin = null;
            updatedUsers[userIndex].memberships[membershipIndex].pausaDias = null;
            updatedUsers[userIndex].memberships[membershipIndex].pausaMotivo = null;
          }
        }
        
        // Actualizar membresía activa si es la misma
        if (updatedUsers[userIndex].activeMembership && updatedUsers[userIndex].activeMembership.id === membershipId) {
          updatedUsers[userIndex].activeMembership.estado = 'activa';
          updatedUsers[userIndex].activeMembership.pausaInicio = null;
          updatedUsers[userIndex].activeMembership.pausaFin = null;
          updatedUsers[userIndex].activeMembership.pausaDias = null;
          updatedUsers[userIndex].activeMembership.pausaMotivo = null;
        }
        
        handleUsersUpdate(updatedUsers);
      }
    } catch (err) {
      console.error('Error al reactivar membresía:', err);
    }
  };

  // Renderizar tabla de usuarios
  if (filteredUsers.length === 0) {
    return (
      <Box sx={{ 
        backgroundColor: '#1E1E1E', 
        p: 3, 
        borderRadius: '4px', 
        textAlign: 'center',
        color: '#FFFFFF'
      }}>
        <Typography variant="h6">
          No se encontraron usuarios
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Intenta cambiar los filtros o la búsqueda
        </Typography>
      </Box>
    );
  }
  
  return (
    <TableContainer component={Paper} className="users-table" sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: '#BBFF00', fontWeight: 'bold' }}>Usuario</TableCell>
            <TableCell sx={{ color: '#BBFF00', fontWeight: 'bold' }}>Información</TableCell>
            {filteredUsers.some(user => user.userType === 'trainee') && (
              <TableCell sx={{ color: '#BBFF00', fontWeight: 'bold' }}>Estado de membresía</TableCell>
            )}
            <TableCell sx={{ color: '#BBFF00', fontWeight: 'bold' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id} className={`user-row ${user.userType}-row`}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={user.imagen || user.foto} 
                    alt={user.nombre}
                    className="user-avatar"
                    sx={{ width: 50, height: 50, border: '2px solid #BBFF00' }}
                  />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="subtitle1" className="user-name" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                      {user.nombre}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#BBFF00' }}>
                      {user.email || user.correo}
                    </Typography>
                    <Chip 
                      label={user.userType === 'gimnasio' ? 'Gimnasio' : 
                            user.userType === 'entrenador' ? 'Entrenador' : 'Trainee'} 
                      size="small"
                      className={`user-type-chip ${user.userType}-chip`}
                      sx={{ 
                        backgroundColor: user.userType === 'gimnasio' ? '#3f51b5' : 
                                        user.userType === 'entrenador' ? '#f50057' : '#4caf50',
                        color: '#FFFFFF',
                        mt: 1
                      }}
                    />
                  </Box>
                </Box>
              </TableCell>
              <TableCell sx={{ color: '#FFFFFF' }}>
                {user.userType === 'gimnasio' && (
                  <>
                    <Typography variant="body2">
                      <LocationOn fontSize="small" sx={{ color: '#BBFF00', mr: 1 }} /> 
                      {user.direccion || user.ubicacion || 'No disponible'}
                    </Typography>
                    {user.horario && (
                      <Typography variant="body2">
                        <AccessTime fontSize="small" sx={{ color: '#BBFF00', mr: 1 }} /> 
                        {user.horario}
                      </Typography>
                    )}
                  </>
                )}
                {user.userType === 'entrenador' && (
                  <>
                    <Typography variant="body2">
                      <strong>Especialidad:</strong> {user.especialidad || 'No especificada'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Experiencia:</strong> {user.experiencia || 'No especificada'}
                    </Typography>
                    {user.whatsapp && (
                      <Typography variant="body2">
                        <WhatsApp fontSize="small" sx={{ color: '#BBFF00', mr: 1 }} />
                        {user.whatsapp}
                      </Typography>
                    )}
                  </>
                )}
                {user.userType === 'trainee' && (
                  <>
                    {user.genero && (
                      <Typography variant="body2">
                        <strong>Género:</strong> {user.genero}
                      </Typography>
                    )}
                    {user.altura && (
                      <Typography variant="body2">
                        <strong>Altura:</strong> {user.altura} cm
                      </Typography>
                    )}
                    {user.whatsapp && (
                      <Typography variant="body2">
                        <WhatsApp fontSize="small" sx={{ color: '#BBFF00', mr: 1 }} />
                        {user.whatsapp}
                      </Typography>
                    )}
                  </>
                )}
              </TableCell>
              {filteredUsers.some(user => user.userType === 'trainee') && (
                <TableCell>
                  {user.userType === 'trainee' ? (
                    user.activeMembership ? (
                      <Box>
                        <Chip 
                          icon={user.activeMembership.estado === 'pausada' ? <Warning /> : <CheckCircle />} 
                          label={user.activeMembership.estado === 'pausada' ? 'Pausada' : 'Activa'} 
                          color={user.activeMembership.estado === 'pausada' ? 'warning' : 'success'}
                          size="small"
                          className={`membership-chip ${user.activeMembership.estado}`}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" className="membership-dates" sx={{ color: '#FFFFFF' }}>
                          {new Date(user.activeMembership.fechaInicio).toLocaleDateString()} - {new Date(user.activeMembership.fechaFin).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" className="membership-type" sx={{ color: '#BBFF00' }}>
                          {user.activeMembership.tipo === 'monthly' ? 'Mensual' : 
                           user.activeMembership.tipo === 'bimonthly' ? 'Bimestral' : 
                           user.activeMembership.tipo === 'quarterly' ? 'Trimestral' : 
                           user.activeMembership.tipo === 'semiannual' ? 'Semestral' : 
                           user.activeMembership.tipo === 'annual' ? 'Anual' : 
                           user.activeMembership.tipo}
                        </Typography>
                        {user.activeMembership.estado === 'pausada' && (
                          <Typography variant="body2" sx={{ color: '#ff9800', mt: 1 }}>
                            Pausada hasta: {new Date(user.activeMembership.pausaFin).toLocaleDateString()}
                          </Typography>
                        )}
                        {user.activeMembership.estado === 'activa' && new Date(user.activeMembership.fechaFin) <= new Date(new Date().setDate(new Date().getDate() + 7)) && (
                          <Chip 
                            icon={<Warning />} 
                            label="Por vencer" 
                            color="warning"
                            size="small"
                            className="membership-chip expiring"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Chip 
                        icon={<Block />} 
                        label="Inactiva" 
                        color="error"
                        size="small"
                        className="membership-chip inactive"
                      />
                    )
                  ) : (
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      N/A
                    </Typography>
                  )}
                </TableCell>
              )}
              <TableCell>
                <Box className="action-buttons" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {user.userType === 'trainee' && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenMembershipDialog(user)}
                      className="membership-button"
                      sx={{ 
                        backgroundColor: '#BBFF00', 
                        color: '#000000',
                        '&:hover': {
                          backgroundColor: '#CCFF33',
                        }
                      }}
                    >
                      {user.activeMembership ? 'Renovar' : 'Activar membresía'}
                    </Button>
                  )}
                  {user.userType === 'trainee' && user.activeMembership && user.activeMembership.estado === 'activa' && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenPauseDialog(user)}
                      className="pause-membership-button"
                      sx={{ 
                        borderColor: '#ff9800', 
                        color: '#ff9800',
                        '&:hover': {
                          borderColor: '#f57c00',
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        }
                      }}
                    >
                      Pausar membresía
                    </Button>
                  )}
                  {user.userType === 'trainee' && user.activeMembership && user.activeMembership.estado === 'pausada' && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleReactivateMembership(user, user.activeMembership.id)}
                      className="reactivate-membership-button"
                      sx={{ 
                        borderColor: '#4caf50', 
                        color: '#4caf50',
                        '&:hover': {
                          borderColor: '#388e3c',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        }
                      }}
                    >
                      Reactivar membresía
                    </Button>
                  )}
                  {user.userType === 'trainee' && user.activeMembership && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleCancelMembership(user, user.activeMembership.id)}
                      className="cancel-membership-button"
                      sx={{ 
                        borderColor: '#f44336', 
                        color: '#f44336',
                        '&:hover': {
                          borderColor: '#d32f2f',
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        }
                      }}
                    >
                      Cancelar membresía
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    className="edit-user-button"
                    sx={{ 
                      borderColor: '#BBFF00', 
                      color: '#BBFF00',
                      '&:hover': {
                        borderColor: '#CCFF33',
                        backgroundColor: 'rgba(187, 255, 0, 0.1)',
                      }
                    }}
                  >
                    Editar
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default UsersList;