import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

// Determine socket URL:
// 1. If VITE_API_URL is relative (starts with /), use root /
// 2. Otherwise strip /api from the end
const apiBase = import.meta.env.VITE_API_URL;
const SOCKET_URL = apiBase?.startsWith('/') ? '/' : (apiBase?.replace('/api', '') || "http://localhost:3000");

export function useSocket(userId, userName) {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!userId) return;

        // Initialize Socket.IO connection
        const socket = io(SOCKET_URL, {
            auth: {
                userId,
                userName,
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            setIsConnected(true);
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            setIsConnected(false);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [userId, userName]);

    const joinMeeting = useCallback((meetingId, preferredLanguage) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("meeting:join", {
                meetingId,
                userId,
                displayName: userName,
                preferredLanguage,
            });
        }
    }, [isConnected, userId, userName]);

    const sendNoteUpdate = useCallback((meetingId, noteData) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("note:update", {
                meetingId,
                ...noteData,
            });
        }
    }, [isConnected]);

    const sendCaption = useCallback((meetingId, captionData) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("caption:send", {
                meetingId,
                speakerUserId: userId,
                speakerName: userName,
                ...captionData,
            });
        }
    }, [isConnected, userId, userName]);

    const endMeeting = useCallback((meetingId) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("meeting:end", { meetingId });
        }
    }, [isConnected]);

    const raiseHand = useCallback((meetingId) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("hand:raise", {
                meetingId,
                userId,
                userName
            });
        }
    }, [isConnected, userId, userName]);

    const updateLanguage = useCallback((meetingId, newLanguage) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("language:update", {
                meetingId,
                userId,
                language: newLanguage
            });
        }
    }, [isConnected, userId]);

    const on = useCallback((event, handler) => {
        if (socketRef.current) {
            socketRef.current.on(event, handler);
        }
    }, []);

    const off = useCallback((event, handler) => {
        if (socketRef.current) {
            socketRef.current.off(event, handler);
        }
    }, []);

    // Chat helpers
    const sendChatMessage = useCallback((meetingId, text, language) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("chat:send", {
                meetingId,
                userId,
                userName,
                text,
                language,
            });
        }
    }, [isConnected, userId, userName]);

    const getChatHistory = useCallback((meetingId) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("chat:history", { meetingId });
        }
    }, [isConnected]);

    return {
        socket: socketRef.current,
        isConnected,
        joinMeeting,
        sendNoteUpdate,
        sendCaption,
        endMeeting,
        raiseHand,
        updateLanguage,
        sendChatMessage,
        getChatHistory,
        on,
        off,
    };
}
