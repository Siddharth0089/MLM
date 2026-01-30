import mongoose from "mongoose";

const TestcaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true }
  },
  { _id: false }
);

const ProblemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
    title: { type: String, required: true },
    timeLimitMs: { type: Number, default: 2000 },

    // RUN button uses this
    samples: { type: [TestcaseSchema], default: [] },

    // SUBMIT button uses this (hidden)
    hiddens: { type: [TestcaseSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Testcase", ProblemSchema);

