import { useState, useEffect, useCallback } from "react";

export function useCaptions(socket, meetingId, userLanguage) {
    const [captions, setCaptions] = useState([]);
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        if (!socket) return;

        const handleIncomingCaption = (data) => {
            setCaptions((prev) => {
                // Keep last 50 captions
                const updated = [...prev, data];
                return updated.slice(-50);
            });
        };

        socket.on("caption:incoming", handleIncomingCaption);

        return () => {
            socket.off("caption:incoming", handleIncomingCaption);
        };
    }, [socket]);

    const sendCaption = useCallback(
        (text, language, isFinal = false) => {
            if (socket && meetingId) {
                socket.emit("caption:send", {
                    meetingId,
                    text,
                    language,
                    isFinal,
                });
            }
        },
        [socket, meetingId]
    );

    const clearCaptions = useCallback(() => {
        setCaptions([]);
    }, []);

    const toggleCaptions = useCallback(() => {
        setIsEnabled((prev) => !prev);
    }, []);

    return {
        captions: isEnabled ? captions : [],
        isEnabled,
        sendCaption,
        clearCaptions,
        toggleCaptions,
    };
}
