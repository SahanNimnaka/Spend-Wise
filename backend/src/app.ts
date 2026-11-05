import cors from "cors";
import type { CorsOptions } from "cors";
import express from "express";
import type { Request, Response } from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import { budgetRouter } from "./routes/budget.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { transactionRouter } from "./routes/transaction.routes.js";

const corsOptions: CorsOptions = {
  origin(requestOrigin, callback) {
    const allowed =
      requestOrigin === undefined || requestOrigin === env.frontendOrigin;

    callback(null, allowed);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb", strict: true }));

function healthHandler(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    },
  });
}

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

app.use("/api/transactions", transactionRouter);
app.use("/api/budgets", budgetRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);
