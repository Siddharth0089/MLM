import fs from "fs";
import path from "path";
import os from "os";

export function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sub-"));
}

export function cleanupDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}
