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
    const retryCountRef = useRef(0);

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
                console.log("[DEBUG] Appending new caption:", data);
                const newCaptions = [...prev, data];
                // Keep last 50 captions to avoid memory bloat
                if (newCaptions.length > 50) return newCaptions.slice(newCaptions.length - 50);
                return newCaptions;
            });
        };

        console.log("[DEBUG] Listening for caption:incoming on socket:", socket.id);
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

            recognition.continuous = false; // Changed to false for better stability
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onresult = (event) => {
                // Successful result, reset retry count and clear errors
                retryCountRef.current = 0;
                setError(null);

                let interim = "";
                let final = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const utteranceId = `${socket.id}-${Date.now()}`; // Unique ID per sentence

                    if (result.isFinal) {
                        final += result[0].transcript;
                        // Broadcast final immediately
                        console.log("🎤 Speech Final:", result[0].transcript);

                        // OPTIMISTIC UPDATE: Show our own caption immediately
                        const finalCaption = {
                            id: Date.now(),
                            utteranceId,
                            speakerUserId: userIdRef.current,
                            speakerName: userNameRef.current || 'You',
                            originalText: result[0].transcript,
                            text: result[0].transcript, // For display
                            language: language,
                            isFinal: true,
                            timestamp: new Date()
                        };

                        setCaptions(prev => {
                            const newCaptions = [...prev, finalCaption];
                            if (newCaptions.length > 50) return newCaptions.slice(newCaptions.length - 50);
                            return newCaptions;
                        });

                        if (socketRef.current && meetingIdRef.current) {
                            console.log("🚀 Emitting caption:send (Final)");
                            socketRef.current.emit("caption:send", {
                                meetingId: meetingIdRef.current,
                                speakerUserId: userIdRef.current,
                                speakerName: userNameRef.current,
                                text: result[0].transcript,
                                language: language,
                                isFinal: true,
                                utteranceId
                            });
                        } else {
                            console.warn("⚠️ Cannot emit caption: Socket or Meeting ID missing", { socket: !!socketRef.current, meetingId: meetingIdRef.current });
                        }
                    } else {
                        interim += result[0].transcript;
                        // Throttling interim updates
                        const now = Date.now();
                        if (now - lastEmitTimeRef.current > 100 && socketRef.current && meetingIdRef.current) {
                            console.log("🚀 Emitting caption:send (Interim):", interim);
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

                // Ignore 'no-speech' error as it just means silence
                if (event.error === 'no-speech') {
                    return;
                }

                if (event.error === 'network' || event.error === 'aborted') {
                    retryCountRef.current += 1;
                    console.warn(`Speech Error (${event.error}) - attempt ${retryCountRef.current}`);
                    return;
                }

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
                        // Exponential backoff only for errors, instant restart for normal flow
                        const isError = !!error || retryCountRef.current > 0;
                        const backoffTime = isError ? Math.min(1000 * Math.pow(2, retryCountRef.current), 10000) : 50;

                        console.log(`Speech recognition ended. Restarting in ${backoffTime}ms...`);

                        setTimeout(() => {
                            if (isListeningRef.current && recognitionRef.current) {
                                try {
                                    // Do NOT clear error here, as we want persistent errors to remain visible
                                    // until a successful result clears them.
                                    recognitionRef.current.start();
                                } catch (e) {
                                    console.warn("Retry start failed:", e);
                                }
                            }
                        }, backoffTime);
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
        if (recognitionRef.current && !isListeningRef.current) { // Check ref to be safe against async state updates
            setError(null);
            retryCountRef.current = 0;
            setTranscript("");
            setInterimTranscript("");
            try {
                // Update language before starting
                recognitionRef.current.lang = language;
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                // Ignore "already started" errors
                if (e.name === 'InvalidStateError' || e.message?.includes('already started')) {
                    console.warn("Ignored double-start attempt");
                    setIsListening(true); // Ensure state is synced
                    return;
                }
                console.error("Failed to start recognition:", e);
                setError("Failed to start speech recognition");
            }
        }
    }, [language]); // Removed isListening dep to avoid re-creation loops, rely on ref

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
            setIsListening(false);
            setError(null); // Clear any pending errors (like aborted)
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
        setCaptions([]);
    }, []);

    const simulateCaption = useCallback((text) => {
        const fakeCaption = {
            id: Date.now(),
            speakerName: "Debug User",
            originalText: text,
            text, // Keep text for any legacy usage
            isFinal: true,
            originalLanguage: "en-US",
            timestamp: new Date()
        };
        setCaptions(prev => [...prev, fakeCaption]);
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
        simulateCaption // Export debug function
    };
}
