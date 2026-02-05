import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sessionName: {
      type: String,
      required: false, // Made optional as controller expects problem/difficulty
    },
    problem: {
      type: String,
    },
    difficulty: {
      type: String,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId, // Singular, matching controller logic
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    // stream video call ID
    callId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
