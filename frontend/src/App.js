// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Gimnasios from './pages/Gimnasios';
import Entrenadores from './pages/Entrenadores';
import Trainees from './pages/Trainees';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gimnasios" element={<Gimnasios />} />
            <Route path="/entrenadores" element={<Entrenadores />} />
            <Route path="/trainees" element={<Trainees />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
