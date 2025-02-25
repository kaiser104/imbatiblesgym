// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header'; // Se importa el Header.
import Footer from './components/Footer';   // Se importa el Footer.
import Home from './pages/Home';
import Gimnasios from './pages/Gimnasios';
import Entrenadores from './pages/Entrenadores';
import Trainees from './pages/Trainees';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header /> {/* Se muestra el header con el logo y la navegación */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gimnasios" element={<Gimnasios />} />
            <Route path="/entrenadores" element={<Entrenadores />} />
            <Route path="/trainees" element={<Trainees />} />
          </Routes>
        </main>
        <Footer /> {/* Se muestra el footer */}
      </div>
    </Router>
  );
}

export default App;
