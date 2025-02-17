import React, { useEffect, useState } from "react";
import { fetchData } from "./services/api";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/dashboard/Home";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Profile from "./components/dashboard/Profile";
import WorkoutPlanner from "./components/dashboard/WorkoutPlanner";
import ExerciseLibrary from "./components/dashboard/ExerciseLibrary";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/workouts" element={<WorkoutPlanner />} />
                <Route path="/exercises" element={<ExerciseLibrary />} />
            </Routes>
        </Router>
    );
}

export default App;
