import { useState, useEffect, useCallback, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export function useNotes(meetingId, userId, userLanguage) {
    const [noteContent, setNoteContent] = useState("");
    const [translatedContent, setTranslatedContent] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const ydocRef = useRef(null);
    const providerRef = useRef(null);

    useEffect(() => {
        if (!meetingId) return;

        // Initialize Yjs document
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // WebSocket provider for CRDT synchronization
        const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '').replace('http', 'ws') || "ws://localhost:3000";
        const provider = new WebsocketProvider(
            wsUrl,
            `meeting-${meetingId}`,
            ydoc
        );
        providerRef.current = provider;

        provider.on("status", (event) => {
            setIsSyncing(event.status === "connecting");
        });

        provider.on("sync", (isSynced) => {
            setIsSyncing(!isSynced);
        });

        return () => {
            provider.destroy();
            ydoc.destroy();
        };
    }, [meetingId]);

    const updateNote = useCallback((content) => {
        setNoteContent(content);
    }, []);

    const getYDoc = useCallback(() => {
        return ydocRef.current;
    }, []);

    const getProvider = useCallback(() => {
        return providerRef.current;
    }, []);

    return {
        noteContent,
        translatedContent,
        isSyncing,
        updateNote,
        setTranslatedContent,
        getYDoc,
        getProvider,
    };
}
