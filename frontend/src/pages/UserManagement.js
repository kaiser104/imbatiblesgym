import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Tabs, Tab, TextField, FormControl,
  InputLabel, Select, MenuItem, Button, TableContainer, Table,
  TableHead, TableBody, TableRow, TableCell, Paper, Avatar,
  Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment
} from '@mui/material';
import {
  Search, Refresh, Edit, CheckCircle, Warning, Block, LocationOn,
  AccessTime, WhatsApp
} from '@mui/icons-material';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './UserManagement.css';

const UserManagement = () => {
  // Estado para el usuario actual
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para los usuarios y filtros
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Estado para el tipo de usuario y detalles
  const [userType, setUserType] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  
  // Estado para las pestañas
  const [tabValue, setTabValue] = useState(0);
  
  // Estado para el diálogo de membresía
  const [openMembershipDialog, setOpenMembershipDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [membershipData, setMembershipData] = useState({
    tipo: 'monthly',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    precio: '',
    estado: 'activa'
  });
  
  // Efecto para obtener el usuario actual
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        setError("No hay usuario autenticado");
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Efecto para determinar el tipo de usuario
  useEffect(() => {
    const fetchUserType = async () => {
      if (!currentUser) {
        console.log("UserManagement - No hay usuario autenticado");
        return;
      }
      
      try {
        setLoading(true);
        console.log("UserManagement - Usuario actual:", currentUser.uid, currentUser.email);
        
        // Verificar si es super-administrador
        const adminQuery = query(
          collection(db, 'usuarios'),
          where('uid', '==', currentUser.uid),
          where('role', '==', 'super-administrador')
        );
        const adminSnapshot = await getDocs(adminQuery);
        console.log("UserManagement - Resultado búsqueda super-admin:", adminSnapshot.empty ? "No encontrado" : "Encontrado");
        
        if (!adminSnapshot.empty) {
          setUserType('super-administrador');
          setUserDetails(adminSnapshot.docs[0].data());
          setLoading(false);
          return;
        }
        
        // Verificar si es gimnasio - probar con todos los campos posibles
        console.log("UserManagement - Buscando gimnasio con UID:", currentUser.uid);
        
        // Intentar con diferentes campos
        const posiblesCampos = ['adminId', 'adminUid', 'uid', 'id'];
        let encontrado = false;
        
        for (const campo of posiblesCampos) {
          if (encontrado) break;
          
          console.log(`UserManagement - Intentando con campo: ${campo}`);
          const gymQuery = query(
            collection(db, 'gimnasios'),
            where(campo, '==', currentUser.uid)
          );
          const gymSnapshot = await getDocs(gymQuery);
          
          if (!gymSnapshot.empty) {
            console.log(`UserManagement - Encontrado gimnasio con campo: ${campo}`);
            setUserType('gimnasio');
            setUserDetails({
              ...gymSnapshot.docs[0].data(),
              id: gymSnapshot.docs[0].id
            });
            encontrado = true;
            break;
          }
        }
        
        // Si no se encontró por UID, intentar por email
        if (!encontrado) {
          console.log("UserManagement - Buscando gimnasio con email:", currentUser.email);
          const gymEmailQuery = query(
            collection(db, 'gimnasios'),
            where('email', '==', currentUser.email)
          );
          const gymEmailSnapshot = await getDocs(gymEmailQuery);
          
          if (!gymEmailSnapshot.empty) {
            console.log("UserManagement - Encontrado gimnasio por email");
            setUserType('gimnasio');
            setUserDetails({
              ...gymEmailSnapshot.docs[0].data(),
              id: gymEmailSnapshot.docs[0].id
            });
            encontrado = true;
          }
        }
        
        // Si aún no se encontró, verificar si es entrenador
        if (!encontrado) {
          console.log("UserManagement - Buscando entrenador con UID:", currentUser.uid);
          const trainerQuery = query(
            collection(db, 'entrenadores'),
            where('uid', '==', currentUser.uid)
          );
          const trainerSnapshot = await getDocs(trainerQuery);
          
          if (!trainerSnapshot.empty) {
            console.log("UserManagement - Encontrado entrenador");
            setUserType('entrenador');
            setUserDetails({
              ...trainerSnapshot.docs[0].data(),
              id: trainerSnapshot.docs[0].id
            });
            encontrado = true;
          } else {
            console.log("UserManagement - No se encontró como entrenador");
          }
        }
        
        if (!encontrado) {
          console.log("UserManagement - No se pudo determinar el tipo de usuario");
          setUserType('desconocido');
          setError("No se pudo determinar tu rol en el sistema. Contacta al administrador.");
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al determinar tipo de usuario:', err);
        setError('Error al cargar la información del usuario: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchUserType();
  }, [currentUser]);

  // Cargar usuarios según el tipo de usuario actual
  useEffect(() => {
    const fetchUsers = async () => {
      if (!userType || !userDetails) {
        console.log("UserManagement - No hay tipo de usuario o detalles para cargar usuarios");
        return;
      }
      
      try {
        setLoading(true);
        console.log("UserManagement - Cargando usuarios para:", userType, userDetails);
        let usersData = [];
        
        // Cargar todos los usuarios para depuración
        console.log("UserManagement - Cargando todos los usuarios para depuración");
        
        // Cargar todos los gimnasios
        const allGymsSnapshot = await getDocs(collection(db, 'gimnasios'));
        console.log("UserManagement - Total de gimnasios:", allGymsSnapshot.size);
        const gymsData = allGymsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userType: 'gimnasio'
        }));
        
        // Cargar todos los entrenadores
        const allTrainersSnapshot = await getDocs(collection(db, 'entrenadores'));
        console.log("UserManagement - Total de entrenadores:", allTrainersSnapshot.size);
        const trainersData = allTrainersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userType: 'entrenador'
        }));
        
        // Cargar todos los trainees
        const allTraineesSnapshot = await getDocs(collection(db, 'trainees'));
        console.log("UserManagement - Total de trainees:", allTraineesSnapshot.size);
        const traineesData = allTraineesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userType: 'trainee'
        }));
        
        // Combinar todos los datos según el tipo de usuario y la pestaña seleccionada
        if (userType === 'super-administrador') {
          // Mostrar según la pestaña seleccionada
          if (tabValue === 0) {
            usersData = gymsData;
          } else if (tabValue === 1) {
            usersData = trainersData;
          } else {
            usersData = traineesData;
          }
        } else if (userType === 'gimnasio') {
          // Para gimnasios, mostrar entrenadores o trainees según la pestaña
          if (tabValue === 0) {
            // Intentar filtrar entrenadores relacionados con este gimnasio
            usersData = trainersData.filter(trainer => 
              trainer.gimnasioId === userDetails.id || 
              trainer.gimnasio === userDetails.id ||
              trainer.gimnasioId === userDetails.uid ||
              trainer.gimnasio === userDetails.uid
            );
            
            // Si no hay resultados, mostrar todos los entrenadores
            if (usersData.length === 0) {
              console.log("UserManagement - No se encontraron entrenadores específicos, mostrando todos");
              usersData = trainersData;
            }
          } else {
            // Intentar filtrar trainees relacionados con este gimnasio
            usersData = traineesData.filter(trainee => 
              trainee.gimnasioId === userDetails.id || 
              trainee.gimnasio === userDetails.id ||
              trainee.gimnasioId === userDetails.uid ||
              trainee.gimnasio === userDetails.uid
            );
            
            // Si no hay resultados, mostrar todos los trainees
            if (usersData.length === 0) {
              console.log("UserManagement - No se encontraron trainees específicos, mostrando todos");
              usersData = traineesData;
            }
          }
        } else if (userType === 'entrenador') {
          // Para entrenadores, mostrar solo sus trainees
          usersData = traineesData.filter(trainee => 
            trainee.entrenadorId === userDetails.id || 
            trainee.entrenador === userDetails.id ||
            trainee.entrenadorId === userDetails.uid ||
            trainee.entrenador === userDetails.uid
          );
          
          // Si no hay resultados, mostrar todos los trainees
          if (usersData.length === 0) {
            console.log("UserManagement - No se encontraron trainees específicos, mostrando todos");
            usersData = traineesData;
          }
        }
        
        console.log("UserManagement - Usuarios filtrados:", usersData.length);
        
        // Cargar información de membresías para cada usuario
        for (const user of usersData) {
          if (user.userType === 'trainee') {
            try {
              const membershipsQuery = query(
                collection(db, 'membresias'),
                where('traineeId', '==', user.id)
              );
              const membershipsSnapshot = await getDocs(membershipsQuery);
              const memberships = membershipsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              // Ordenar por fecha de inicio (más reciente primero)
              memberships.sort((a, b) => {
                return new Date(b.fechaInicio) - new Date(a.fechaInicio);
              });
              
              user.memberships = memberships;
              user.activeMembership = memberships.find(m => 
                new Date(m.fechaFin) >= new Date() && m.estado === 'activa'
              );
            } catch (err) {
              console.error("Error al cargar membresías para usuario:", user.id, err);
            }
          }
        }
        
        setUsers(usersData);
        setFilteredUsers(usersData);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('Error al cargar los usuarios: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [userType, userDetails, tabValue]);

  // Filtrar usuarios según búsqueda y filtros
  useEffect(() => {
    if (!users.length) return;
    
    let filtered = [...users];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.nombre && user.nombre.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.correo && user.correo.toLowerCase().includes(searchLower))
      );
    }
    
    // Aplicar filtro de tipo
    if (filterType !== 'all' && filtered.some(user => user.userType === 'trainee')) {
      if (filterType === 'active') {
        filtered = filtered.filter(user => 
          user.userType !== 'trainee' || user.activeMembership
        );
      } else if (filterType === 'inactive') {
        filtered = filtered.filter(user => 
          user.userType !== 'trainee' || !user.activeMembership
        );
      } else if (filterType === 'expiring') {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        
        filtered = filtered.filter(user => 
          user.userType !== 'trainee' || 
          (user.activeMembership && new Date(user.activeMembership.fechaFin) <= oneWeekFromNow)
        );
      }
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, filterType]);

  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Abrir diálogo de membresía
  const handleOpenMembershipDialog = (user) => {
    setSelectedUser(user);
    
    // Si el usuario ya tiene una membresía activa, usar esos datos como base
    if (user.activeMembership) {
      const endDate = new Date(user.activeMembership.fechaFin);
      const startDate = new Date();
      
      // Si la membresía actual aún no ha vencido, comenzar desde la fecha de fin
      if (endDate > startDate) {
        startDate.setTime(endDate.getTime());
      }
      
      // Calcular fecha de fin según el tipo de membresía
      let endDateNew = new Date(startDate);
      if (user.activeMembership.tipo === 'monthly') {
        endDateNew.setMonth(endDateNew.getMonth() + 1);
      } else if (user.activeMembership.tipo === 'quarterly') {
        endDateNew.setMonth(endDateNew.getMonth() + 3);
      } else if (user.activeMembership.tipo === 'semiannual') {
        endDateNew.setMonth(endDateNew.getMonth() + 6);
      } else if (user.activeMembership.tipo === 'annual') {
        endDateNew.setFullYear(endDateNew.getFullYear() + 1);
      }
      
      setMembershipData({
        tipo: user.activeMembership.tipo,
        fechaInicio: startDate.toISOString().split('T')[0],
        fechaFin: endDateNew.toISOString().split('T')[0],
        precio: user.activeMembership.precio || '',
        estado: 'activa'
      });
    } else {
      // Si no tiene membresía, usar valores predeterminados
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      setMembershipData({
        tipo: 'monthly',
        fechaInicio: startDate.toISOString().split('T')[0],
        fechaFin: endDate.toISOString().split('T')[0],
        precio: '',
        estado: 'activa'
      });
    }
    
    setOpenMembershipDialog(true);
  };

  // Manejar cambio en datos de membresía
  const handleMembershipChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'tipo') {
      // Actualizar fecha de fin según el tipo de membresía
      const startDate = new Date(membershipData.fechaInicio);
      let endDate = new Date(startDate);
      
      if (value === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (value === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (value === 'semiannual') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (value === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      setMembershipData({
        ...membershipData,
        tipo: value,
        fechaFin: endDate.toISOString().split('T')[0]
      });
    } else if (name === 'fechaInicio') {
      // Actualizar fecha de fin manteniendo la duración
      const startDate = new Date(value);
      let endDate = new Date(startDate);
      
      if (membershipData.tipo === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (membershipData.tipo === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (membershipData.tipo === 'semiannual') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (membershipData.tipo === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      setMembershipData({
        ...membershipData,
        fechaInicio: value,
        fechaFin: endDate.toISOString().split('T')[0]
      });
    } else {
      setMembershipData({
        ...membershipData,
        [name]: value
      });
    }
  };

  // Guardar membresía
  const handleSaveMembership = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      
      // Si el usuario ya tiene una membresía activa, desactivarla
      if (selectedUser.activeMembership) {
        await updateDoc(doc(db, 'membresias', selectedUser.activeMembership.id), {
          estado: 'inactiva'
        });
      }
      
      // Crear nueva membresía
      await addDoc(collection(db, 'membresias'), {
        traineeId: selectedUser.id,
        gimnasioId: userDetails.id,
        tipo: membershipData.tipo,
        fechaInicio: membershipData.fechaInicio,
        fechaFin: membershipData.fechaFin,
        precio: membershipData.precio,
        estado: membershipData.estado,
        fechaCreacion: new Date().toISOString()
      });
      
      // Cerrar diálogo y recargar datos
      setOpenMembershipDialog(false);
      
      // Recargar usuarios para reflejar los cambios
      const updatedUsers = [...users];
      const userIndex = updatedUsers.findIndex(u => u.id === selectedUser.id);
      
      if (userIndex !== -1) {
        // Actualizar membresías del usuario
        const membershipsQuery = query(
          collection(db, 'membresias'),
          where('traineeId', '==', selectedUser.id)
        );
        const membershipsSnapshot = await getDocs(membershipsQuery);
        const memberships = membershipsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Ordenar por fecha de inicio (más reciente primero)
        memberships.sort((a, b) => {
          return new Date(b.fechaInicio) - new Date(a.fechaInicio);
        });
        
        updatedUsers[userIndex].memberships = memberships;
        updatedUsers[userIndex].activeMembership = memberships.find(m => 
          new Date(m.fechaFin) >= new Date() && m.estado === 'activa'
        );
        
        setUsers(updatedUsers);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al guardar membresía:', err);
      setError('Error al guardar la membresía: ' + err.message);
      setLoading(false);
    }
  };

  // Cancelar membresía
  const handleCancelMembership = async (user, membershipId) => {
    if (!user || !membershipId) return;
    
    try {
      setLoading(true);
      
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
        
        setUsers(updatedUsers);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al cancelar membresía:', err);
      setError('Error al cancelar la membresía: ' + err.message);
      setLoading(false);
    }
  };

  // Renderizar tabla de usuarios
  const renderUsersTable = () => {
    if (filteredUsers.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', mt: 4, p: 3, backgroundColor: '#1E1E1E', borderRadius: '4px' }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
            No se encontraron usuarios
          </Typography>
          <Typography variant="body1" sx={{ color: '#BBFF00' }}>
            {searchTerm || filterType !== 'all' ? 
              'Prueba con otros filtros de búsqueda' : 
              'Aún no hay usuarios registrados en esta categoría'}
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
                            icon={<CheckCircle />} 
                            label="Activa" 
                            color="success"
                            size="small"
                            className="membership-chip active"
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
                          {new Date(user.activeMembership.fechaFin) <= new Date(new Date().setDate(new Date().getDate() + 7)) && (
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
                <TableCell></TableCell>
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
                      className="edit-button"
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
  };

  // Renderizar la interfaz principal
  return (
    <Container maxWidth="xl" className="user-management-container">
      <Typography variant="h4" component="h1" className="page-title">
        {userType === 'super-administrador' ? 'Administración de Usuarios' : 
         userType === 'gimnasio' ? 'Gestión de Miembros' : 
         userType === 'entrenador' ? 'Mis Trainees' : 'Gestión de Usuarios'}
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: '#BBFF00', mb: 2 }} />
          <Typography variant="body1" sx={{ color: '#FFFFFF' }}>
            Cargando usuarios...
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Typography variant="body1" sx={{ color: '#FFFFFF' }}>
            Información de depuración:
          </Typography>
          <Box sx={{ 
            backgroundColor: '#1E1E1E', 
            p: 2, 
            borderRadius: '4px', 
            mt: 1,
            color: '#BBFF00',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            Usuario: {currentUser ? `${currentUser.uid} (${currentUser.email})` : 'No autenticado'}<br/>
            Tipo de usuario: {userType || 'No determinado'}<br/>
            Detalles: {userDetails ? JSON.stringify(userDetails, null, 2) : 'No disponible'}
          </Box>
        </Box>
      ) : (
        <>
          {/* Mostrar información de depuración */}
          <Box sx={{ 
            backgroundColor: '#1E1E1E', 
            p: 2, 
            borderRadius: '4px', 
            mb: 3,
            color: '#BBFF00'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Información de usuario:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              Tipo: {userType || 'No determinado'}<br/>
              ID: {userDetails?.id || 'No disponible'}<br/>
              Email: {currentUser?.email || 'No disponible'}<br/>
              Total de usuarios cargados: {users.length}
            </Typography>
          </Box>
          
          {/* Pestañas para super-administrador y gimnasio */}
          {(userType === 'super-administrador' || userType === 'gimnasio') && (
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              className="user-tabs"
              sx={{ mb: 3 }}
            >
              {userType === 'super-administrador' && (
                <Tab label="Gimnasios" />
              )}
              <Tab label="Entrenadores" />
              <Tab label="Trainees" />
            </Tabs>
          )}
          
          {/* Filtros */}
          <Box className="filters-container" sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Buscar"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#BBFF00' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(187, 255, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(187, 255, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#BBFF00',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#FFFFFF',
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                }
              }}
            />
            
            <FormControl variant="outlined" className="filter-select" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: '#FFFFFF' }}>Filtrar por</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Filtrar por"
                sx={{ 
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(187, 255, 0, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(187, 255, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#BBFF00',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#BBFF00',
                  }
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                {filteredUsers.some(user => user.userType === 'trainee') && (
                  <>
                    <MenuItem value="active">Membresía Activa</MenuItem>
                    <MenuItem value="inactive">Sin Membresía</MenuItem>
                    <MenuItem value="expiring">Por Vencer</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              className="reset-button"
              sx={{ 
                borderColor: '#BBFF00', 
                color: '#BBFF00',
                '&:hover': {
                  borderColor: '#CCFF33',
                  backgroundColor: 'rgba(187, 255, 0, 0.1)',
                }
              }}
            >
              Reiniciar
            </Button>
          </Box>
          
          {/* Tabla de usuarios */}
          {renderUsersTable()}
        </>
      )}
      
      {/* Diálogo de membresía */}
      <Dialog 
        open={openMembershipDialog} 
        onClose={() => setOpenMembershipDialog(false)}
        className="membership-dialog"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            color: '#FFFFFF',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333', color: '#BBFF00' }}>
          {selectedUser?.activeMembership ? 'Renovar Membresía' : 'Activar Membresía'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedUser && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: '#FFFFFF' }}>
                Usuario: <span style={{ color: '#BBFF00' }}>{selectedUser.nombre}</span>
              </Typography>
              {selectedUser.activeMembership && (
                <Box sx={{ 
                  backgroundColor: '#1E1E1E', 
                  p: 2, 
                  borderRadius: '4px', 
                  mb: 2 
                }}>
                  <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                    Membresía actual: <Chip 
                      label="Activa" 
                      size="small" 
                      color="success" 
                      sx={{ ml: 1 }} 
                    />
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', mt: 1 }}>
                    Vence el: <span style={{ color: '#BBFF00' }}>
                      {new Date(selectedUser.activeMembership.fechaFin).toLocaleDateString()}
                    </span>
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#FFFFFF' }}>Tipo de membresía</InputLabel>
            <Select
              name="tipo"
              value={membershipData.tipo}
              onChange={handleMembershipChange}
              label="Tipo de membresía"
              sx={{ 
                color: '#FFFFFF',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(187, 255, 0, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(187, 255, 0, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#BBFF00',
                },
                '& .MuiSvgIcon-root': {
                  color: '#BBFF00',
                }
              }}
            >
              <MenuItem value="monthly">Mensual</MenuItem>
              <MenuItem value="quarterly">Trimestral</MenuItem>
              <MenuItem value="semiannual">Semestral</MenuItem>
              <MenuItem value="annual">Anual</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Fecha de inicio"
              type="date"
              name="fechaInicio"
              value={membershipData.fechaInicio}
              onChange={handleMembershipChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(187, 255, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(187, 255, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#BBFF00',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#FFFFFF',
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                }
              }}
            />
            <TextField
              label="Fecha de fin"
              type="date"
              name="fechaFin"
              value={membershipData.fechaFin}
              InputProps={{
                readOnly: true,
              }}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(187, 255, 0, 0.3)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#FFFFFF',
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                }
              }}
            />
          </Box>
          
          <TextField
            label="Precio"
            type="number"
            name="precio"
            value={membershipData.precio}
            onChange={handleMembershipChange}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(187, 255, 0, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(187, 255, 0, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#BBFF00',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#FFFFFF',
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF',
              },
              '& .MuiInputAdornment-root': {
                color: '#BBFF00',
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #333', p: 2 }}>
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
    </Container>
  );
};

export default UserManagement;