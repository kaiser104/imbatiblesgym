import { useEffect, useState } from "react";
import { getHomeMessage } from "../services/api";  // 📌 Asegúrate de que la ruta es correcta

function Home() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        getHomeMessage().then((data) => {
            if (data) setMessage(data.message);
        });
    }, []);

    return (
        <div>
            <h1>{message || "Cargando..."}</h1>
        </div>
    );
}

export default Home;
