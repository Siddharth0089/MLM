import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { connectDB } from "./db/connect.js";
import { initializeSocketServer } from "./sockets/index.js";
import meetingRoutes from "./routes/meeting.routes.js";
import userRoutes from "./routes/user.routes.js";
import sessionRoutes from "./routes/session.routes.js";


const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocketServer(httpServer);

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://meetio.giftin.shop",
    "http://meetio.giftin.shop"
  ],
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use("/api/meetings", meetingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/", (_, res) => res.send("Multilingual Meeting Platform API ✅"));

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO server ready for connections`);
    });
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
