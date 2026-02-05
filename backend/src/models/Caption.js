import mongoose from "mongoose";

const CaptionSchema = new mongoose.Schema(
    {
        meetingId: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting", required: true },
        speakerUserId: { type: String, required: true },
        originalLanguage: { type: String, required: true },
        originalText: { type: String, required: true },
        translations: [
            {
                language: { type: String, required: true },
                text: { type: String, required: true },
            },
        ],
        startTime: Number,
        endTime: Number,
        isFinal: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Index for meeting-based caption retrieval
CaptionSchema.index({ meetingId: 1, createdAt: -1 });

const Caption = mongoose.model("Caption", CaptionSchema);
export default Caption;
