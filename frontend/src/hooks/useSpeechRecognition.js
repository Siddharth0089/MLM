import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook to handle browser-based speech recognition
 * Uses Web Speech API for speech-to-text
 */
// Hook to handle browser-based speech recognition and socket-based captioning
// Hook to handle browser-based speech recognition and socket-based captioning
export function useSpeechRecognition(socket, meetingId, userName, language = "en-US", userId) {
    const [isListening, setIsListening] = useState(false);
    const [captions, setCaptions] = useState([]); // Store incoming captions
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef(null);
    const socketRef = useRef(socket);
    const meetingIdRef = useRef(meetingId);

    const userNameRef = useRef(userName);
    const userIdRef = useRef(userId);
    const isListeningRef = useRef(isListening);
    const lastEmitTimeRef = useRef(0);

    // Keep refs up to date
    useEffect(() => {
        socketRef.current = socket;
        meetingIdRef.current = meetingId;
        userNameRef.current = userName;
        userIdRef.current = userId;
        isListeningRef.current = isListening;
    }, [socket, meetingId, userName, isListening, userId]);

    // Socket: Listen for incoming captions
    useEffect(() => {
        if (!socket) return;

        const handleCaption = (data) => {
            console.log("Creating/Updating Caption:", data); // DEBUG LOG
            setCaptions((prev) => {
                // If text is empty, ignore
                if (!data.text) return prev;

                const lastCaption = prev[prev.length - 1];

                // If the last caption matches the utteranceId, replace it (stream update)
                if (lastCaption && lastCaption.utteranceId === data.utteranceId) {
                    const newCaptions = [...prev];
                    newCaptions[newCaptions.length - 1] = data;
                    return newCaptions;
                }

                // Fallback: If no utteranceId (old clients) but same speaker and not final, replace
                if (!data.utteranceId && lastCaption && lastCaption.speakerName === data.speakerName && !lastCaption.isFinal) {
                    const newCaptions = [...prev];
                    newCaptions[newCaptions.length - 1] = data;
                    return newCaptions;
                }

                // Otherwise, append as new caption
                console.log("Appending new caption:", data); // DEBUG LOG
                const newCaptions = [...prev, data];
                // Keep last 50 captions to avoid memory bloat
                if (newCaptions.length > 50) return newCaptions.slice(newCaptions.length - 50);
                return newCaptions;
            });
        };

        socket.on("caption:incoming", handleCaption);

        return () => {
            socket.off("caption:incoming", handleCaption);
        };
    }, [socket]);

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
                    const utteranceId = `${socket.id}-${i}`; // Stable ID for this sentence

                    if (result.isFinal) {
                        final += result[0].transcript;
                        // Broadcast final immediately
                        if (socketRef.current && meetingIdRef.current) {
                            socketRef.current.emit("caption:send", {
                                meetingId: meetingIdRef.current,
                                speakerUserId: userIdRef.current,
                                speakerName: userNameRef.current,
                                text: result[0].transcript,
                                language: language,
                                isFinal: true,
                                utteranceId
                            });
                        }
                    } else {
                        interim += result[0].transcript;
                        // Throttling interim updates
                        const now = Date.now();
                        if (now - lastEmitTimeRef.current > 100 && socketRef.current && meetingIdRef.current) {
                            socketRef.current.emit("caption:send", {
                                meetingId: meetingIdRef.current,
                                speakerUserId: userIdRef.current,
                                speakerName: userNameRef.current,
                                text: interim,
                                language: language,
                                isFinal: false,
                                utteranceId
                            });
                            lastEmitTimeRef.current = now;
                        }
                    }
                }
                setInterimTranscript(interim);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setError(event.error);
                // Don't auto-stop on no-speech, just log
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                // Restart if we're still supposed to be listening (check ref for latest state)
                if (isListeningRef.current && recognitionRef.current) {
                    try {
                        console.log("Speech recognition ended, restarting...");
                        recognitionRef.current.start();
                    } catch (e) {
                        // Ignore already started errors
                    }
                } else {
                    setIsListening(false);
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
                } catch (e) { }
            }
        };
    }, [language]); // Only recreate when language changes

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
            } catch (e) { }
            setIsListening(false);
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
        setCaptions([]);
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        captions, // Return managed captions
        error,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
    };
}
