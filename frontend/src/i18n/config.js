import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";

const resources = {
    "en-US": { translation: en },
    "hi-IN": { translation: hi },
    "fr-FR": { translation: fr },
    "es-ES": { translation: es },
};

i18n.use(initReactI18next).init({
    resources,
    fallbackLng: "en-US",
    lng: localStorage.getItem("preferredLanguage") || "en-US",
    interpolation: {
        escapeValue: false, // React already escapes values
    },
});

export default i18n;
