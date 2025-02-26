// src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li>
            <NavLink end to="/" activeclassname="active">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/gimnasios" activeclassname="active">
              Gimnasios
            </NavLink>
          </li>
          <li>
            <NavLink to="/entrenadores" activeclassname="active">
              Entrenadores
            </NavLink>
          </li>
          <li>
            <NavLink to="/trainees" activeclassname="active">
              Trainees
            </NavLink>
          </li>
          {/* Puedes agregar más enlaces según sea necesario */}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
