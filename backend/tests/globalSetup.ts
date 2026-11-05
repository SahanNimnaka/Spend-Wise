import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadTestEnv } from "./testEnv.js";

export default function globalSetup(): void {
  loadTestEnv();

  const backendRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const prismaCli = path.join(
    backendRoot,
    "node_modules",
    "prisma",
    "build",
    "index.js",
  );

  if (!existsSync(prismaCli)) {
    throw new Error(
      "Prisma CLI was not found. Run npm install in the backend directory.",
    );
  }

  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: backendRoot,
    env: process.env,
    stdio: "inherit",
  });
}
