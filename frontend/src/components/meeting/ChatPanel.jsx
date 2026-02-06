import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { XIcon, SendIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const ChatPanel = ({ meetingId, userId, userName, userLanguage, socket, onClose }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const messageCountRef = useRef(0);

    // Optimized scroll - only scroll when NEW message arrives
    useEffect(() => {
        if (messages.length > messageCountRef.current) {
            messageCountRef.current = messages.length;
            // Use instant scroll instead of smooth to avoid lag
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [messages]);

    // Load chat history and set up listeners
    useEffect(() => {
        if (!socket || !meetingId) return;

        // Request chat history
        socket.emit("chat:history", { meetingId });

        // Handle incoming history
        const handleHistory = ({ messages: historyMessages }) => {
            setMessages(historyMessages || []);
            messageCountRef.current = historyMessages?.length || 0;
            setIsLoading(false);
        };

        // Handle new messages
        const handleMessage = (message) => {
            setMessages((prev) => {
                // If message has clientMessageId, check if we already have it (optimistic update)
                if (message.clientMessageId) {
                    const index = prev.findIndex(m => m.clientMessageId === message.clientMessageId);
                    if (index !== -1) {
                        // Replace pending message with confirmed one
                        const newMessages = [...prev];
                        newMessages[index] = message;
                        return newMessages;
                    }
                }
                return [...prev, message];
            });
        };

        // Handle errors
        const handleError = ({ message }) => {
            console.error("Chat error:", message);
            setIsLoading(false);
        };

        socket.on("chat:history", handleHistory);
        socket.on("chat:message", handleMessage);
        socket.on("chat:error", handleError);

        return () => {
            socket.off("chat:history", handleHistory);
            socket.off("chat:message", handleMessage);
            socket.off("chat:error", handleError);
        };
    }, [socket, meetingId]);

    // Send message handler - memoized with useCallback
    const handleSend = useCallback(() => {
        if (!inputText.trim() || !socket) return;

        const text = inputText.trim();
        const clientMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        // Optimistic update
        const tempMsg = {
            _id: `temp-${clientMessageId}`,
            userId,
            userName,
            originalText: text,
            createdAt: now.toISOString(),
            clientMessageId,
            translations: {} // Translations arrive with server ack
        };

        setMessages(prev => [...prev, tempMsg]);
        setInputText("");

        socket.emit("chat:send", {
            meetingId,
            userId,
            userName,
            text,
            language: userLanguage || "en",
            clientMessageId
        });
    }, [inputText, socket, meetingId, userId, userName, userLanguage]);

    // Handle Enter key - memoized
    const handleKeyPress = useCallback((e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // Get translated text for display - memoized
    const getDisplayText = useCallback((message) => {
        // Check if there's a translation for user's language
        if (message.translations && message.translations[userLanguage]) {
            return message.translations[userLanguage];
        }
        // Fall back to original text
        return message.originalText;
    }, [userLanguage]);

    // Format time - memoized
    const formatTime = useCallback((timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }, []);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-base-100 p-4">
                <span className="loading loading-spinner loading-md"></span>
                <span className="ml-2 text-sm opacity-70">{t("Loading Chat...")}</span>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-base-100 flex flex-col border-l border-base-300 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-200">
                <div>
                    <h3 className="font-semibold text-sm">{t("Meeting Chat")}</h3>
                    <p className="text-xs opacity-60">{messages.length} {t("messages")}</p>
                </div>
                <button
                    onClick={onClose}
                    className="btn btn-ghost btn-sm btn-circle sm:hidden"
                    aria-label="Close chat"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-sm opacity-50 py-8">
                        {t("No messages yet. Start the conversation!")}
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.userId === userId;
                        return (
                            <div
                                key={msg._id || index}
                                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                            >
                                {/* Sender name (only for others) */}
                                {!isOwn && (
                                    <span className="text-xs font-medium text-primary mb-1 px-1">
                                        {msg.userName}
                                    </span>
                                )}

                                {/* Message bubble */}
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${isOwn
                                        ? "bg-primary text-primary-content rounded-br-md"
                                        : "bg-base-200 text-base-content rounded-bl-md"
                                        }`}
                                >
                                    <p className="text-sm break-words">{getDisplayText(msg)}</p>
                                </div>

                                {/* Timestamp */}
                                <span className="text-xs opacity-40 mt-1 px-1">
                                    {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-base-300 bg-base-100">
                <div className="flex items-center gap-2">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t("Type your message...")}
                        className="textarea textarea-bordered flex-1 resize-none text-sm min-h-[44px] max-h-[120px]"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="btn btn-primary btn-circle"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
