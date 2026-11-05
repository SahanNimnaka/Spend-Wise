import { Prisma } from "@prisma/client";
import type { Budget } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import {
  formatDateOnly,
  getDaysInMonth,
  getMonthRange,
} from "../utils/period.js";
import type { MonthPeriod } from "../utils/period.js";

export type DashboardSummary = {
  period: MonthPeriod;
  totalBalance: string;
  totalIncome: string;
  totalExpenses: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  monthlyBalance: string;
  budgetLimit: string;
  budgetSpent: string;
  budgetRemaining: string;
  budgetUsagePercentage: number;
  budgetExceeded: boolean;
  overspentAmount: string;
  hasBudget: boolean;
};

export type BudgetOverviewCategory = {
  category: string;
  limit: string | null;
  spent: string;
  remaining: string | null;
  usagePercentage: number | null;
  hasBudget: boolean;
  exceeded: boolean;
  overspentAmount: string;
};

export type DashboardBudgetOverview = {
  period: MonthPeriod;
  totals: {
    budgetLimit: string;
    spent: string;
    remaining: string;
    usagePercentage: number;
    budgetExceeded: boolean;
    overspentAmount: string;
    hasBudget: boolean;
  };
  categories: BudgetOverviewCategory[];
};

export type DashboardActivityPoint = {
  day: string;
  date: string;
  income: number;
  expenses: number;
};

export type DashboardActivity = {
  period: MonthPeriod;
  daysInMonth: number;
  transactionCount: number;
  hasActivity: boolean;
  totalIncome: string;
  totalExpenses: string;
  data: DashboardActivityPoint[];
};

type CategoryTotals = {
  category: string;
  budget: Budget | null;
  spent: Prisma.Decimal;
};

function decimalOrZero(
  value: Prisma.Decimal | null | undefined,
): Prisma.Decimal {
  return value ?? new Prisma.Decimal(0);
}

function money(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

function nonNegative(value: Prisma.Decimal): Prisma.Decimal {
  return value.greaterThan(0) ? value : new Prisma.Decimal(0);
}

function usagePercentage(
  spent: Prisma.Decimal,
  limit: Prisma.Decimal,
): number {
  if (limit.lessThanOrEqualTo(0)) {
    return 0;
  }

  return spent
    .dividedBy(limit)
    .mul(100)
    .toDecimalPlaces(2)
    .toNumber();
}

function normalizeCategory(category: string): string {
  return category.trim().toLowerCase();
}

export async function getDashboardSummary(
  period: MonthPeriod,
): Promise<DashboardSummary> {
  const { start, endExclusive } = getMonthRange(period);

  const [
    totalIncomeAggregate,
    totalExpenseAggregate,
    monthlyIncomeAggregate,
    monthlyExpenseAggregate,
    budgetAggregate,
  ] = await prisma.$transaction([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "INCOME" },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE" },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "INCOME",
        date: { gte: start, lt: endExclusive },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: "EXPENSE",
        date: { gte: start, lt: endExclusive },
      },
    }),
    prisma.budget.aggregate({
      _sum: { limit: true },
      where: { month: period.month, year: period.year },
    }),
  ]);

  const totalIncome = decimalOrZero(totalIncomeAggregate._sum.amount);
  const totalExpenses = decimalOrZero(totalExpenseAggregate._sum.amount);
  const monthlyIncome = decimalOrZero(monthlyIncomeAggregate._sum.amount);
  const monthlyExpenses = decimalOrZero(monthlyExpenseAggregate._sum.amount);
  const budgetLimit = decimalOrZero(budgetAggregate._sum.limit);

  const hasBudget = budgetLimit.greaterThan(0);
  const budgetRemaining = hasBudget
    ? nonNegative(budgetLimit.minus(monthlyExpenses))
    : new Prisma.Decimal(0);
  const budgetExceeded =
    hasBudget && monthlyExpenses.greaterThan(budgetLimit);
  const overspentAmount = budgetExceeded
    ? monthlyExpenses.minus(budgetLimit)
    : new Prisma.Decimal(0);

  return {
    period,
    totalBalance: money(totalIncome.minus(totalExpenses)),
    totalIncome: money(totalIncome),
    totalExpenses: money(totalExpenses),
    monthlyIncome: money(monthlyIncome),
    monthlyExpenses: money(monthlyExpenses),
    monthlyBalance: money(monthlyIncome.minus(monthlyExpenses)),
    budgetLimit: money(budgetLimit),
    budgetSpent: money(monthlyExpenses),
    budgetRemaining: money(budgetRemaining),
    budgetUsagePercentage: hasBudget
      ? usagePercentage(monthlyExpenses, budgetLimit)
      : 0,
    budgetExceeded,
    overspentAmount: money(overspentAmount),
    hasBudget,
  };
}

export async function getDashboardBudgets(
  period: MonthPeriod,
): Promise<DashboardBudgetOverview> {
  const { start, endExclusive } = getMonthRange(period);

  const [budgets, spending] = await prisma.$transaction([
    prisma.budget.findMany({
      where: { month: period.month, year: period.year },
      orderBy: { category: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["category"],
      where: {
        type: "EXPENSE",
        date: { gte: start, lt: endExclusive },
      },
      _sum: { amount: true },
    }),
  ]);

  const categories = new Map<string, CategoryTotals>();

  for (const budget of budgets) {
    categories.set(normalizeCategory(budget.category), {
      category: budget.category,
      budget,
      spent: new Prisma.Decimal(0),
    });
  }

  for (const entry of spending) {
    const key = normalizeCategory(entry.category);
    const spent = decimalOrZero(entry._sum.amount);
    const existing = categories.get(key);

    if (existing === undefined) {
      categories.set(key, {
        category: entry.category,
        budget: null,
        spent,
      });
    } else {
      existing.spent = spent;
    }
  }

  const rows = [...categories.values()].sort((left, right) => {
    if (left.budget !== null && right.budget === null) {
      return -1;
    }

    if (left.budget === null && right.budget !== null) {
      return 1;
    }

    return left.category.localeCompare(right.category);
  });

  let totalLimit = new Prisma.Decimal(0);
  let totalSpent = new Prisma.Decimal(0);

  const serializedCategories = rows.map((row) => {
    totalSpent = totalSpent.plus(row.spent);

    if (row.budget === null) {
      return {
        category: row.category,
        limit: null,
        spent: money(row.spent),
        remaining: null,
        usagePercentage: null,
        hasBudget: false,
        exceeded: false,
        overspentAmount: "0.00",
      } satisfies BudgetOverviewCategory;
    }

    const limit = row.budget.limit;
    totalLimit = totalLimit.plus(limit);

    const exceeded = row.spent.greaterThan(limit);
    const remaining = nonNegative(limit.minus(row.spent));
    const overspent = exceeded
      ? row.spent.minus(limit)
      : new Prisma.Decimal(0);

    return {
      category: row.category,
      limit: money(limit),
      spent: money(row.spent),
      remaining: money(remaining),
      usagePercentage: usagePercentage(row.spent, limit),
      hasBudget: true,
      exceeded,
      overspentAmount: money(overspent),
    } satisfies BudgetOverviewCategory;
  });

  const hasBudget = totalLimit.greaterThan(0);
  const totalRemaining = hasBudget
    ? nonNegative(totalLimit.minus(totalSpent))
    : new Prisma.Decimal(0);
  const totalExceeded = hasBudget && totalSpent.greaterThan(totalLimit);
  const totalOverspent = totalExceeded
    ? totalSpent.minus(totalLimit)
    : new Prisma.Decimal(0);

  return {
    period,
    totals: {
      budgetLimit: money(totalLimit),
      spent: money(totalSpent),
      remaining: money(totalRemaining),
      usagePercentage: hasBudget
        ? usagePercentage(totalSpent, totalLimit)
        : 0,
      budgetExceeded: totalExceeded,
      overspentAmount: money(totalOverspent),
      hasBudget,
    },
    categories: serializedCategories,
  };
}

export async function getDashboardActivity(
  period: MonthPeriod,
): Promise<DashboardActivity> {
  const { start, endExclusive } = getMonthRange(period);
  const daysInMonth = getDaysInMonth(period);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: start, lt: endExclusive },
    },
    select: {
      type: true,
      amount: true,
      date: true,
    },
  });

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;

    return {
      day: String(day).padStart(2, "0"),
      date: formatDateOnly(period.year, period.month, day),
      income: new Prisma.Decimal(0),
      expenses: new Prisma.Decimal(0),
    };
  });

  let totalIncome = new Prisma.Decimal(0);
  let totalExpenses = new Prisma.Decimal(0);

  for (const transaction of transactions) {
    const day = days[transaction.date.getUTCDate() - 1];

    if (day === undefined) {
      continue;
    }

    if (transaction.type === "INCOME") {
      day.income = day.income.plus(transaction.amount);
      totalIncome = totalIncome.plus(transaction.amount);
    } else {
      day.expenses = day.expenses.plus(transaction.amount);
      totalExpenses = totalExpenses.plus(transaction.amount);
    }
  }

  return {
    period,
    daysInMonth,
    transactionCount: transactions.length,
    hasActivity: transactions.length > 0,
    totalIncome: money(totalIncome),
    totalExpenses: money(totalExpenses),
    data: days.map((day) => ({
      day: day.day,
      date: day.date,
      income: day.income.toNumber(),
      expenses: day.expenses.toNumber(),
    })),
  };
}
