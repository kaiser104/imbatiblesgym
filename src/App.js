import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/dashboard/Home";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Profile from "./components/dashboard/Profile";
import WorkoutPlanner from "./components/dashboard/WorkoutPlanner";
import ExerciseLibrary from "./components/dashboard/ExerciseLibrary";

const App = () => {
  return (
    <Router>
      <nav>
        <ul>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Registro</Link></li>
          <li><Link to="/profile">Perfil</Link></li>
          <li><Link to="/workout-planner">Planificador</Link></li>
          <li><Link to="/exercise-library">Biblioteca</Link></li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/workout-planner" element={<WorkoutPlanner />} />
        <Route path="/exercise-library" element={<ExerciseLibrary />} />
      </Routes>
    </Router>
  );
};

export default App;
