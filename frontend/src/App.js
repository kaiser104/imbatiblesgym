// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Gimnasios from './pages/Gimnasios';
import Entrenadores from './pages/Entrenadores';
import Trainees from './pages/Trainees';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="main-container">
          <Sidebar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/gimnasios" element={<Gimnasios />} />
              <Route path="/entrenadores" element={<Entrenadores />} />
              <Route path="/trainees" element={<Trainees />} />
            </Routes>
          </main>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
