// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Home = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/home/')
      .then(response => setData(response.data))
      .catch(error => {
        console.error('Error al obtener datos:', error);
        setError('Hubo un problema al cargar los datos.');
      });
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (!data) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h1>Bienvenido</h1>
      <p>{data.message}</p>
    </div>
  );
};

export default Home;
