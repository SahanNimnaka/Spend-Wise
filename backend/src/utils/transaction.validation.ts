import { AppError } from "./AppError.js";

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;

export type TransactionTypeValue = (typeof TRANSACTION_TYPES)[number];

export type CreateTransactionInput = {
  title: string;
  amount: string;
  type: TransactionTypeValue;
  category: string;
  date: Date;
  description: string | null;
};

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export type TransactionFilters = {
  type: TransactionTypeValue | undefined;
  category: string | undefined;
  startDate: Date | undefined;
  endDate: Date | undefined;
  search: string | undefined;
  page: number;
  limit: number;
};

const ALLOWED_FIELDS = new Set([
  "title",
  "amount",
  "type",
  "category",
  "date",
  "description",
]);

const AMOUNT_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const ZERO_AMOUNT_PATTERN = /^0(?:\.0{1,2})?$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
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

function parseTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw validationError("title", "Title must be a string.");
  }

  const title = value.trim();

  if (title.length === 0) {
    throw validationError("title", "Title must not be empty.");
  }

  if (title.length > 100) {
    throw validationError("title", "Title must be 100 characters or fewer.");
  }

  return title;
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

function parseAmount(value: unknown): string {
  let rawValue: string;

  if (typeof value === "string") {
    rawValue = value.trim();
  } else if (typeof value === "number" && Number.isFinite(value)) {
    rawValue = String(value);
  } else {
    throw validationError(
      "amount",
      "Amount must be a positive number with up to 2 decimal places.",
    );
  }

  if (!AMOUNT_PATTERN.test(rawValue)) {
    throw validationError(
      "amount",
      "Amount must be a positive number with up to 2 decimal places and cannot exceed 9,999,999,999.99.",
    );
  }

  if (ZERO_AMOUNT_PATTERN.test(rawValue)) {
    throw validationError("amount", "Amount must be greater than zero.");
  }

  const parts = rawValue.split(".");
  const whole = parts[0] ?? "0";
  const fraction = (parts[1] ?? "").padEnd(2, "0");

  return `${whole}.${fraction}`;
}

function parseType(value: unknown): TransactionTypeValue {
  if (typeof value !== "string") {
    throw validationError("type", "Type must be INCOME or EXPENSE.");
  }

  const type = value.trim().toUpperCase();

  if (!TRANSACTION_TYPES.includes(type as TransactionTypeValue)) {
    throw validationError("type", "Type must be INCOME or EXPENSE.");
  }

  return type as TransactionTypeValue;
}

function assertValidCalendarDate(raw: string, field: string): void {
  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(5, 7));
  const day = Number(raw.slice(8, 10));
  const check = new Date(Date.UTC(year, month - 1, day));

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw validationError(field, "Date must be a valid calendar date.");
  }
}

function parseDateValue(
  value: unknown,
  field: string,
  endOfDay = false,
): Date {
  if (typeof value !== "string") {
    throw validationError(field, "Date must be a string.");
  }

  const raw = value.trim();
  const isDateOnly = DATE_ONLY_PATTERN.test(raw);

  if (!isDateOnly && !DATE_TIME_PATTERN.test(raw)) {
    throw validationError(
      field,
      "Date must use YYYY-MM-DD or an ISO 8601 timestamp with a timezone.",
    );
  }

  assertValidCalendarDate(raw, field);

  if (isDateOnly) {
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(5, 7));
    const day = Number(raw.slice(8, 10));

    return new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 999 : 0,
      ),
    );
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    throw validationError(field, "Date must be a valid date.");
  }

  return parsed;
}

function parseDescription(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw validationError(
      "description",
      "Description must be a string or null.",
    );
  }

  const description = value.trim();

  if (description.length === 0) {
    return null;
  }

  if (description.length > 500) {
    throw validationError(
      "description",
      "Description must be 500 characters or fewer.",
    );
  }

  return description;
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

function parsePage(value: unknown): number {
  const raw = readQueryValue(value, "page");

  if (raw === undefined) {
    return 1;
  }

  if (!/^\d+$/.test(raw)) {
    throw validationError("page", "Page must be a positive integer.");
  }

  const page = Number(raw);

  if (!Number.isSafeInteger(page) || page < 1) {
    throw validationError("page", "Page must be a positive integer.");
  }

  return page;
}

function parseLimit(value: unknown): number {
  const raw = readQueryValue(value, "limit");

  if (raw === undefined) {
    return 50;
  }

  if (!/^\d+$/.test(raw)) {
    throw validationError("limit", "Limit must be an integer from 1 to 100.");
  }

  const limit = Number(raw);

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw validationError("limit", "Limit must be an integer from 1 to 100.");
  }

  return limit;
}

export function parseTransactionId(value: unknown): string {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    throw validationError(
      "id",
      "Transaction ID must contain only letters, numbers, underscores, or hyphens.",
    );
  }

  return value;
}

export function parseCreateTransaction(body: unknown): CreateTransactionInput {
  const data = parseBody(body);

  return {
    title: parseTitle(requireField(data, "title", "Title")),
    amount: parseAmount(requireField(data, "amount", "Amount")),
    type: parseType(requireField(data, "type", "Type")),
    category: parseCategory(requireField(data, "category", "Category")),
    date: parseDateValue(requireField(data, "date", "Date"), "date"),
    description: parseDescription(data.description),
  };
}

export function parseUpdateTransaction(body: unknown): UpdateTransactionInput {
  const data = parseBody(body);

  if (Object.keys(data).length === 0) {
    throw validationError("body", "At least one field must be provided.");
  }

  const updates: UpdateTransactionInput = {};

  if (Object.hasOwn(data, "title")) {
    updates.title = parseTitle(data.title);
  }

  if (Object.hasOwn(data, "amount")) {
    updates.amount = parseAmount(data.amount);
  }

  if (Object.hasOwn(data, "type")) {
    updates.type = parseType(data.type);
  }

  if (Object.hasOwn(data, "category")) {
    updates.category = parseCategory(data.category);
  }

  if (Object.hasOwn(data, "date")) {
    updates.date = parseDateValue(data.date, "date");
  }

  if (Object.hasOwn(data, "description")) {
    updates.description = parseDescription(data.description);
  }

  return updates;
}

export function parseTransactionFilters(
  query: Record<string, unknown>,
): TransactionFilters {
  const typeValue = readQueryValue(query.type, "type");
  const categoryValue = readQueryValue(query.category, "category");
  const searchValue = readQueryValue(query.search, "search");
  const startDateValue = readQueryValue(query.startDate, "startDate");
  const endDateValue = readQueryValue(query.endDate, "endDate");

  if (categoryValue !== undefined && categoryValue.length > 80) {
    throw validationError(
      "category",
      "Category filter must be 80 characters or fewer.",
    );
  }

  if (searchValue !== undefined && searchValue.length > 100) {
    throw validationError(
      "search",
      "Search query must be 100 characters or fewer.",
    );
  }

  const startDate =
    startDateValue === undefined
      ? undefined
      : parseDateValue(startDateValue, "startDate");

  const endDate =
    endDateValue === undefined
      ? undefined
      : parseDateValue(endDateValue, "endDate", true);

  if (
    startDate !== undefined &&
    endDate !== undefined &&
    startDate.getTime() > endDate.getTime()
  ) {
    throw validationError(
      "startDate",
      "startDate must be earlier than or equal to endDate.",
    );
  }

  return {
    type: typeValue === undefined ? undefined : parseType(typeValue),
    category: categoryValue,
    startDate,
    endDate,
    search: searchValue,
    page: parsePage(query.page),
    limit: parseLimit(query.limit),
  };
}
