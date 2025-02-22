// src/components/dashboard/Profile.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token"); // Usamos la clave "access_token"
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/profile/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,  // Nota: 'Bearer' y luego el token
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUser(data);
        } else {
          // Si el token no es válido o ha expirado, lo removemos y redirigimos
          localStorage.removeItem("access_token");
          navigate("/login");
        }
      } catch (error) {
        console.error("Error al obtener el perfil:", error);
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  return user ? (
    <div>
      <h1>Bienvenido, {user.username}</h1>
    </div>
  ) : (
    <p>Cargando...</p>
  );
};

export default Profile;
