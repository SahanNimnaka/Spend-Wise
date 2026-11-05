import "dotenv/config";

const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;

type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

function readNodeEnv(value: string | undefined): NodeEnvironment {
  const nodeEnv = value ?? "development";

  if (!NODE_ENVIRONMENTS.includes(nodeEnv as NodeEnvironment)) {
    throw new Error(
      `NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(", ")}.`,
    );
  }

  return nodeEnv as NodeEnvironment;
}

function readPort(value: string | undefined): number {
  if (value === undefined || value === "") {
    return 4000;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

function readFrontendOrigin(value: string | undefined): string {
  const rawOrigin = value?.trim() || "http://localhost:5173";

  let url: URL;

  try {
    url = new URL(rawOrigin);
  } catch {
    throw new Error("FRONTEND_ORIGIN must be a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("FRONTEND_ORIGIN must use http or https.");
  }

  return url.origin;
}

const nodeEnv = readNodeEnv(process.env.NODE_ENV);

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: readPort(process.env.PORT),
  frontendOrigin: readFrontendOrigin(process.env.FRONTEND_ORIGIN),
} as const;

