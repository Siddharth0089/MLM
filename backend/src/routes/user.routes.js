import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Update user language preference
router.patch("/language", async (req, res) => {
    try {
        const { userId, preferredLanguage } = req.body;

        if (!userId || !preferredLanguage) {
            return res.status(400).json({ ok: false, message: "Missing required fields" });
        }

        const user = await User.findOneAndUpdate(
            { clerkId: userId },
            { preferredLanguage },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        return res.json({ ok: true, user });
    } catch (error) {
        console.error("Update language error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
});

// Get user profile
router.get("/me", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ ok: false, message: "User ID required" });
        }

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        return res.json({ ok: true, user });
    } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
});

export default router;
