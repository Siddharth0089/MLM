import { Server } from "socket.io";
import notesService from "../services/notes.service.js";
import captionsService from "../services/captions.service.js";
import emailService from "../services/email.service.js";
import Session from "../models/Session.js";
import lingoService from "../services/lingo.service.js";
import ChatMessage from "../models/ChatMessage.js";

let io;
// In-memory map to track participant languages per meeting
// Structure: { meetingId: { socketId: { userId, language } } }
const meetingParticipants = new Map();

export function initializeSocketServer(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // Meeting join event
        socket.on("meeting:join", async (data) => {
            const { meetingId, userId, displayName, preferredLanguage } = data;

            socket.join(meetingId);
            console.log(`User ${displayName} (${userId}) joined meeting ${meetingId} [Lang: ${preferredLanguage}]`);

            // Store participant's socket and language in memory
            if (!meetingParticipants.has(meetingId)) {
                meetingParticipants.set(meetingId, new Map());
            }
            meetingParticipants.get(meetingId).set(socket.id, { userId, language: preferredLanguage });

            // Notify other participants
            socket.to(meetingId).emit("participant:joined", {
                userId,
                displayName,
                language: preferredLanguage,
            });
        });

        // Note update event
        socket.on("note:update", async (data) => {
            const { meetingId, plainText, html, canonicalLanguage, yjsUpdate } = data;

            try {
                // Save note
                await notesService.saveNote(
                    meetingId,
                    plainText,
                    html,
                    canonicalLanguage,
                    yjsUpdate
                );

                // Broadcast Yjs update to other clients for CRDT sync
                socket.to(meetingId).emit("note:yjs-update", { yjsUpdate });

                // CRITICAL: Always broadcast the original text first!
                // This ensures basic syncing works even if translation service fails.
                io.to(meetingId).emit("note:translated", {
                    language: canonicalLanguage,
                    text: plainText,
                    html: html || plainText,
                });

                // Get unique target languages from IN-MEMORY participant list
                const participantsInMeeting = meetingParticipants.get(meetingId);
                if (participantsInMeeting && participantsInMeeting.size > 0) {
                    const targetLanguages = new Set();
                    for (const [, participant] of participantsInMeeting) {
                        if (participant.language && participant.language !== canonicalLanguage) {
                            targetLanguages.add(participant.language);
                        }
                    }

                    if (targetLanguages.size > 0) {
                        console.log(`Translating from ${canonicalLanguage} to: ${[...targetLanguages].join(', ')}`);
                        const translations = await lingoService.translateText(
                            plainText,
                            canonicalLanguage,
                            Array.from(targetLanguages)
                        );

                        // Broadcast translations to participants
                        for (const [language, translatedText] of Object.entries(translations)) {
                            io.to(meetingId).emit("note:translated", {
                                language,
                                text: translatedText,
                                html: translatedText,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Note update error:", error);
                socket.emit("note:error", { message: "Failed to update note" });
            }
        });

        // Yjs binary update for CRDT sync (more efficient than sending full content)
        socket.on("note:yjs-sync", (data) => {
            const { meetingId, update } = data;
            socket.to(meetingId).emit("note:yjs-update", { update });
        });

        // Note lock - when a user starts typing
        socket.on("note:lock", (data) => {
            const { meetingId, userId } = data;
            // Broadcast lock to other users in the meeting
            socket.to(meetingId).emit("note:locked", { userId });
        });

        // Note unlock - when a user stops typing
        socket.on("note:unlock", (data) => {
            const { meetingId, userId } = data;
            // Broadcast unlock to other users in the meeting
            socket.to(meetingId).emit("note:unlocked", { userId });
        });

        // Hand raise event
        socket.on("hand:raise", (data) => {
            const { meetingId, userId, userName } = data;
            console.log(`${userName} raised hand in meeting ${meetingId}`);
            // Broadcast to all participants in the meeting
            io.to(meetingId).emit("hand:raised", { userId, userName });
        });

        // Language update event - when user changes their preferred language
        socket.on("language:update", (data) => {
            const { meetingId, userId, language } = data;
            console.log(`User ${userId} updated language to ${language} in meeting ${meetingId}`);

            // Update the in-memory participant language
            const participantsInMeeting = meetingParticipants.get(meetingId);
            if (participantsInMeeting && participantsInMeeting.has(socket.id)) {
                participantsInMeeting.get(socket.id).language = language;
                console.log(`Updated language for socket ${socket.id} to ${language}`);
            }
        });

        // ==================== CHAT HANDLERS ====================

        // Chat: Send message with translation
        socket.on("chat:send", async (data) => {
            const { meetingId, userId, userName, text, language } = data;

            try {
                // Create message object with translations map
                const translations = new Map();
                translations.set(language, text); // Original text in sender's language

                // Get unique target languages from participants
                const participantsInMeeting = meetingParticipants.get(meetingId);
                const targetLanguages = new Set();

                if (participantsInMeeting && participantsInMeeting.size > 0) {
                    for (const [, participant] of participantsInMeeting) {
                        if (participant.language && participant.language !== language) {
                            targetLanguages.add(participant.language);
                        }
                    }
                }

                // Translate to other languages
                if (targetLanguages.size > 0) {
                    try {
                        const translatedTexts = await lingoService.translateText(
                            text,
                            language,
                            Array.from(targetLanguages)
                        );
                        for (const [lang, translatedText] of Object.entries(translatedTexts)) {
                            translations.set(lang, translatedText);
                        }
                    } catch (translateError) {
                        console.error("Chat translation error:", translateError);
                        // Continue without translations
                    }
                }

                // Save to database
                const chatMessage = new ChatMessage({
                    meetingId,
                    userId,
                    userName,
                    originalText: text,
                    originalLanguage: language,
                    translations,
                });
                await chatMessage.save();

                // Broadcast to all participants in meeting (including sender)
                io.to(meetingId).emit("chat:message", {
                    _id: chatMessage._id,
                    userId,
                    userName,
                    originalText: text,
                    originalLanguage: language,
                    translations: Object.fromEntries(translations),
                    createdAt: chatMessage.createdAt,
                });

                console.log(`Chat message sent by ${userName} in meeting ${meetingId}`);
            } catch (error) {
                console.error("Chat send error:", error);
                socket.emit("chat:error", { message: "Failed to send message" });
            }
        });

        // Chat: Get history when joining
        socket.on("chat:history", async (data) => {
            const { meetingId } = data;

            try {
                const messages = await ChatMessage.find({ meetingId })
                    .sort({ createdAt: 1 })
                    .limit(100)
                    .lean();

                // Convert Map objects to plain objects for transport
                const formattedMessages = messages.map((msg) => ({
                    ...msg,
                    translations: msg.translations instanceof Map
                        ? Object.fromEntries(msg.translations)
                        : msg.translations,
                }));

                socket.emit("chat:history", { messages: formattedMessages });
            } catch (error) {
                console.error("Chat history error:", error);
                socket.emit("chat:error", { message: "Failed to load chat history" });
            }
        });

        // ==================== END CHAT HANDLERS ====================

        // Audio chunk for live captions
        socket.on("audio:chunk", async (data) => {
            const { meetingId, speakerUserId, audioChunk, language } = data;

            // TODO: Process audio with STT and translate
            // For now, this is a placeholder
            console.log(`Received audio chunk from ${speakerUserId} in meeting ${meetingId}`);
        });

        // Caption event (if using client-side STT or sending pre-transcribed text)
        socket.on("caption:send", async (data) => {
            const { meetingId, speakerUserId, speakerName, text, language, isFinal } = data;

            try {
                // Get speaker name from socket auth if not provided
                const displayName = speakerName || socket.handshake.auth?.userName || "Participant";

                // Get target languages from in-memory participants (real-time data)
                const participantsInMeeting = meetingParticipants.get(meetingId);
                const targetLanguages = new Set();

                if (participantsInMeeting && participantsInMeeting.size > 0) {
                    for (const [, participant] of participantsInMeeting) {
                        if (participant.language && participant.language !== language) {
                            targetLanguages.add(participant.language);
                        }
                    }
                }

                // Translate to other participant languages
                let translations = [];
                if (targetLanguages.size > 0 && isFinal) {
                    try {
                        const translatedTexts = await lingoService.translateText(
                            text,
                            language,
                            Array.from(targetLanguages)
                        );
                        translations = Object.entries(translatedTexts).map(([lang, translatedText]) => ({
                            language: lang,
                            text: translatedText,
                        }));
                    } catch (translateError) {
                        console.error("Caption translation error:", translateError);
                        // Continue without translations
                    }
                }

                // Broadcast captions to all participants immediately
                io.to(meetingId).emit("caption:incoming", {
                    speakerUserId,
                    speakerName: displayName,
                    originalText: text,
                    originalLanguage: language,
                    translations,
                    isFinal,
                    timestamp: new Date(),
                });

                // Optionally save to database for history (only final captions)
                if (isFinal) {
                    try {
                        await captionsService.saveCaptionWithTranslations(
                            meetingId,
                            speakerUserId,
                            text,
                            language,
                            isFinal
                        );
                    } catch (saveError) {
                        console.error("Caption save error:", saveError);
                        // Don't block the broadcast if save fails
                    }
                }
            } catch (error) {
                console.error("Caption error:", error);
            }
        });

        // Meeting end event
        socket.on("meeting:end", async (data) => {
            const { meetingId } = data;

            try {
                const session = await Session.findById(meetingId);
                if (session) {
                    session.status = "completed";
                    // session.endedAt = new Date(); // Session model uses timestamps
                    await session.save();

                    // Send meeting minutes via email
                    try {
                        await emailService.sendMeetingMinutes(meetingId);
                    } catch (emailError) {
                        console.error("Error sending meeting minutes:", emailError);
                    }

                    // Notify all participants
                    io.to(meetingId).emit("meeting:ended", { meetingId });
                }
            } catch (error) {
                console.error("Meeting end error:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    return io;
}

export function getIO() {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
}
