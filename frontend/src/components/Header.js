// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../logo simbolo marcad e agua.png'; // Asegúrate de que el nombre y la ubicación sean exactos
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="logo-container">
        <Link to="/">
          <img src={logo} alt="Logo principal" className="app-logo" />
        </Link>
      </div>
      <div className="header-actions">
        {/* Aquí puedes agregar botones o menús de usuario */}
      </div>
    </header>
  );
};

export default Header;
