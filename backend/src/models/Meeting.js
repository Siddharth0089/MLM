import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        hostUserId: { type: String, required: true },
        participants: [
            {
                userId: { type: String },
                joinedAt: { type: Date, default: Date.now },
            },
        ],
        status: { type: String, enum: ["active", "completed"], default: "active" },
        settings: {
            translationEnabled: { type: Boolean, default: true },
            captionsEnabled: { type: Boolean, default: true },
        },
        streamCallId: String,
        streamChannelId: String,
        createdAt: { type: Date, default: Date.now },
        endedAt: Date,
    },
    { timestamps: true }
);

const Meeting = mongoose.model("Meeting", MeetingSchema);
export default Meeting;
