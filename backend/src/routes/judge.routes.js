import express from "express";
import Problem from "../db/problem.model.js";
import Questions from "../db/problem.js";
import { runSubmission } from "../judge/runner.js";
import mongoose from "mongoose";

const router = express.Router();

// POST /api/run

router.get("/problem/:id", async (req, res) => {
  try {
    // const problem = await Questions.findById(req.params.id.slice(0,-1));
    const problem = await Questions.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ status: false, message: "Problem not found" });
    }

    return res.json({ status: true, problem });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});
router.get("/problems", async (req, res) => {
  try {
    const Problems = await Questions.find().lean();
    return res.json({ status: true, Problems });
  }
  catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});



router.post("/submit", async (req, res) => {
  try {
    const { code, language, problemId } = req.body;

    if (!code || !language || !problemId) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ ok: false, message: "Invalid problemId" });
    }

    // 1️⃣ problem metadata
    const problemMeta = await Questions.findById(problemId).lean();
    if (!problemMeta) {
      return res.status(404).json({ ok: false, message: "Problem not found" });
    }

    // 2️⃣ testcases
    const testcaseDoc = await Problem.findOne({ userId: problemId }).lean();
    if (!testcaseDoc) {
      return res.status(404).json({ ok: false, message: "Testcases not found" });
    }

    const result = await runSubmission({
      code,
      language,
      problem: {
        ...problemMeta,
        testcases: testcaseDoc.testcases
      }
    });

    return res.json({ ok: true, ...result });

  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
});
export default router;
