import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Container, Typography, Box, TextField, Tabs, Tab, FormControl, InputLabel,
  Select, MenuItem, InputAdornment, CircularProgress, Alert, Button
} from '@mui/material';
import { Search, Refresh, Add } from '@mui/icons-material';

// Importar los componentes secundarios
import UsersList from '../components/users/UsersList';
import MembershipManager from '../components/users/MembershipManager';
import EntrenadorForm from '../components/forms/EntrenadorForm';
// Importar el formulario de trainees
import TraineeForm from '../components/forms/TraineeForm';
import './UserManagement.css';

function UserManagement() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openMembershipDialog, setOpenMembershipDialog] = useState(false);
  const [openPauseDialog, setOpenPauseDialog] = useState(false);
  // Nuevo estado para controlar el diálogo de creación de entrenador
  const [openEntrenadorForm, setOpenEntrenadorForm] = useState(false);
  // Nuevo estado para controlar el diálogo de creación de trainee
  const [openTraineeForm, setOpenTraineeForm] = useState(false);
  
  // Determinar tipo de usuario al cargar
  useEffect(() => {
    if (!currentUser) {
      setError('No hay usuario autenticado');
      setLoading(false);
      return;
    }
    
    const fetchUserType = async () => {
      try {
        console.log("UserManagement - Determinando tipo de usuario para:", currentUser.uid);
        
        // Verificar si es super-administrador
        const adminQuery = query(
          collection(db, 'usuarios'),
          where('uid', '==', currentUser.uid),
          where('role', '==', 'super-administrador')
        );
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          setUserType('super-administrador');
          setUserDetails(adminSnapshot.docs[0].data());
          setLoading(false);
          return;
        }
        
        // Verificar si es gimnasio - probar con todos los campos posibles
        const posiblesCampos = ['adminId', 'adminUid', 'uid', 'id'];
        let encontrado = false;
        
        for (const campo of posiblesCampos) {
          if (encontrado) break;
          
          const gymQuery = query(
            collection(db, 'gimnasios'),
            where(campo, '==', currentUser.uid)
          );
          const gymSnapshot = await getDocs(gymQuery);
          
          if (!gymSnapshot.empty) {
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
          const gymEmailQuery = query(
            collection(db, 'gimnasios'),
            where('email', '==', currentUser.email)
          );
          const gymEmailSnapshot = await getDocs(gymEmailQuery);
          
          if (!gymEmailSnapshot.empty) {
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
          const trainerQuery = query(
            collection(db, 'entrenadores'),
            where('uid', '==', currentUser.uid)
          );
          const trainerSnapshot = await getDocs(trainerQuery);
          
          if (!trainerSnapshot.empty) {
            setUserType('entrenador');
            setUserDetails({
              ...trainerSnapshot.docs[0].data(),
              id: trainerSnapshot.docs[0].id
            });
            encontrado = true;
          }
        }
        
        if (!encontrado) {
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
        return;
      }
      
      try {
        setLoading(true);
        let usersData = [];
        
        // Cargar todos los gimnasios
        const allGymsSnapshot = await getDocs(collection(db, 'gimnasios'));
        const gymsData = allGymsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userType: 'gimnasio'
        }));
        
        // Cargar todos los entrenadores
        const allTrainersSnapshot = await getDocs(collection(db, 'entrenadores'));
        const trainersData = allTrainersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userType: 'entrenador'
        }));
        
        // Cargar todos los trainees
        const allTraineesSnapshot = await getDocs(collection(db, 'trainees'));
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
            console.log("Filtrando entrenadores para gimnasio:", userDetails.id);
            console.log("UID del usuario actual:", currentUser.uid);
            
            // Mostrar todos los entrenadores que tengan cualquier relación con este gimnasio o usuario
            usersData = trainersData.filter(trainer => {
              // Verificar todas las posibles relaciones
              const relacionesEntrenador = [
                // Verificar registradoPor.uid
                trainer.registradoPor && trainer.registradoPor.uid === currentUser.uid,
                // Verificar gimnasioId
                trainer.gimnasioId === userDetails.id,
                // Verificar gimnasio
                trainer.gimnasio === userDetails.id,
                // Verificar en el objeto registradoPor completo
                trainer.registradoPor && JSON.stringify(trainer.registradoPor).includes(currentUser.uid)
              ];
              
              // Devolver true si cualquiera de las condiciones es verdadera
              return relacionesEntrenador.some(relacion => relacion === true);
            });
            
            console.log("Entrenadores encontrados:", usersData.length);
          } else {
            // Para trainees
            usersData = traineesData.filter(trainee => {
              // Verificar si el trainee fue registrado por este gimnasio
              const registradoPorGimnasio = trainee.registradoPor && 
                trainee.registradoPor.uid === userDetails.uid;
              
              // Verificar si el trainee tiene asignado este gimnasio
              const asignadoAGimnasio = 
                trainee.gimnasioId === userDetails.id || 
                trainee.gimnasio === userDetails.id;
              
              return registradoPorGimnasio || asignadoAGimnasio;
            });
          }
        } else if (userType === 'entrenador') {
          // Para entrenadores, mostrar solo sus trainees
          usersData = traineesData.filter(trainee => {
            // Verificar si el trainee fue registrado por este entrenador
            const registradoPorEntrenador = trainee.registradoPor && 
              trainee.registradoPor.uid === userDetails.uid;
            
            // Verificar si el trainee tiene asignado este entrenador
            const asignadoAEntrenador = 
              trainee.entrenadorId === userDetails.id || 
              trainee.entrenador === userDetails.id;
            
            return registradoPorEntrenador || asignadoAEntrenador;
          });
        }
        
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
    setOpenMembershipDialog(true);
  };

  // Abrir diálogo de pausa
  const handleOpenPauseDialog = (user) => {
    if (!user || !user.activeMembership) return;
    setSelectedUser(user);
    setOpenPauseDialog(true);
  };

  // Actualizar usuarios después de cambios en membresías
  const handleUsersUpdate = (updatedUsers) => {
    setUsers(updatedUsers);
  };

  // Renderizar la interfaz principal
  return (
    <Container maxWidth="xl" className="user-management-container">
      <Typography variant="h4" component="h1" className="page-title">
        {userType === 'super-administrador' ? 'Administración de Usuarios' : 
         userType === 'gimnasio' ? 'Gestión de Miembros' : 
         userType === 'entrenador' ? 'Mis Trainees' : 'Gestión de Usuarios'}
      </Typography>
      
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: '#BBFF00', mb: 2 }} />
          <Typography variant="body1" sx={{ color: '#FFFFFF' }}>
            Cargando usuarios...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {!loading && !error && (
        <>
          {/* Pestañas para diferentes tipos de usuarios */}
          {userType === 'super-administrador' && (
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              className="user-tabs"
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Gimnasios" />
              <Tab label="Entrenadores" />
              <Tab label="Trainees" />
            </Tabs>
          )}
          
          {userType === 'gimnasio' && (
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              className="user-tabs"
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Entrenadores" />
              <Tab label="Trainees" />
            </Tabs>
          )}
          
          {/* Filtros y búsqueda */}
          <Box sx={{ display: 'flex', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Buscar usuario"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#BBFF00' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: '250px' }}
            />
            
            {filteredUsers.some(user => user.userType === 'trainee') && (
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Filtrar por estado</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Filtrar por estado"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Membresía activa</MenuItem>
                  <MenuItem value="inactive">Sin membresía</MenuItem>
                  <MenuItem value="expiring">Por vencer (7 días)</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {/* Botón para añadir entrenador - solo visible para gimnasios en la pestaña de entrenadores */}
            {userType === 'gimnasio' && tabValue === 0 && (
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={() => setOpenEntrenadorForm(true)}
                className="add-button"
                sx={{ 
                  backgroundColor: '#BBFF00', 
                  color: '#000000',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#CCFF33',
                    boxShadow: '0 0 15px rgba(187, 255, 0, 0.7)'
                  }
                }}
              >
                Nuevo Entrenador
              </Button>
            )}
            
            {/* Botón para añadir trainee - visible para gimnasios y entrenadores en la pestaña de trainees */}
            {((userType === 'gimnasio' && tabValue === 1) || 
              (userType === 'entrenador') || 
              (userType === 'super-administrador' && tabValue === 2)) && (
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={() => setOpenTraineeForm(true)}
                className="add-button"
                sx={{ 
                  backgroundColor: '#BBFF00', 
                  color: '#000000',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#CCFF33',
                    boxShadow: '0 0 15px rgba(187, 255, 0, 0.7)'
                  }
                }}
              >
                Nuevo Trainee
              </Button>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Refresh 
                sx={{ 
                  color: '#BBFF00', 
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }} 
                onClick={() => window.location.reload()}
              />
            </Box>
          </Box>
          
          {/* Lista de usuarios */}
          <UsersList 
            filteredUsers={filteredUsers} 
            handleOpenMembershipDialog={handleOpenMembershipDialog}
            handleOpenPauseDialog={handleOpenPauseDialog}
            handleUsersUpdate={handleUsersUpdate}
            users={users}
            userDetails={userDetails}
          />
          
          {/* Componente de gestión de membresías */}
          <MembershipManager
            selectedUser={selectedUser}
            openMembershipDialog={openMembershipDialog}
            setOpenMembershipDialog={setOpenMembershipDialog}
            openPauseDialog={openPauseDialog}
            setOpenPauseDialog={setOpenPauseDialog}
            users={users}
            setUsers={setUsers}
            userDetails={userDetails}
          />
          
          {/* Añadir el formulario de entrenador */}
          <EntrenadorForm 
            open={openEntrenadorForm} 
            onClose={() => setOpenEntrenadorForm(false)}
            onSuccess={handleEntrenadorCreated}
          />
          
          {/* Añadir el formulario de trainee */}
          <TraineeForm
            open={openTraineeForm}
            onClose={() => setOpenTraineeForm(false)}
            onSuccess={() => {
              // Recargar la lista de usuarios
              window.location.reload();
            }}
            userType={userType}
            gimnasios={users.filter(user => user.userType === 'gimnasio')}
            entrenadores={users.filter(user => user.userType === 'entrenador')}
            selectedGimnasio={userType === 'gimnasio' ? userDetails?.id : ''}
            selectedEntrenador={userType === 'entrenador' ? userDetails?.id : ''}
          />
        </>
      )}
    </Container>
  );
}

export default UserManagement;

// Función para manejar la creación exitosa de un entrenador
const handleEntrenadorCreated = () => {
  // Recargar la página para mostrar el nuevo entrenador
  window.location.reload();
};

// Remove these functions that are outside the component