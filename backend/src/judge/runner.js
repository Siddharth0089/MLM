import fs from "fs";
import path from "path";
import { LANG } from "./languages.js";
import { makeTempDir, cleanupDir } from "./temp.js";
import { runProcess } from "./sandbox.js";
import { sameOutput } from "./compare.js";

export async function runSubmission({ code, language, problem }) {
  const lang = LANG[language];
  if (!lang) throw new Error("Unsupported language");

  const { testcases, timeLimitMs } = problem;

  if (!testcases || testcases.length === 0) {
    throw new Error("No testcases found for this problem");
  }

  const dir = makeTempDir();

  try {
    // write code file
    fs.writeFileSync(path.join(dir, lang.file), code);

    // COMPILE ONCE
    if (lang.compile) {
      const compileResult = await runProcess(
        getCmd(lang.compile).cmd,
        getCmd(lang.compile).args,
        { cwd: dir, timeoutMs: 12000 }
      );

      if (compileResult.code !== 0) {
        return {
          verdict: "CE",
          message: "Compilation Error",
          // Compilation error is safe to return (no hidden testcase leak)
          error: compileResult.stderr || compileResult.stdout
        };
      }
    }

    // RUN ON ALL TESTCASES (Hidden)
    let passed = 0;

    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];

      const runResult = await runProcess(
        getCmd(lang.run).cmd,
        getCmd(lang.run).args,
        {
          cwd: dir,
          stdin: tc.input,
          timeoutMs: timeLimitMs || 2000
        }
      );

      // TLE
      if (runResult.killedByTimeout) {
        return {
          verdict: "TLE",
          message: "Time Limit Exceeded",
          passed,
          total: testcases.length
        };
      }

      // RE
      if (runResult.code !== 0) {
        return {
          verdict: "RE",
          success: false,
          message: "Runtime Error",
          passed,
          total: testcases.length
        };
      }

      const got = runResult.stdout;

      // WA
      if (!sameOutput(got, tc.output)) {
        return {
          verdict: "WA",
          success: false,
          message: "Wrong Answer",
          passed,
          total: testcases.length
        };
      }

      passed++;
    }

    // AC
    return {
      verdict: "AC",
      success: true,
      message: "Accepted",
      passed: testcases.length,
      total: testcases.length
    };
  } finally {
    cleanupDir(dir);
  }
}

function getCmd(str) {
  // supports commands like "g++ main.cpp -o main"
  const parts = str.split(" ");
  return { cmd: parts[0], args: parts.slice(1) };
}
