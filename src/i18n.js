import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        "welcome": "Welcome to Imbatibles Gym",
        "login": "Login",
        "register": "Register",
      },
    },
    es: {
      translation: {
        "welcome": "Bienvenido a Imbatibles Gym",
        "login": "Iniciar sesión",
        "register": "Registrarse",
      },
    },
  },
  lng: "es", // Idioma por defecto
  fallbackLng: "en", // Idioma alternativo si no encuentra traducción
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
