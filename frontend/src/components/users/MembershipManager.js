import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Typography, Box, Alert
} from '@mui/material';
import { db } from '../../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

function MembershipManager({
  selectedUser,
  openMembershipDialog,
  setOpenMembershipDialog,
  openPauseDialog,
  setOpenPauseDialog,
  users,
  setUsers,
  userDetails
}) {
  // Estado para datos de membresía
  const [membershipData, setMembershipData] = useState({
    tipo: 'monthly',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    precio: '',
    estado: 'activa',
    fechaFinModificada: false
  });

  // Estado para datos de pausa
  const [pauseData, setPauseData] = useState({
    dias: 7,
    motivo: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
  });

  // Estado para errores
  const [membershipError, setMembershipError] = useState('');
  const [pauseError, setPauseError] = useState('');

  // Resetear datos de membresía cuando se abre el diálogo
  useEffect(() => {
    if (openMembershipDialog && selectedUser) {
      // Establecer fecha de inicio como hoy
      const today = new Date().toISOString().split('T')[0];
      
      // Calcular fecha de fin según el tipo de membresía
      let endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Por defecto, mensual
      
      setMembershipData({
        tipo: 'monthly',
        fechaInicio: today,
        fechaFin: endDate.toISOString().split('T')[0],
        precio: '',
        estado: 'activa',
        fechaFinModificada: false
      });
      
      setMembershipError('');
    }
  }, [openMembershipDialog, selectedUser]);

  // Resetear datos de pausa cuando se abre el diálogo
  useEffect(() => {
    if (openPauseDialog && selectedUser) {
      const today = new Date().toISOString().split('T')[0];
      let endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 7 días por defecto
      
      setPauseData({
        dias: 7,
        motivo: '',
        fechaInicio: today,
        fechaFin: endDate.toISOString().split('T')[0]
      });
      
      setPauseError('');
    }
  }, [openPauseDialog, selectedUser]);

  // Manejar cambios en los campos de membresía
  const handleMembershipChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'tipo') {
      // Actualizar fecha de fin según el tipo de membresía
      let endDate = new Date(membershipData.fechaInicio);
      
      switch (value) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'bimonthly':
          endDate.setMonth(endDate.getMonth() + 2);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'semiannual':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'annual':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1);
      }
      
      setMembershipData({
        ...membershipData,
        [name]: value,
        fechaFin: endDate.toISOString().split('T')[0],
        fechaFinModificada: false
      });
    } else if (name === 'fechaInicio') {
      // Si cambia la fecha de inicio, actualizar fecha de fin según el tipo
      let endDate = new Date(value);
      
      switch (membershipData.tipo) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'bimonthly':
          endDate.setMonth(endDate.getMonth() + 2);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'semiannual':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'annual':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1);
      }
      
      setMembershipData({
        ...membershipData,
        [name]: value,
        fechaFin: endDate.toISOString().split('T')[0],
        fechaFinModificada: false
      });
    } else if (name === 'fechaFin') {
      // Si cambia manualmente la fecha de fin
      setMembershipData({
        ...membershipData,
        [name]: value,
        fechaFinModificada: true
      });
    } else {
      setMembershipData({
        ...membershipData,
        [name]: value
      });
    }
  };

  // Manejar cambios en los campos de pausa
  const handlePauseChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'dias') {
      // Actualizar fecha de fin según los días de pausa
      const startDate = new Date(pauseData.fechaInicio);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + parseInt(value));
      
      setPauseData({
        ...pauseData,
        [name]: value,
        fechaFin: endDate.toISOString().split('T')[0]
      });
    } else if (name === 'fechaInicio') {
      // Si cambia la fecha de inicio, actualizar fecha de fin según los días
      const startDate = new Date(value);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + parseInt(pauseData.dias));
      
      setPauseData({
        ...pauseData,
        [name]: value,
        fechaFin: endDate.toISOString().split('T')[0]
      });
    } else {
      setPauseData({
        ...pauseData,
        [name]: value
      });
    }
  };

  // Guardar nueva membresía
  const handleSaveMembership = async () => {
    if (!selectedUser) return;
    
    // Validar datos
    if (!membershipData.precio) {
      setMembershipError('El precio es obligatorio');
      return;
    }
    
    try {
      // Crear nueva membresía en Firestore
      const membershipRef = await addDoc(collection(db, 'membresias'), {
        traineeId: selectedUser.id,
        tipo: membershipData.tipo,
        fechaInicio: membershipData.fechaInicio,
        fechaFin: membershipData.fechaFin,
        precio: membershipData.precio,
        estado: 'activa',
        creadoPor: userDetails ? userDetails.id : null,
        creadoEn: new Date().toISOString()
      });
      
      // Actualizar datos locales
      const updatedUsers = [...users];
      const userIndex = updatedUsers.findIndex(u => u.id === selectedUser.id);
      
      if (userIndex !== -1) {
        // Crear o actualizar array de membresías
        if (!updatedUsers[userIndex].memberships) {
          updatedUsers[userIndex].memberships = [];
        }
        
        // Añadir nueva membresía
        const newMembership = {
          id: membershipRef.id,
          traineeId: selectedUser.id,
          tipo: membershipData.tipo,
          fechaInicio: membershipData.fechaInicio,
          fechaFin: membershipData.fechaFin,
          precio: membershipData.precio,
          estado: 'activa',
          creadoPor: userDetails ? userDetails.id : null,
          creadoEn: new Date().toISOString()
        };
        
        updatedUsers[userIndex].memberships.unshift(newMembership);
        updatedUsers[userIndex].activeMembership = newMembership;
        
        setUsers(updatedUsers);
      }
      
      // Cerrar diálogo
      setOpenMembershipDialog(false);
    } catch (err) {
      console.error('Error al guardar membresía:', err);
      setMembershipError('Error al guardar: ' + err.message);
    }
  };

  // Guardar pausa de membresía
  const handleSavePause = async () => {
    if (!selectedUser || !selectedUser.activeMembership) return;
    
    // Validar datos
    if (!pauseData.motivo) {
      setPauseError('El motivo es obligatorio');
      return;
    }
    
    try {
      // Calcular nueva fecha de fin de membresía (extender por los días de pausa)
      const membershipEndDate = new Date(selectedUser.activeMembership.fechaFin);
      membershipEndDate.setDate(membershipEndDate.getDate() + parseInt(pauseData.dias));
      
      // Actualizar membresía en Firestore
      await updateDoc(doc(db, 'membresias', selectedUser.activeMembership.id), {
        estado: 'pausada',
        pausaInicio: pauseData.fechaInicio,
        pausaFin: pauseData.fechaFin,
        pausaDias: pauseData.dias,
        pausaMotivo: pauseData.motivo,
        fechaFin: membershipEndDate.toISOString().split('T')[0]
      });
      
      // Actualizar datos locales
      const updatedUsers = [...users];
      const userIndex = updatedUsers.findIndex(u => u.id === selectedUser.id);
      
      if (userIndex !== -1) {
        // Actualizar membresías del usuario
        if (updatedUsers[userIndex].memberships) {
          const membershipIndex = updatedUsers[userIndex].memberships.findIndex(
            m => m.id === selectedUser.activeMembership.id
          );
          
          if (membershipIndex !== -1) {
            updatedUsers[userIndex].memberships[membershipIndex].estado = 'pausada';
            updatedUsers[userIndex].memberships[membershipIndex].pausaInicio = pauseData.fechaInicio;
            updatedUsers[userIndex].memberships[membershipIndex].pausaFin = pauseData.fechaFin;
            updatedUsers[userIndex].memberships[membershipIndex].pausaDias = pauseData.dias;
            updatedUsers[userIndex].memberships[membershipIndex].pausaMotivo = pauseData.motivo;
            updatedUsers[userIndex].memberships[membershipIndex].fechaFin = membershipEndDate.toISOString().split('T')[0];
          }
        }
        
        // Actualizar membresía activa
        if (updatedUsers[userIndex].activeMembership) {
          updatedUsers[userIndex].activeMembership.estado = 'pausada';
          updatedUsers[userIndex].activeMembership.pausaInicio = pauseData.fechaInicio;
          updatedUsers[userIndex].activeMembership.pausaFin = pauseData.fechaFin;
          updatedUsers[userIndex].activeMembership.pausaDias = pauseData.dias;
          updatedUsers[userIndex].activeMembership.pausaMotivo = pauseData.motivo;
          updatedUsers[userIndex].activeMembership.fechaFin = membershipEndDate.toISOString().split('T')[0];
        }
        
        setUsers(updatedUsers);
      }
      
      // Cerrar diálogo
      setOpenPauseDialog(false);
    } catch (err) {
      console.error('Error al pausar membresía:', err);
      setPauseError('Error al pausar: ' + err.message);
    }
  };

  return (
    <>
      {/* Diálogo de membresía */}
      <Dialog 
        open={openMembershipDialog} 
        onClose={() => setOpenMembershipDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#1E1E1E', color: '#BBFF00' }}>
          {selectedUser ? `${selectedUser.activeMembership ? 'Renovar' : 'Activar'} membresía para ${selectedUser.nombre}` : 'Membresía'}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF', pt: 2 }}>
          {membershipError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {membershipError}
            </Alert>
          )}
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de membresía</InputLabel>
            <Select
              name="tipo"
              value={membershipData.tipo}
              onChange={handleMembershipChange}
              label="Tipo de membresía"
            >
              <MenuItem value="monthly">Mensual</MenuItem>
              <MenuItem value="bimonthly">Bimestral</MenuItem>
              <MenuItem value="quarterly">Trimestral</MenuItem>
              <MenuItem value="semiannual">Semestral</MenuItem>
              <MenuItem value="annual">Anual</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Fecha de inicio"
            type="date"
            name="fechaInicio"
            value={membershipData.fechaInicio}
            onChange={handleMembershipChange}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            label="Fecha de fin"
            type="date"
            name="fechaFin"
            value={membershipData.fechaFin}
            onChange={handleMembershipChange}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            label="Precio"
            type="number"
            name="precio"
            value={membershipData.precio}
            onChange={handleMembershipChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" sx={{ color: '#BBFF00', mt: 1 }}>
            {membershipData.fechaFinModificada ? 
              'Fecha de fin modificada manualmente' : 
              'Fecha de fin calculada automáticamente según el tipo de membresía'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1E1E1E', p: 2 }}>
          <Button 
            onClick={() => setOpenMembershipDialog(false)}
            sx={{ color: '#FFFFFF' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveMembership}
            variant="contained"
            sx={{ 
              backgroundColor: '#BBFF00', 
              color: '#000000',
              '&:hover': {
                backgroundColor: '#CCFF33',
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de pausa */}
      <Dialog 
        open={openPauseDialog} 
        onClose={() => setOpenPauseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#1E1E1E', color: '#BBFF00' }}>
          {selectedUser ? `Pausar membresía de ${selectedUser.nombre}` : 'Pausar membresía'}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#1E1E1E', color: '#FFFFFF', pt: 2 }}>
          {pauseError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {pauseError}
            </Alert>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Al pausar una membresía, se extenderá automáticamente por la duración de la pausa.
            </Typography>
            
            {selectedUser && selectedUser.activeMembership && (
              <Typography variant="body2" sx={{ color: '#BBFF00' }}>
                Membresía actual: {new Date(selectedUser.activeMembership.fechaInicio).toLocaleDateString()} - {new Date(selectedUser.activeMembership.fechaFin).toLocaleDateString()}
              </Typography>
            )}
          </Box>
          
          <TextField
            label="Días de pausa"
            type="number"
            name="dias"
            value={pauseData.dias}
            onChange={handlePauseChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Fecha de inicio"
            type="date"
            name="fechaInicio"
            value={pauseData.fechaInicio}
            onChange={handlePauseChange}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            label="Fecha de fin"
            type="date"
            name="fechaFin"
            value={pauseData.fechaFin}
            disabled
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            label="Motivo de la pausa"
            name="motivo"
            value={pauseData.motivo}
            onChange={handlePauseChange}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          
          {selectedUser && selectedUser.activeMembership && (
            <Typography variant="body2" sx={{ color: '#BBFF00', mt: 1 }}>
              Nueva fecha de fin: {new Date(new Date(selectedUser.activeMembership.fechaFin).setDate(new Date(selectedUser.activeMembership.fechaFin).getDate() + parseInt(pauseData.dias))).toLocaleDateString()}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1E1E1E', p: 2 }}>
          <Button 
            onClick={() => setOpenPauseDialog(false)}
            sx={{ color: '#FFFFFF' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSavePause}
            variant="contained"
            sx={{ 
              backgroundColor: '#ff9800', 
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#f57c00',
              }
            }}
          >
            Pausar membresía
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default MembershipManager;