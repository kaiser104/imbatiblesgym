import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Traducciones (ejemplo en español e inglés)
const resources = {
  en: {
    translation: {
      "welcome": "Welcome to Imbatibles Gym!"
    }
  },
  es: {
    translation: {
      "welcome": "¡Bienvenido a Imbatibles Gym!"
    }
  }
};

// Configuración de i18n
i18n
  .use(initReactI18next) // Conectar i18n con React
  .init({
    resources,
    lng: "es", // Idioma predeterminado
    fallbackLng: "en", // En caso de que no haya traducción en el idioma seleccionado
    interpolation: {
      escapeValue: false, // React ya maneja la sanitización
    }
  });

export default i18n;
