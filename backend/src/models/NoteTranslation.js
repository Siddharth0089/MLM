import mongoose from "mongoose";

const NoteTranslationSchema = new mongoose.Schema(
    {
        noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
        targetLanguage: { type: String, required: true },
        translatedHTML: { type: String, default: "" },
        translatedPlainText: { type: String, default: "" },
    },
    { timestamps: true }
);

// Index for fast lookups
NoteTranslationSchema.index({ noteId: 1, targetLanguage: 1 }, { unique: true });

const NoteTranslation = mongoose.model("NoteTranslation", NoteTranslationSchema);
export default NoteTranslation;
