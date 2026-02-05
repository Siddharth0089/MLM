import Note from "../models/Note.js";
import NoteTranslation from "../models/NoteTranslation.js";
import Session from "../models/Session.js"; // Changed from Meeting
import lingoService from "./lingo.service.js";

class NotesService {
    /**
     * Save or update note for a meeting
     * ...
     */
    async saveNote(meetingId, content, contentHTML, canonicalLanguage, yjsState) {
        // ... (unchanged saveNote logic, verify if Note model uses meetingId string? Yes)
        try {
            let note = await Note.findOne({ meetingId });

            if (note) {
                note.contentPlainText = content;
                note.contentHTML = contentHTML;
                note.canonicalLanguage = canonicalLanguage;
                note.yjsState = yjsState;
                await note.save();
            } else {
                note = await Note.create({
                    meetingId,
                    contentPlainText: content,
                    contentHTML: contentHTML,
                    canonicalLanguage,
                    yjsState,
                });
            }

            return note;
        } catch (error) {
            console.error("Error saving note:", error);
            throw error;
        }
    }

    /**
     * Translate note to all participant languages
     * @param {string} meetingId - Meeting (Session) ID
     * @param {string} noteContent - Note content to translate
     * @param {string} sourceLanguage - Source language
     */
    async translateNoteForParticipants(meetingId, noteContent, sourceLanguage) {
        try {
            // Populate host and participant (singular) from Session
            const session = await Session.findById(meetingId).populate("host participant");
            if (!session) {
                throw new Error("Session not found (meetingId: " + meetingId + ")");
            }

            // Get unique target languages from all participants
            const targetLanguages = new Set();

            // Check Host Language
            if (session.host?.preferredLanguage) {
                targetLanguages.add(session.host.preferredLanguage);
            }

            // Check Participant Language (Singular)
            if (session.participant?.preferredLanguage) {
                targetLanguages.add(session.participant.preferredLanguage);
            }

            // Remove source language from targets
            targetLanguages.delete(sourceLanguage);

            if (targetLanguages.size === 0) {
                return {};
            }

            // Translate to all target languages
            const targetLangArray = Array.from(targetLanguages);
            const translations = await lingoService.translateText(
                noteContent,
                sourceLanguage,
                targetLangArray
            );

            // Save translations to database
            const note = await Note.findOne({ meetingId });
            if (!note) {
                console.error("Note not found for translation");
                return {};
            }

            for (const [targetLang, translatedText] of Object.entries(translations)) {
                await NoteTranslation.findOneAndUpdate(
                    { noteId: note._id, targetLanguage: targetLang },
                    {
                        translatedPlainText: translatedText,
                        translatedHTML: translatedText, // For now, use same as plain text
                    },
                    { upsert: true, new: true }
                );
            }

            return translations;
        } catch (error) {
            console.error("Error translating note:", error);
            throw error;
        }
    }

    /**
     * Get note with translation for specific language
     * @param {string} meetingId - Meeting ID
     * @param {string} targetLanguage - Target language
     */
    async getNoteWithTranslation(meetingId, targetLanguage) {
        try {
            const note = await Note.findOne({ meetingId });
            if (!note) {
                return null;
            }

            // If canonical language matches target, return original
            if (note.canonicalLanguage === targetLanguage) {
                return {
                    content: note.contentPlainText,
                    contentHTML: note.contentHTML,
                    language: note.canonicalLanguage,
                };
            }

            // Otherwise, get translation
            const translation = await NoteTranslation.findOne({
                noteId: note._id,
                targetLanguage,
            });

            if (translation) {
                return {
                    content: translation.translatedPlainText,
                    contentHTML: translation.translatedHTML,
                    language: targetLanguage,
                };
            }

            // If no translation exists, return original
            return {
                content: note.contentPlainText,
                contentHTML: note.contentHTML,
                language: note.canonicalLanguage,
            };
        } catch (error) {
            console.error("Error getting note with translation:", error);
            throw error;
        }
    }
}

export default new NotesService();
