import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch("http://127.0.0.1:8000/api/profile/", {
                    headers: {
                        'Authorization': `Bearer ${token}`,  // Cambiado de Token a Bearer
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setUser(data);
                } else {
                    // Si el token ha expirado o es inválido
                    localStorage.removeItem("token");
                    navigate("/login");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                navigate("/login");
            }
        };

        fetchProfile();
    }, [navigate]);

    return user ? (
        <div>
            <h1>Bienvenido, {user.username}</h1>
            <button onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
            }}>
                Cerrar sesión
            </button>
        </div>
    ) : (
        <p>Cargando...</p>
    );
};

export default Profile;