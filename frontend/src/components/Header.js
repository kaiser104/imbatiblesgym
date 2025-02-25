// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../logo simbolo marcad e agua.png';
import './Header.css';

function Header() {
  return (
    <header className="App-header">
      <div className="logo-container">
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
