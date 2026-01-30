import mongoose from "mongoose";

// ✅ nested schema for description
const DescriptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    notes: [{ type: String }], // array of strings
  },
  { _id: false }
);

// ✅ nested schema for examples
const ExampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String }, // optional
  },
  { _id: false }
);

// ✅ nested schema for problem object
const ProblemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },

    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
    },

    category: { type: String, required: true },

    description: { type: DescriptionSchema, required: true },

    examples: { type: [ExampleSchema], default: [] },

    constraints: { type: [String], default: [] },
  },
  { _id: false }
);

// ✅ main schema (your document)
const LeetcodeQuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // top-level title

    id: { type: String, required: true, unique: true }, // "two-sum"
    originalKey: { type: String, required: true }, // "two-sum"

    problem: { type: ProblemSchema, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Problem", LeetcodeQuestionSchema);

