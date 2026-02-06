import { useEffect, useRef, useMemo, useState } from "react";

// Language code to display name (simplified)
const LANGUAGE_NAMES = {
    'en-US': 'EN', 'en': 'EN', 'hi': 'HI', 'hi-IN': 'HI',
    'es': 'ES', 'fr': 'FR', 'de': 'DE', 'zh': 'ZH',
    'ja': 'JA', 'ko': 'KO', 'pt': 'PT', 'ar': 'AR', 'ru': 'RU',
};

const getLanguageName = (code) => LANGUAGE_NAMES[code] || code?.slice(0, 2)?.toUpperCase() || '';

/**
 * Google Meet-style caption overlay - OPTIMIZED FOR VISIBILITY
 * - Larger text with high contrast
 * - Smooth fade animations
 * - Maximum 2 lines displayed
 */
function CaptionOverlay({ captions = [], userLanguage }) {
    const containerRef = useRef(null);
    const [showOverlay, setShowOverlay] = useState(false);

    // Process captions into display format
    const displayCaptions = useMemo(() => {
        const recentCaptions = captions.slice(-5);
        return recentCaptions.map((caption) => {
            const displayText = caption.text || caption.originalText;
            const wasTranslated = caption.isTranslated || (caption.text !== caption.originalText);
            return {
                id: caption.utteranceId || caption._id || caption.id || `${caption.speakerUserId}-${caption.timestamp}`,
                speakerName: caption.speakerName || "Participant",
                text: displayText,
                isFinal: caption.isFinal,
                isTranslated: wasTranslated,
                originalLang: getLanguageName(caption.language),
            };
        });
    }, [captions, userLanguage]);

    // Show immediately when captions arrive, hide after inactivity
    useEffect(() => {
        if (captions.length > 0) {
            setShowOverlay(true);
            const timer = setTimeout(() => setShowOverlay(false), 10000); // 10 second timeout
            return () => clearTimeout(timer);
        }
    }, [captions]);

    // Auto-scroll
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [displayCaptions]);

    // Always render container, control visibility with opacity
    return (
        <div
            ref={containerRef}
            className={`w-full max-w-4xl mx-auto flex flex-col items-center gap-2 pointer-events-none transition-all duration-300 ease-in-out ${showOverlay && displayCaptions.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            style={{ maxHeight: '120px', overflow: 'hidden' }}
        >
            {displayCaptions.slice(-2).map((caption, index) => (
                <div
                    key={caption.id}
                    className={`
                        w-fit max-w-full px-6 py-3 rounded-xl
                        bg-black/80 backdrop-blur-md
                        shadow-[0_4px_30px_rgba(0,0,0,0.5)]
                        transform transition-all duration-300 ease-out
                        ${index === displayCaptions.slice(-2).length - 1 ? 'scale-100' : 'scale-95 opacity-70'}
                    `}
                >
                    <p className="text-center">
                        <span className="text-blue-400 font-semibold text-sm mr-2 tracking-wide">
                            {caption.speakerName}:
                        </span>
                        <span
                            className={`text-lg font-medium leading-relaxed ${caption.isFinal ? 'text-white' : 'text-white/80 italic'
                                }`}
                            style={{
                                textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                                letterSpacing: '0.02em'
                            }}
                        >
                            {caption.text}
                        </span>
                        {caption.isTranslated && (
                            <span className="ml-2 text-xs text-amber-400 font-medium">
                                ({caption.originalLang})
                            </span>
                        )}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default CaptionOverlay;

