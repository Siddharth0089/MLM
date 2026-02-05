import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        meetingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            required: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        originalText: {
            type: String,
            required: true,
        },
        originalLanguage: {
            type: String,
            default: "en",
        },
        // Map of language code -> translated text
        translations: {
            type: Map,
            of: String,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient query by meeting
chatMessageSchema.index({ meetingId: 1, createdAt: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
