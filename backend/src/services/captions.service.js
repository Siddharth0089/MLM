import Caption from "../models/Caption.js";
import Meeting from "../models/Meeting.js";
import lingoService from "./lingo.service.js";

class CaptionsService {
    /**
     * Process audio chunk and generate caption
     * Note: This is a placeholder - actual STT integration depends on lingo.dev's API
     * @param {Buffer} audioChunk - Audio data
     * @param {string} meetingId - Meeting ID
     * @param {string} speakerUserId - Speaker user ID
     * @param {string} sourceLanguage - Speaker's language
     */
    async processAudioChunk(audioChunk, meetingId, speakerUserId, sourceLanguage) {
        try {
            // TODO: Implement actual streaming STT with lingo.dev
            // This is a placeholder that would need to be replaced with real STT integration

            console.log(`Processing audio chunk for meeting ${meetingId}, speaker ${speakerUserId}`);

            // Placeholder: In real implementation, this would call Lingo STT API
            // const transcript = await lingoService.streamSTT(audioChunk, sourceLanguage);

            // For now, return null to indicate no implementation
            return null;
        } catch (error) {
            console.error("Error processing audio chunk:", error);
            return null;
        }
    }

    /**
     * Save caption and create translations for all participants
     * @param {string} meetingId - Meeting ID
     * @param {string} speakerUserId - Speaker user ID
     * @param {string} originalText - Caption text
     * @param {string} originalLanguage - Original language
     * @param {boolean} isFinal - Whether this is a final transcript
     */
    async saveCaptionWithTranslations(meetingId, speakerUserId, originalText, originalLanguage, isFinal = false) {
        try {
            const meeting = await Meeting.findById(meetingId).populate("participants.userId hostUserId");
            if (!meeting) {
                throw new Error("Meeting not found");
            }

            // Get unique target languages
            const targetLanguages = new Set();

            if (meeting.hostUserId?.preferredLanguage) {
                targetLanguages.add(meeting.hostUserId.preferredLanguage);
            }

            meeting.participants.forEach((p) => {
                if (p.userId?.preferredLanguage) {
                    targetLanguages.add(p.userId.preferredLanguage);
                }
            });

            // Remove source language
            targetLanguages.delete(originalLanguage);

            const targetLangArray = Array.from(targetLanguages);

            // Translate caption to all participant languages
            const translations = await lingoService.translateCaptionToMultiple(
                originalText,
                originalLanguage,
                targetLangArray
            );

            // Save caption with translations
            const caption = await Caption.create({
                meetingId,
                speakerUserId,
                originalLanguage,
                originalText,
                translations,
                isFinal,
            });

            return caption;
        } catch (error) {
            console.error("Error saving caption with translations:", error);
            throw error;
        }
    }

    /**
     * Get recent captions for a meeting
     * @param {string} meetingId - Meeting ID
     * @param {number} limit - Number of captions to retrieve
     */
    async getRecentCaptions(meetingId, limit = 20) {
        try {
            const captions = await Caption.find({ meetingId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate("speakerUserId", "name")
                .lean();

            return captions.reverse(); // Return in chronological order
        } catch (error) {
            console.error("Error getting recent captions:", error);
            throw error;
        }
    }
}

export default new CaptionsService();
