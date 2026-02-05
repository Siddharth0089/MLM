import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook to handle browser-based speech recognition
 * Uses Web Speech API for speech-to-text
 */
export function useSpeechRecognition(language = "en-US") {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onresult = (event) => {
                let interim = "";
                let final = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        final += result[0].transcript;
                    } else {
                        interim += result[0].transcript;
                    }
                }

                if (final) {
                    setTranscript(final);
                }
                setInterimTranscript(interim);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setError(event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                // Restart if we're still supposed to be listening
                if (isListening && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.log("Recognition already started");
                    }
                }
            };

            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
            setError("Speech recognition not supported in this browser");
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Already stopped
                }
            }
        };
    }, [language]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setError(null);
            setTranscript("");
            setInterimTranscript("");
            try {
                // Update language before starting
                recognitionRef.current.lang = language;
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Failed to start recognition:", e);
                setError("Failed to start speech recognition");
            }
        }
    }, [isListening, language]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Already stopped
            }
            setIsListening(false);
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        error,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
    };
}
