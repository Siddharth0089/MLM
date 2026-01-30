import { spawn } from "child_process";

export function runProcess(command, args, options = {}) {
  const {
    cwd,
    stdin = "",
    timeoutMs = 2000,
    maxOutputBytes = 1024 * 1024
  } = options;

  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd });

    let stdout = "";
    let stderr = "";
    let killedByTimeout = false;
    let resolved = false;

    const safeResolve = (payload) => {
      if (resolved) return;
      resolved = true;
      resolve(payload);
    };

    const timer = setTimeout(() => {
      killedByTimeout = true;
      try {
        child.kill("SIGKILL");
      } catch {}
    }, timeoutMs);

    // ✅ IMPORTANT: Handle spawn errors (like g++ not installed)
    child.on("error", (err) => {
      clearTimeout(timer);
      safeResolve({
        code: -1,
        stdout: "",
        stderr: err.message || "Process spawn failed",
        killedByTimeout: false
      });
    });

    try {
      child.stdin.write(stdin);
      child.stdin.end();
    } catch (err) {
      clearTimeout(timer);
      safeResolve({
        code: -1,
        stdout: "",
        stderr: err.message || "Failed writing stdin",
        killedByTimeout: false
      });
      return;
    }

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (Buffer.byteLength(stdout, "utf8") > maxOutputBytes) {
        try {
          child.kill("SIGKILL");
        } catch {}
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (Buffer.byteLength(stderr, "utf8") > maxOutputBytes) {
        try {
          child.kill("SIGKILL");
        } catch {}
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      safeResolve({
        code,
        stdout,
        stderr,
        killedByTimeout
      });
    });
  });
}
