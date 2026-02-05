import express from "express";
import Session from "../models/Session.js";
import { StreamClient } from "@stream-io/node-sdk";
import { v4 as uuidv4 } from "uuid";
const router = express.Router();

// Initialize Stream client
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;
let streamClient;

if (apiKey && apiSecret) {
    try {
        streamClient = new StreamClient(apiKey, apiSecret);
        console.log("✅ Stream.io client initialized");
    } catch (error) {
        console.error("❌ Failed to initialize Stream.io client:", error);
    }
}

// Create a new session
router.post("/", async (req, res) => {
    console.log("POST /api/sessions request received:", req.body);
    try {
        const { sessionName } = req.body;
        if (!sessionName) {
            console.error("Session name missing");
            return res.status(400).json({ message: "Session name is required" });
        }

        const callId = uuidv4();
        console.log("Generated callId:", callId);

        // Ensure stream client is initialized
        if (!streamClient) {
            console.error("Stream client not initialized");
            return res.status(500).json({ message: "Stream service unavailable" });
        }

        // Chat is now handled by Socket.IO, not Stream Chat
        const session = new Session({
            sessionName,
            callId,
            // Add initial empty participants if needed, though schema defaults usually handle it
            participants: []
        });

        await session.save();
        console.log("Session saved to DB:", session._id);

        res.status(201).json({ session });
    } catch (error) {
        console.error("Error creating session:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get active sessions
router.get("/active", async (req, res) => {
    try {
        const sessions = await Session.find({ status: "active" })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({ sessions });
    } catch (error) {
        console.error("❌ Error fetching active sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

// Get recent sessions (placeholder - just returns active for now)
router.get("/my-recent", async (req, res) => {
    try {
        const sessions = await Session.find({ status: "active" })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({ sessions });
    } catch (error) {
        console.error("❌ Error fetching recent sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

// Join a session (placeholder)
router.post("/:id/join", async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        res.json({ message: "Joined session", session });
    } catch (error) {
        console.error("❌ Error joining session:", error);
        res.status(500).json({ error: "Failed to join session" });
    }
});

// End a session
router.post("/:id/end", async (req, res) => {
    try {
        const session = await Session.findByIdAndUpdate(
            req.params.id,
            { status: "completed" },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        res.json({ message: "Session ended", session });
    } catch (error) {
        console.error("❌ Error ending session:", error);
        res.status(500).json({ error: "Failed to end session" });
    }
});

// Get session by ID
router.get("/:id", async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        res.json({ session });
    } catch (error) {
        console.error("❌ Error fetching session:", error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
});

// Get Stream.io token for video calls
router.post("/stream-token", async (req, res) => {
    try {
        const { userId, userName } = req.body;

        if (!userId || !userName) {
            return res.status(400).json({ error: "userId and userName are required" });
        }

        if (!streamClient) {
            return res.status(500).json({ error: "Stream.io is not configured" });
        }

        // Generate token for user (works for both video and chat)
        // The frontend's chatClient.connectUser() will automatically create/update the user
        const token = streamClient.generateUserToken({ user_id: userId });

        res.json({
            token,
            userId,
            userName,
            userImage: `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`,
        });
    } catch (error) {
        console.error("❌ Error generating Stream token:", error);
        res.status(500).json({ error: "Failed to generate token", details: error.message });
    }
});

export default router;
