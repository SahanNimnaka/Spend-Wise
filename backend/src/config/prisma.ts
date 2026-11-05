import { PrismaClient } from "@prisma/client";

import { env } from "./env.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
