// frontend/src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Gimnasios from './pages/Gimnasios';
import Entrenadores from './pages/Entrenadores';
import Trainees from './pages/Trainees';
import ExerciseLibrary from './pages/ExerciseLibrary';
import UploadExercise from './pages/UploadExercise';
import EditExercise from './pages/EditExercise';
import ImportExercises from './pages/ImportExercises';
import './App.css';

function App() {
  return (
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
            <Route path="/library" element={<ExerciseLibrary />} />
            <Route path="/upload" element={<UploadExercise />} />
            <Route path="/edit/:id" element={<EditExercise />} />
            <Route path="/import" element={<ImportExercises />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
