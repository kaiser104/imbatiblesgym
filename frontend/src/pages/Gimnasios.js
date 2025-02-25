// src/pages/Gimnasios.js
import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Se importa el servicio de API.

const Gimnasios = () => {
  const [gimnasios, setGimnasios] = useState([]);

  useEffect(() => {
    // Se realiza una llamada a la API para obtener la lista de gimnasios.
    // Se asume que el endpoint es '/gimnasios/'.
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
