import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useLanguage() {
    const { i18n } = useTranslation();
    const [language, setLanguage] = useState(
        localStorage.getItem("preferredLanguage") || i18n.language || "en-US"
    );

    const changeLanguage = useCallback(
        async (newLanguage) => {
            try {
                await i18n.changeLanguage(newLanguage);
                localStorage.setItem("preferredLanguage", newLanguage);
                setLanguage(newLanguage);
                return true;
            } catch (error) {
                console.error("Failed to change language:", error);
                return false;
            }
        },
        [i18n]
    );

    return {
        language,
        changeLanguage,
        availableLanguages: [
            { code: "en-US", name: "English" },
            { code: "hi-IN", name: "हिंदी (Hindi)" },
            { code: "fr-FR", name: "Français (French)" },
            { code: "es-ES", name: "Español (Spanish)" },
        ],
    };
}
