import { useState, useEffect, useRef, useCallback } from "react";

export function useRealTimeTranslations(socket, meetingId, userName, language = "en-US", userId) {
    const [isListening, setIsListening] = useState(false);
    const [captions, setCaptions] = useState([]);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef(null);
    const socketRef = useRef(socket);
    const retryCountRef = useRef(0);
    const isListeningRef = useRef(false);
    const maxRetries = 5; // Stop retrying after 5 attempts

    // Update refs
    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            setError("Speech recognition not supported in this browser");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Use continuous for fewer restarts
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event) => {
            setError(null);
            retryCountRef.current = 0;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;
                const isFinal = result.isFinal;
                const utteranceId = `${socket.id}-${Date.now()}-${i}`; // Unique ID

                // 1. Optimistic Update (Local)
                const captionData = {
                    id: utteranceId,
                    utteranceId,
                    speakerUserId: userId,
                    speakerName: userName || "You",
                    originalText: text,
                    text: text, // Display text (initially same as original)
                    language: language,
                    isFinal: isFinal,
                    timestamp: new Date()
                };

                updateCaptions(captionData);

                // 2. Emit to Backend
                if (socketRef.current && (isFinal || text.trim().length > 0)) {
                    socketRef.current.emit("speech:monitor", {
                        meetingId,
                        text,
                        isFinal,
                        language,
                        utteranceId
                    });
                }
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech Error:", event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setIsListening(false);
                isListeningRef.current = false;
                setError("Microphone access denied");
            } else if (event.error === 'network') {
                // Network error - likely flaky connection or restriction
                // Do NOT set error state yet, try to retry in onend
            } else if (event.error === 'aborted') {
                // Ignore aborted errors
            }
        };

        recognition.onend = () => {
            if (isListeningRef.current) {
                // Check if we've exceeded max retries
                if (retryCountRef.current >= maxRetries) {
                    setError("Speech service unavailable. Please check your network.");
                    setIsListening(false);
                    isListeningRef.current = false;
                    return;
                }

                // Exponential Backoff
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000); // Max 10s
                retryCountRef.current += 1;

                setTimeout(() => {
                    if (isListeningRef.current && recognitionRef.current) {
                        try {
                            recognitionRef.current.start();
                        } catch (e) {
                            if (e.name !== 'InvalidStateError') {
                                console.warn("Retry failed:", e);
                            }
                        }
                    }
                }, delay);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { }
            }
        };
    }, [language, meetingId, userId, userName]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        // 1. Receive Raw Speech from Others
        const handleSpeechIncoming = (data) => {
            // data matches the structure emitted by backend
            const captionData = {
                id: data.utteranceId,
                utteranceId: data.utteranceId,
                speakerUserId: data.speakerUserId,
                speakerName: data.speakerName,
                originalText: data.text,
                text: data.text, // Default to showing original until translation arrives
                language: data.originalLanguage,
                isFinal: data.isFinal,
                timestamp: new Date(data.timestamp)
            };
            updateCaptions(captionData);
        };

        // 2. Receive Translations
        const handleTranslationIncoming = (data) => {
            const { utteranceId, translations } = data;

            setCaptions(prev => prev.map(cap => {
                if (cap.utteranceId === utteranceId) {
                    // Find translation for our current language
                    const translation = translations.find(t => t.language === language);
                    if (translation) {
                        return {
                            ...cap,
                            text: translation.text, // Replace display text with translation
                            isTranslated: true
                        };
                    }
                }
                return cap;
            }));
        };

        socket.on("speech:incoming", handleSpeechIncoming);
        socket.on("translation:incoming", handleTranslationIncoming);

        return () => {
            socket.off("speech:incoming", handleSpeechIncoming);
            socket.off("translation:incoming", handleTranslationIncoming);
        };
    }, [socket, language]);

    // Helper to merge/update captions
    const updateCaptions = (newCaption) => {
        setCaptions(prev => {
            // Check if we already have this utterance (stream update)
            const existingIndex = prev.findIndex(c => c.utteranceId === newCaption.utteranceId);

            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    ...newCaption,
                    // Preserve translation if we already had it and this is just a finalization of original
                    text: updated[existingIndex].isTranslated ? updated[existingIndex].text : newCaption.text
                };
                return updated;
            }

            // Append new
            const next = [...prev, newCaption];
            if (next.length > 50) return next.slice(next.length - 50);
            return next;
        });
    };

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                isListeningRef.current = true;
            } catch (e) {
                if (e.name !== 'InvalidStateError') {
                    console.warn("Start failed:", e);
                }
                // Assume running if InvalidStateError or other error
                setIsListening(true);
                isListeningRef.current = true;
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            isListeningRef.current = false;
        }
    }, []);

    const resetTranscript = useCallback(() => setCaptions([]), []);

    // Debug helper
    const simulateCaption = useCallback((text) => {
        updateCaptions({
            id: Date.now(),
            utteranceId: `sim-${Date.now()}`,
            speakerUserId: "sim-user",
            speakerName: "Simulator",
            originalText: text,
            text: text,
            language: "en-US",
            isFinal: true,
            timestamp: new Date()
        });
    }, []);

    return {
        isListening,
        captions,
        error,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
        simulateCaption
    };
}
