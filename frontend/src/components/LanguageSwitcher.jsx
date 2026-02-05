import { useUser } from "../contexts/UserContext";
import { useTranslation } from "react-i18next";
import axios from "axios";

const LANGUAGES = [
    { code: "en-US", name: "English" },
    { code: "hi-IN", name: "हिंदी (Hindi)" },
    { code: "fr-FR", name: "Français (French)" },
    { code: "es-ES", name: "Español (Spanish)" },
];

function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const { user } = useUser();

    const handleLanguageChange = async (e) => {
        const newLanguage = e.target.value;

        // Update i18n
        i18n.changeLanguage(newLanguage);
        localStorage.setItem("preferredLanguage", newLanguage);

        // Update backend
        if (user?.id) {
            try {
                await axios.patch(`${import.meta.env.VITE_API_URL}/users/language`, {
                    userId: user.id,
                    preferredLanguage: newLanguage,
                });
            } catch (error) {
                console.error("Failed to update language preference:", error);
            }
        }
    };

    return (
        <select
            className="select select-sm"
            value={i18n.language}
            onChange={handleLanguageChange}
        >
            {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.name}
                </option>
            ))}
        </select>
    );
}

export default LanguageSwitcher;
