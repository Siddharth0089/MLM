import { LingoDotDevEngine } from "lingo.dev/sdk";
import axios from "axios";

const LINGO_API_KEY = process.env.LINGO_API_KEY;

// Initialize Lingo.dev Engine SDK
let engine;
if (LINGO_API_KEY) {
    engine = new LingoDotDevEngine({
        apiKey: LINGO_API_KEY,
    });
    console.log("✅ Lingo.dev SDK initialized");
} else {
    console.warn("⚠️ LINGO_API_KEY not set - translation will be disabled");
}

class LingoService {
    /**
     * Translate text to multiple target languages
     * @param {string} text - Text to translate
     * @param {string} sourceLanguage - Source language code (e.g., "en-US")
     * @param {string[]} targetLanguages - Array of target language codes
     * @returns {Promise<Object>} - { targetLang: translatedText, ... }
     */
    async translateText(text, sourceLanguage, targetLanguages) {
        let useFallback = !engine;

        const translations = {};

        // Initialize translations object with source text
        targetLanguages.forEach(lang => {
            if (lang === sourceLanguage) {
                translations[lang] = text;
            }
        });

        if (!useFallback) {
            try {
                for (const targetLang of targetLanguages) {
                    if (targetLang === sourceLanguage) continue;

                    try {
                        const translated = await engine.localizeText(text, {
                            sourceLocale: sourceLanguage,
                            targetLocale: targetLang,
                        });
                        translations[targetLang] = translated;
                        console.log(`Translated "${text.substring(0, 30)}..." from ${sourceLanguage} to ${targetLang}`);
                    } catch (langError) {
                        console.warn(`Lingo translation error (${sourceLanguage}->${targetLang}):`, langError.message);
                        // Mark for fallback for this specific language if valid fallback exists
                        translations[targetLang] = null;
                    }
                }
            } catch (error) {
                console.error("Lingo engine error:", error.message);
                useFallback = true;
            }
        }

        // Fallback for missing translations
        const payloadSource = sourceLanguage.split("-")[0]; // Google often prefers 'en' over 'en-US'

        for (const targetLang of targetLanguages) {
            if (targetLang === sourceLanguage) continue;

            // If we already have a translation (and it's not null), skip
            if (translations[targetLang]) continue;

            try {
                const payloadTarget = targetLang.split("-")[0];
                console.log(`Using fallback translation for ${targetLang}`);

                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${payloadSource}&tl=${payloadTarget}&dt=t&q=${encodeURIComponent(text)}`;

                const response = await axios.get(url);
                // Response format: [[["Translated text", "Original text", ...], ...], ...]
                if (response.data && response.data[0] && response.data[0][0] && response.data[0][0][0]) {
                    translations[targetLang] = response.data[0][0][0];
                } else {
                    translations[targetLang] = text; // Ultimate fallback
                }
            } catch (fallbackError) {
                console.error(`Fallback translation error (${sourceLanguage}->${targetLang}):`, fallbackError.message);
                translations[targetLang] = text;
            }
        }

        return translations;
    }

    /**
     * Detect language of given text (placeholder - SDK may not support this directly)
     * @param {string} text - Text to detect language for
     * @returns {Promise<string>} - Detected language code
     */
    async detectLanguage(text) {
        // Note: The Lingo.dev SDK may not have a detect endpoint
        // For now, return default
        return "en-US";
    }

    /**
     * Translate a single caption text to target language
     * @param {string} text - Caption text
     * @param {string} sourceLanguage - Source language
     * @param {string} targetLanguage - Target language
     * @returns {Promise<string>} - Translated text
     */
    async translateCaption(text, sourceLanguage, targetLanguage) {
        if (sourceLanguage === targetLanguage) return text;

        if (!engine) {
            return text;
        }

        try {
            const translated = await engine.localizeText(text, {
                sourceLocale: sourceLanguage,
                targetLocale: targetLanguage,
            });
            return translated;
        } catch (error) {
            console.error(`Lingo caption translation error (${sourceLanguage}->${targetLanguage}):`, error.message);
            return text; // Return original on failure
        }
    }

    /**
     * Translate captions to multiple languages in parallel
     * @param {string} text - Caption text
     * @param {string} sourceLanguage - Source language
     * @param {string[]} targetLanguages - Target languages
     * @returns {Promise<Array>} - Array of { language, text } objects
     */
    async translateCaptionToMultiple(text, sourceLanguage, targetLanguages) {
        const translationPromises = targetLanguages.map(async (targetLang) => {
            const translatedText = await this.translateCaption(text, sourceLanguage, targetLang);
            return { language: targetLang, text: translatedText };
        });

        return Promise.all(translationPromises);
    }
}

export default new LingoService();
