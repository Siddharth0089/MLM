import { useEffect, useRef, useMemo, useState } from "react";

// Language code to display name (simplified)
const LANGUAGE_NAMES = {
    'en-US': 'EN', 'en': 'EN', 'hi': 'HI', 'hi-IN': 'HI',
    'es': 'ES', 'fr': 'FR', 'de': 'DE', 'zh': 'ZH',
    'ja': 'JA', 'ko': 'KO', 'pt': 'PT', 'ar': 'AR', 'ru': 'RU',
};

const getLanguageName = (code) => LANGUAGE_NAMES[code] || code?.slice(0, 2)?.toUpperCase() || '';

/**
 * Google Meet-style caption overlay
 * - No background box
 * - Maximum 2 lines displayed
 * - Old text scrolls away as new text arrives
 */
function CaptionOverlay({ captions = [], userLanguage }) {
    const containerRef = useRef(null);

    // Process captions into display format
    const displayCaptions = useMemo(() => {
        // Take only last few captions
        const recentCaptions = captions.slice(-5);

        return recentCaptions.map((caption) => {
            let displayText = caption.originalText;
            let wasTranslated = false;

            // Find translation for user's language
            if (caption.originalLanguage !== userLanguage && caption.translations) {
                const translation = caption.translations.find(
                    (tr) => tr.language === userLanguage
                );
                if (translation) {
                    displayText = translation.text;
                    wasTranslated = true;
                }
            }

            return {
                id: caption.utteranceId || caption._id || caption.id || `${caption.speakerUserId}-${caption.timestamp}`,
                speakerName: caption.speakerName || "Participant",
                text: displayText,
                isFinal: caption.isFinal,
                isTranslated: wasTranslated,
                originalLang: getLanguageName(caption.originalLanguage),
            };
        });
    }, [captions, userLanguage]);

    const [showOverlay, setShowOverlay] = useState(false);

    // Auto-hide timer
    useEffect(() => {
        if (captions.length > 0) {
            console.log("[DEBUG] CaptionOverlay received captions:", captions.length, captions[captions.length - 1]);
            setShowOverlay(true);
            const timer = setTimeout(() => {
                // setShowOverlay(false); // DEBUG: Keep overlay visible
                console.log("[DEBUG] CaptionOverlay auto-hide trigger (IGNORED)");
            }, 5000); // Hide after 5 seconds of no new captions
            return () => clearTimeout(timer);
        }
    }, [captions]);

    // Auto-scroll
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [displayCaptions]);

    if (displayCaptions.length === 0 || !showOverlay) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="w-full flex flex-col items-center pointer-events-none transition-opacity duration-500 ease-in-out"
            style={{
                maxHeight: '80px',
                overflow: 'hidden',
                opacity: showOverlay ? 1 : 0
            }}
        >
            {/* Show only the last 2 caption entries for 2-line effect */}
            {displayCaptions.slice(-2).map((caption) => (
                <div
                    key={caption.id}
                    className="text-center px-4 py-2 max-w-3xl bg-black/40 backdrop-blur-sm rounded-lg"
                >
                    <span
                        className={`text-base leading-relaxed ${caption.isFinal ? 'text-white' : 'text-white/70 italic'
                            }`}
                        style={{
                            textShadow: '0 1px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
                        }}
                    >
                        <span className="text-white/60 text-sm mr-2">
                            {caption.speakerName}:
                        </span>
                        {caption.text}
                        {caption.isTranslated && (
                            <span className="ml-2 text-xs text-amber-400/80">
                                ({caption.originalLang})
                            </span>
                        )}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default CaptionOverlay;
