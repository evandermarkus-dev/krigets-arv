export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Override system env vars with .env.local values (for local dev)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs") as typeof import("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path") as typeof import("path");
      const envLocalPath = path.resolve(process.cwd(), ".env.local");
      const content = fs.readFileSync(envLocalPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        process.env[key] = value;
      }
    } catch {
      // .env.local saknas i produktion — det är OK
    }
  }
}
