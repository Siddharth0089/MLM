import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
    {
        meetingId: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting", required: true },
        canonicalLanguage: { type: String, default: "en-US" },
        contentHTML: { type: String, default: "" },
        contentPlainText: { type: String, default: "" },
        yjsState: { type: Buffer }, // Yjs document binary state for CRDT sync
        authorUserId: { type: String },
    },
    { timestamps: true }
);

const Note = mongoose.model("Note", NoteSchema);
export default Note;
