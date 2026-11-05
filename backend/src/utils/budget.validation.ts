import { AppError } from "./AppError.js";
import { getCurrentPeriod } from "./period.js";
import type { MonthPeriod } from "./period.js";

export const MIN_BUDGET_YEAR = 2000;
export const MAX_BUDGET_YEAR = 2100;

export type CreateBudgetInput = {
  category: string;
  limit: string;
  month: number;
  year: number;
};

export type UpdateBudgetInput = Partial<CreateBudgetInput>;

export type BudgetFilters = {
  month: number | undefined;
  year: number | undefined;
};

const ALLOWED_FIELDS = new Set(["category", "limit", "month", "year"]);

const AMOUNT_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const ZERO_AMOUNT_PATTERN = /^0(?:\.0{1,2})?$/;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function validationError(field: string, message: string): AppError {
  return new AppError(message, 400, "VALIDATION_ERROR", [
    { field, message },
  ]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBody(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) {
    throw validationError("body", "Request body must be a JSON object.");
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw validationError(
        key,
        `Field "${key}" is not allowed. Allowed fields: ${[...ALLOWED_FIELDS].join(", ")}.`,
      );
    }
  }

  return body;
}

function requireField(
  body: Record<string, unknown>,
  field: string,
  label: string,
): unknown {
  if (!Object.hasOwn(body, field) || body[field] === undefined) {
    throw validationError(field, `${label} is required.`);
  }

  return body[field];
}

function parseCategory(value: unknown): string {
  if (typeof value !== "string") {
    throw validationError("category", "Category must be a string.");
  }

  const category = value.trim();

  if (category.length === 0) {
    throw validationError("category", "Category must not be empty.");
  }

  if (category.length > 80) {
    throw validationError(
      "category",
      "Category must be 80 characters or fewer.",
    );
  }

  return category;
}

function parseLimit(value: unknown): string {
  let rawValue: string;

  if (typeof value === "string") {
    rawValue = value.trim();
  } else if (typeof value === "number" && Number.isFinite(value)) {
    rawValue = String(value);
  } else {
    throw validationError(
      "limit",
      "Limit must be a positive number with up to 2 decimal places.",
    );
  }

  if (!AMOUNT_PATTERN.test(rawValue)) {
    throw validationError(
      "limit",
      "Limit must be a positive number with up to 2 decimal places and cannot exceed 9,999,999,999.99.",
    );
  }

  if (ZERO_AMOUNT_PATTERN.test(rawValue)) {
    throw validationError("limit", "Limit must be greater than zero.");
  }

  const parts = rawValue.split(".");
  const whole = parts[0] ?? "0";
  const fraction = (parts[1] ?? "").padEnd(2, "0");

  return `${whole}.${fraction}`;
}

function parseInteger(
  value: unknown,
  field: string,
  label: string,
  minimum: number,
  maximum: number,
): number {
  let parsed: number;

  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    parsed = Number(value.trim());
  } else {
    throw validationError(
      field,
      `${label} must be an integer between ${minimum} and ${maximum}.`,
    );
  }

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw validationError(
      field,
      `${label} must be an integer between ${minimum} and ${maximum}.`,
    );
  }

  return parsed;
}

function parseMonth(value: unknown): number {
  return parseInteger(value, "month", "Month", 1, 12);
}

function parseYear(value: unknown): number {
  return parseInteger(
    value,
    "year",
    "Year",
    MIN_BUDGET_YEAR,
    MAX_BUDGET_YEAR,
  );
}

function readQueryValue(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw validationError(
      field,
      `Query parameter "${field}" must be a single string value.`,
    );
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function parseBudgetId(value: unknown): string {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    throw validationError(
      "id",
      "Budget ID must contain only letters, numbers, underscores, or hyphens.",
    );
  }

  return value;
}

export function parseCreateBudget(body: unknown): CreateBudgetInput {
  const data = parseBody(body);

  return {
    category: parseCategory(requireField(data, "category", "Category")),
    limit: parseLimit(requireField(data, "limit", "Limit")),
    month: parseMonth(requireField(data, "month", "Month")),
    year: parseYear(requireField(data, "year", "Year")),
  };
}

export function parseUpdateBudget(body: unknown): UpdateBudgetInput {
  const data = parseBody(body);

  if (Object.keys(data).length === 0) {
    throw validationError("body", "At least one field must be provided.");
  }

  const updates: UpdateBudgetInput = {};

  if (Object.hasOwn(data, "category")) {
    updates.category = parseCategory(data.category);
  }

  if (Object.hasOwn(data, "limit")) {
    updates.limit = parseLimit(data.limit);
  }

  if (Object.hasOwn(data, "month")) {
    updates.month = parseMonth(data.month);
  }

  if (Object.hasOwn(data, "year")) {
    updates.year = parseYear(data.year);
  }

  return updates;
}

export function parseBudgetFilters(
  query: Record<string, unknown>,
): BudgetFilters {
  const monthValue = readQueryValue(query.month, "month");
  const yearValue = readQueryValue(query.year, "year");

  return {
    month: monthValue === undefined ? undefined : parseMonth(monthValue),
    year: yearValue === undefined ? undefined : parseYear(yearValue),
  };
}

export function parsePeriodQuery(
  query: Record<string, unknown>,
): MonthPeriod {
  const current = getCurrentPeriod();
  const monthValue = readQueryValue(query.month, "month");
  const yearValue = readQueryValue(query.year, "year");

  return {
    month:
      monthValue === undefined ? current.month : parseMonth(monthValue),
    year: yearValue === undefined ? current.year : parseYear(yearValue),
  };
}
