import type { Period } from "../types/api";

export function getCurrentPeriod(): Period {
  const now = new Date();

  return {
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
  };
}

export function formatPeriodLabel(period: Period): string {
  return new Intl.DateTimeFormat("en-LK", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(period.year, period.month - 1, 1)));
}

export function formatCurrency(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(amount)) {
    return "Rs. —";
  }

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("LKR", "Rs.");
}

const transactionDateFormatter = new Intl.DateTimeFormat("en-LK", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatTransactionDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return transactionDateFormatter.format(date);
}

export function normalizeAmountInput(value: string): string | null {
  const trimmed = value.trim();

  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const amount = Number(trimmed);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const [whole, fraction = ""] = trimmed.split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
}

export function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}
