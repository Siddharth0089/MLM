import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { FileTextIcon, GlobeIcon, SaveIcon, LockIcon } from "lucide-react";

function MeetingNotesPanel({
    meetingId,
    userId,
    userLanguage,
    socket,
    onNoteChange
}) {
    const { t } = useTranslation();
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const [syncing, setSyncing] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const debounceTimerRef = useRef(null);
    const lockTimerRef = useRef(null);

    // Use refs for state that needs to be accessed in callbacks without stale closures
    const hasFocusRef = useRef(false);
    const isTypingRef = useRef(false);
    const lastSentTextRef = useRef("");

    // Typing lock state (for UI display only)
    const [isLocked, setIsLocked] = useState(false);

    // Initialize Quill editor
    useEffect(() => {
        if (!editorRef.current || quillRef.current) return;

        const quill = new Quill(editorRef.current, {
            theme: "snow",
            placeholder: t("meeting.notes"),
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["clean"],
                ],
            },
        });

        quillRef.current = quill;

        // Track focus state
        quill.root.addEventListener('focus', () => {
            hasFocusRef.current = true;
        });

        quill.root.addEventListener('blur', () => {
            hasFocusRef.current = false;
        });

        // Handle text changes - REAL-TIME with 150ms debounce
        quill.on("text-change", (delta, oldDelta, source) => {
            // Only trigger update if change came from user (not API/Socket)
            if (source !== 'user') return;

            const content = quill.getText();
            const html = quill.root.innerHTML;

            // Mark as typing immediately
            if (!isTypingRef.current && socket && meetingId) {
                isTypingRef.current = true;
                socket.emit("note:lock", { meetingId, userId });
            }

            // Clear previous timers
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (lockTimerRef.current) {
                clearTimeout(lockTimerRef.current);
            }

            // FAST debounce - 150ms for near real-time
            debounceTimerRef.current = setTimeout(() => {
                if (socket && meetingId) {
                    setSyncing(true);
                    lastSentTextRef.current = content.trim(); // Remember what we sent
                    socket.emit("note:update", {
                        meetingId,
                        plainText: content,
                        html: html,
                        canonicalLanguage: userLanguage,
                    });

                    setLastSaved(new Date());
                    setTimeout(() => setSyncing(false), 300);
                }

                if (onNoteChange) {
                    onNoteChange(content, html);
                }
            }, 150);

            // Release lock after 2 seconds of inactivity
            lockTimerRef.current = setTimeout(() => {
                if (socket && meetingId) {
                    socket.emit("note:unlock", { meetingId, userId });
                    isTypingRef.current = false;
                }
            }, 2000);
        });

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (lockTimerRef.current) {
                clearTimeout(lockTimerRef.current);
            }
            quillRef.current = null;
        };
    }, [t, meetingId, userLanguage, socket, onNoteChange, userId]);

    // Listen for lock/unlock and translated notes
    useEffect(() => {
        if (!socket) return;

        const handleTranslatedNote = (data) => {
            if (data.language !== userLanguage) return;

            const incomingText = (data.text || "").trim();
            const currentText = quillRef.current ? quillRef.current.getText().trim() : "";

            // CRITICAL: Don't update if:
            // 1. Editor has focus (user is actively typing)
            // 2. User is currently typing (ref-based check)
            // 3. Incoming text matches what we last sent (echo prevention)
            // 4. Incoming text is the same as current content
            if (hasFocusRef.current || isTypingRef.current) {
                return; // User is actively editing, ignore incoming
            }

            if (incomingText === lastSentTextRef.current) {
                return; // This is our own echo, ignore
            }

            if (incomingText === currentText) {
                return; // Same content, no need to update
            }

            // Safe to update - user is not typing
            if (quillRef.current) {
                const range = quillRef.current.getSelection();
                quillRef.current.setText(data.text, 'api');
                if (range) {
                    quillRef.current.setSelection(range.index, range.length, 'api');
                }
            }
        };

        const handleLock = (data) => {
            if (data.userId !== userId) {
                setIsLocked(true);
            }
        };

        const handleUnlock = (data) => {
            setIsLocked(false);
        };

        socket.on("note:translated", handleTranslatedNote);
        socket.on("note:locked", handleLock);
        socket.on("note:unlocked", handleUnlock);

        return () => {
            socket.off("note:translated", handleTranslatedNote);
            socket.off("note:locked", handleLock);
            socket.off("note:unlocked", handleUnlock);
        };
    }, [socket, userLanguage, userId]);

    return (
        <div className="h-full flex flex-col bg-base-100 rounded-lg overflow-hidden meeting-notes-container">
            <style>{`
                .meeting-notes-container .ql-toolbar ~ .ql-toolbar {
                    display: none !important;
                }
            `}</style>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-200">
                <div className="flex items-center gap-2">
                    <FileTextIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-base-content">{t("meeting.notes")}</h3>
                </div>
                <div className="flex items-center gap-3">
                    {/* Lock Indicator */}
                    {isLocked && (
                        <span className="text-xs text-warning flex items-center gap-1 animate-pulse">
                            <LockIcon className="w-3 h-3" />
                            Someone is editing...
                        </span>
                    )}

                    {/* Sync Status */}
                    {syncing ? (
                        <span className="text-xs text-primary flex items-center gap-1">
                            <span className="loading loading-spinner loading-xs"></span>
                            {t("meeting.syncing")}
                        </span>
                    ) : lastSaved ? (
                        <span className="text-xs text-success flex items-center gap-1">
                            <SaveIcon className="w-3 h-3" />
                            {t("meeting.saved")}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Language Indicator */}
            <div className="px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-base-300">
                <div className="flex items-center gap-2 text-sm">
                    <GlobeIcon className="w-4 h-4 text-primary" />
                    <span className="text-base-content/70">
                        {t("meeting.translating")} → <strong>{userLanguage}</strong>
                    </span>
                </div>
            </div>

            {/* Editor Container - Using overlay for lock instead of quill.disable() */}
            <div className="flex-1 overflow-auto p-4 relative">
                <div
                    ref={editorRef}
                    className="min-h-[300px] bg-white rounded-lg border border-base-300 text-gray-900"
                ></div>

                {/* Lock overlay - prevents interaction without breaking layout */}
                {isLocked && (
                    <div
                        className="absolute inset-0 m-4 bg-black/5 rounded-lg cursor-not-allowed flex items-center justify-center"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <div className="bg-warning/90 text-warning-content px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                            <LockIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Someone else is editing...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MeetingNotesPanel;
