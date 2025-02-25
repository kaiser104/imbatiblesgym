// src/pages/Gimnasios.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';

// Componente Gimnasios: obtiene la lista de gimnasios desde la API y los muestra.
const Gimnasios = () => {
  const [gimnasios, setGimnasios] = useState([]);

  useEffect(() => {
    // Se realiza una solicitud GET al endpoint '/gimnasios/'
    api.get('/gimnasios/')
      .then(response => {
        setGimnasios(response.data);
      })
      .catch(error => {
        console.error('Error al cargar los gimnasios:', error);
      });
  }, []);

  return (
    <div>
      <h1>Gimnasios</h1>
      {gimnasios.length > 0 ? (
        <ul>
          {gimnasios.map((gym) => (
            <li key={gym.id}>
              {gym.name} - {gym.address}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay gimnasios disponibles.</p>
      )}
    </div>
  );
};

export default Gimnasios;
