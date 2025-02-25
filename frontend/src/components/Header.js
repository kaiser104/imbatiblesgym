// src/components/Header.js
import './Header.css';
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../logo simbolo marcad e agua.png'; // Se importa el logo principal.
import './Header.css'; // Puedes definir estilos específicos para el header.

function Header() {
  return (
    <header className="App-header">
      <div className="logo-container">
        {/* Se muestra el logo principal */}
        <img src={logo} alt="Logo principal" className="App-logo" />
      </div>
      <nav>
        <ul>
          <li>
            <Link to="/">Inicio</Link>
          </li>
          <li>
            <Link to="/gimnasios">Gimnasios</Link>
          </li>
          <li>
            <Link to="/entrenadores">Entrenadores</Link>
          </li>
          <li>
            <Link to="/trainees">Trainees</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
