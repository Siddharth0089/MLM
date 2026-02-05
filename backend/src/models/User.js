import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    clerkId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined to be unique
    },
    preferredLanguage: {
      type: String,
      default: "en-US",
    },
    settings: {
      autoTranslate: { type: Boolean, default: true },
      showCaptions: { type: Boolean, default: true },
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

const User = mongoose.model("User", userSchema);

export default User;
