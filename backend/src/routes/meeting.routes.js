import express from "express";
import Meeting from "../models/Meeting.js";
import notesService from "../services/notes.service.js";
import emailService from "../services/email.service.js";

const router = express.Router();

// Get meeting notes
router.get("/:id/notes", async (req, res) => {
    try {
        const { id } = req.params;
        const { language } = req.query;

        if (!language) {
            return res.status(400).json({ ok: false, message: "Language parameter required" });
        }

        const note = await notesService.getNoteWithTranslation(id, language);

        if (!note) {
            return res.status(404).json({ ok: false, message: "Notes not found" });
        }

        return res.json({ ok: true, note });
    } catch (error) {
        console.error("Get notes error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
});

// Translate notes on demand
router.post("/:id/notes/translate", async (req, res) => {
    try {
        const { id } = req.params;
        const { targetLanguage } = req.body;

        if (!targetLanguage) {
            return res.status(400).json({ ok: false, message: "Target language required" });
        }

        const note = await notesService.getNoteWithTranslation(id, targetLanguage);

        if (!note) {
            return res.status(404).json({ ok: false, message: "Notes not found" });
        }

        return res.json({ ok: true, note });
    } catch (error) {
        console.error("Translation error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
});

// End meeting and send emails
router.post("/:id/end", async (req, res) => {
    try {
        const { id } = req.params;

        const meeting = await Meeting.findById(id);
        if (!meeting) {
            return res.status(404).json({ ok: false, message: "Meeting not found" });
        }

        meeting.status = "completed";
        meeting.endedAt = new Date();
        await meeting.save();

        // Send meeting minutes asynchronously
        emailService.sendMeetingMinutes(id).catch((err) => {
            console.error("Email sending error:", err);
        });

        return res.json({ ok: true, message: "Meeting ended successfully" });
    } catch (error) {
        console.error("End meeting error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
});

// Update meeting settings
router.patch("/:id/settings", async (req, res) => {
    try {
        const { id } = req.params;
        const { translationEnabled, captionsEnabled } = req.body;

        const meeting = await Meeting.findById(id);
        if (!meeting) {
            return res.status(404).json({ ok: false, message: "Meeting not found" });
        }

        if (translationEnabled !== undefined) {
            meeting.settings.translationEnabled = translationEnabled;
        }

        if (captionsEnabled !== undefined) {
            meeting.settings.captionsEnabled = captionsEnabled;
        }

        await meeting.save();

        return res.json({ ok: true, meeting });
    } catch (error) {
        console.error("Update settings error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
});

export default router;
