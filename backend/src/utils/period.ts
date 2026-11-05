export type MonthPeriod = {
  month: number;
  year: number;
};

export function getCurrentPeriod(): MonthPeriod {
  const now = new Date();

  return {
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
  };
}

export function getMonthRange(period: MonthPeriod): {
  start: Date;
  endExclusive: Date;
} {
  return {
    start: new Date(Date.UTC(period.year, period.month - 1, 1)),
    endExclusive: new Date(Date.UTC(period.year, period.month, 1)),
  };
}

export function getDaysInMonth(period: MonthPeriod): number {
  return new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
}

export function formatDateOnly(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
