export function normalize(s) {
  return (s ?? "")
    .replace(/\r/g, "")
    .trimEnd()     // important: don't trim start, only end
    .replace(/[ \t]+/g, " ")
    .replace(/\n+$/g, "\n"); // keep one newline max
}

export function sameOutput(userOut, expectedOut) {
  return normalize(userOut) === normalize(expectedOut);
}
