const API_URL = "http://127.0.0.1:8000/api/";

export const loginUser = async (username, password) => {
  const response = await fetch(`${API_URL}login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("token", data.token); // Guarda el token en localStorage
  }
  return data;
};

export const getProfile = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}profile/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`,  // <-- Enviamos el token en la cabecera
    },
  });

  return response.json();
};
