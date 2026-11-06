/**
 * Vercel serverless entry point.
 *
 * Vercel invokes this exported Express application for requests matched by the
 * rewrite in backend/vercel.json. The long-running listener in src/server.ts is
 * intentionally not used on Vercel.
 */
import { app } from "../src/app.js";

export default app;
