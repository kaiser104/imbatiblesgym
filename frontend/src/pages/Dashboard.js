// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    gyms: 0,
    trainers: 0,
    trainees: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const gymsResponse = await api.get('/gimnasios/');
        const trainersResponse = await api.get('/entrenadores/');
        const traineesResponse = await api.get('/trainees/');
        setStats({
          gyms: gymsResponse.data.length,
          trainers: trainersResponse.data.length,
          trainees: traineesResponse.data.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchStats();
  }, []);

  const data = [
    { name: 'Gimnasios', count: stats.gyms },
    { name: 'Entrenadores', count: stats.trainers },
    { name: 'Trainees', count: stats.trainees },
  ];

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="cards-container">
        <div className="card">
          <h2>Gimnasios</h2>
          <p>{stats.gyms}</p>
        </div>
        <div className="card">
          <h2>Entrenadores</h2>
          <p>{stats.trainers}</p>
        </div>
        <div className="card">
          <h2>Trainees</h2>
          <p>{stats.trainees}</p>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
