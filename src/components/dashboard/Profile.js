import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://127.0.0.1:8000/api/profile/", {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => setUser(data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  return (
    <div>
      <h1>Perfil</h1>
      {user ? <p>Bienvenido, {user.username}</p> : <p>Cargando...</p>}
      <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>
        Cerrar sesión
      </button>
    </div>
  );
};

export default Profile;
