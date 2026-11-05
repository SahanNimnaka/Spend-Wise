import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

export const TEST_SCHEMA = "spendwise_test";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function withSchema(databaseUrl: string, schema: string): string {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  url.searchParams.set("schema", schema);
  return url.toString();
}

function isIsolatedTestDatabase(databaseUrl: string): boolean {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    return false;
  }

  const schema = url.searchParams.get("schema") ?? "public";
  const databaseName = url.pathname.replace(/^\//, "");

  return schema === TEST_SCHEMA || /test/i.test(databaseName);
}

export function assertIsolatedTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(
      "DATABASE_URL is required. Copy backend/.env.example to backend/.env first.",
    );
  }

  if (!isIsolatedTestDatabase(databaseUrl)) {
    throw new Error(
      "Refusing to run tests against the development database. " +
        `Use the "${TEST_SCHEMA}" schema or a database whose name contains "test".`,
    );
  }
}

export function loadTestEnv(): void {
  const testEnvPath = path.join(backendRoot, ".env.test");
  const hasTestEnv = existsSync(testEnvPath);

  dotenv.config({
    path: hasTestEnv ? testEnvPath : path.join(backendRoot, ".env"),
    override: hasTestEnv,
  });

  process.env.NODE_ENV = "test";

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(
      "DATABASE_URL is required. Copy backend/.env.example to backend/.env first.",
    );
  }

  if (!hasTestEnv) {
    process.env.DATABASE_URL = withSchema(databaseUrl, TEST_SCHEMA);
  }

  assertIsolatedTestDatabase();
}
