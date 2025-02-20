import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    nickname: "",
    email: "",
    birth_date: "",
    objetivo_principal: [],
    zonas_interes: [],
    frecuencia_semanal: "3", // Valor por defecto
    username: "",
    password: "",
  });

  const objetivosOpciones = [
    "masa muscular",
    "definicion",
    "salud",
  ];

  const zonasOpciones = [
    "tren superior",
    "tren inferior",
    "core",
    "cuerpo completo",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((v) => v !== value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://127.0.0.1:8000/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert("Registro exitoso");
      navigate("/login");
    } else {
      alert("Error en el registro");
    }
  };

  return (
    <div>
      <h2>Registro</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="full_name" placeholder="Nombre completo" onChange={handleChange} required />
        <input type="text" name="nickname" placeholder="Nickname" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Correo electrónico" onChange={handleChange} required />
        <input type="date" name="birth_date" onChange={handleChange} required />

        <label>Objetivo principal:</label>
        {objetivosOpciones.map((opcion) => (
          <label key={opcion}>
            <input type="checkbox" name="objetivo_principal" value={opcion} onChange={handleChange} />
            {opcion}
          </label>
        ))}

        <label>Zonas de interés:</label>
        {zonasOpciones.map((opcion) => (
          <label key={opcion}>
            <input type="checkbox" name="zonas_interes" value={opcion} onChange={handleChange} />
            {opcion}
          </label>
        ))}

        <label>Frecuencia semanal:</label>
        <select name="frecuencia_semanal" onChange={handleChange}>
          {[...Array(7)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} días por semana
            </option>
          ))}
        </select>

        <input type="text" name="username" placeholder="Usuario" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} required />

        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
};

export default Register;
