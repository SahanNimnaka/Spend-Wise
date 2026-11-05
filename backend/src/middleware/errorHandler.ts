import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import type { ValidationIssue } from "../utils/AppError.js";

function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ValidationIssue[],
): void {
  const error: {
    code: string;
    message: string;
    details?: ValidationIssue[];
  } = { code, message };

  if (details !== undefined) {
    error.details = details;
  }

  res.status(statusCode).json({
    success: false,
    error,
  });
}

function logServerError(
  req: Request,
  error: unknown,
  context: string,
): void {
  const summary = `[api-error] ${req.method} ${req.originalUrl} ${context}`;

  if (env.isProduction) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(summary, errorName);
    return;
  }

  console.error(summary, error);
}

function getHttpErrorType(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("type" in error)) {
    return undefined;
  }

  const type = (error as { type?: unknown }).type;
  return typeof type === "string" ? type : undefined;
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    404,
    "ROUTE_NOT_FOUND",
    `Route ${req.method} ${req.originalUrl} was not found.`,
  );
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logServerError(req, error, `raised ${error.code}`);
    }

    sendError(
      res,
      error.statusCode,
      error.code,
      error.message,
      error.details,
    );
    return;
  }

  const httpErrorType = getHttpErrorType(error);

  if (httpErrorType === "entity.parse.failed") {
    sendError(res, 400, "INVALID_JSON", "Request body contains invalid JSON.");
    return;
  }

  if (httpErrorType === "entity.too.large") {
    sendError(
      res,
      413,
      "PAYLOAD_TOO_LARGE",
      "Request body is too large.",
    );
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logServerError(req, error, `(Prisma ${error.code})`);

    switch (error.code) {
      case "P2025":
        sendError(res, 404, "NOT_FOUND", "Record not found.");
        return;
      case "P2002":
        sendError(
          res,
          409,
          "CONFLICT",
          "A record with these values already exists.",
        );
        return;
      case "P2003":
        sendError(
          res,
          409,
          "CONFLICT",
          "This record is referenced by other data.",
        );
        return;
      case "P2023":
        sendError(res, 400, "INVALID_ID", "Invalid record identifier.");
        return;
      default:
        sendError(
          res,
          500,
          "DATABASE_ERROR",
          "The database operation failed.",
        );
        return;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    logServerError(req, error, "(Prisma validation error)");
    sendError(
      res,
      500,
      "DATABASE_ERROR",
      "The database operation failed.",
    );
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    logServerError(req, error, "(database unavailable)");
    sendError(
      res,
      503,
      "DATABASE_UNAVAILABLE",
      "The database is currently unavailable.",
    );
    return;
  }

  logServerError(req, error, "failed unexpectedly");
  sendError(res, 500, "INTERNAL_ERROR", "Internal server error.");
}
