import { Prisma } from "@prisma/client";
import type { Budget } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import type {
  BudgetFilters,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "../utils/budget.validation.js";

export type SerializedBudget = {
  id: string;
  category: string;
  limit: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
};

export type BudgetListResult = {
  items: SerializedBudget[];
  total: number;
};

function serializeBudget(budget: Budget): SerializedBudget {
  return {
    id: budget.id,
    category: budget.category,
    limit: budget.limit.toFixed(2),
    month: budget.month,
    year: budget.year,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

function budgetNotFoundError(): AppError {
  return new AppError("Budget not found.", 404, "BUDGET_NOT_FOUND");
}

function duplicateBudgetError(): AppError {
  return new AppError(
    "A budget already exists for this category, month, and year.",
    409,
    "BUDGET_ALREADY_EXISTS",
    [
      {
        field: "category",
        message:
          "A budget already exists for this category, month, and year.",
      },
    ],
  );
}

function isKnownError(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code
  );
}

async function assertNoDuplicateBudget(
  category: string,
  month: number,
  year: number,
  excludeId?: string,
): Promise<void> {
  const duplicate = await prisma.budget.findFirst({
    where: {
      category: {
        equals: category,
        mode: "insensitive",
      },
      month,
      year,
      ...(excludeId === undefined ? {} : { id: { not: excludeId } }),
    },
    select: { id: true },
  });

  if (duplicate !== null) {
    throw duplicateBudgetError();
  }
}

export async function listBudgets(
  filters: BudgetFilters,
): Promise<BudgetListResult> {
  const where: Prisma.BudgetWhereInput = {};

  if (filters.month !== undefined) {
    where.month = filters.month;
  }

  if (filters.year !== undefined) {
    where.year = filters.year;
  }

  const [budgets, total] = await prisma.$transaction([
    prisma.budget.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { category: "asc" }],
    }),
    prisma.budget.count({ where }),
  ]);

  return {
    items: budgets.map(serializeBudget),
    total,
  };
}

export async function getBudgetById(id: string): Promise<SerializedBudget> {
  const budget = await prisma.budget.findUnique({ where: { id } });

  if (budget === null) {
    throw budgetNotFoundError();
  }

  return serializeBudget(budget);
}

export async function createBudget(
  input: CreateBudgetInput,
): Promise<SerializedBudget> {
  await assertNoDuplicateBudget(input.category, input.month, input.year);

  try {
    const budget = await prisma.budget.create({
      data: {
        category: input.category,
        limit: input.limit,
        month: input.month,
        year: input.year,
      },
    });

    return serializeBudget(budget);
  } catch (error) {
    if (isKnownError(error, "P2002")) {
      throw duplicateBudgetError();
    }

    throw error;
  }
}

export async function updateBudget(
  id: string,
  input: UpdateBudgetInput,
): Promise<SerializedBudget> {
  const existing = await prisma.budget.findUnique({ where: { id } });

  if (existing === null) {
    throw budgetNotFoundError();
  }

  const nextCategory = input.category ?? existing.category;
  const nextMonth = input.month ?? existing.month;
  const nextYear = input.year ?? existing.year;

  if (
    input.category !== undefined ||
    input.month !== undefined ||
    input.year !== undefined
  ) {
    await assertNoDuplicateBudget(
      nextCategory,
      nextMonth,
      nextYear,
      id,
    );
  }

  const data: Prisma.BudgetUpdateInput = {};

  if (input.category !== undefined) {
    data.category = input.category;
  }

  if (input.limit !== undefined) {
    data.limit = input.limit;
  }

  if (input.month !== undefined) {
    data.month = input.month;
  }

  if (input.year !== undefined) {
    data.year = input.year;
  }

  try {
    const budget = await prisma.budget.update({
      where: { id },
      data,
    });

    return serializeBudget(budget);
  } catch (error) {
    if (isKnownError(error, "P2025")) {
      throw budgetNotFoundError();
    }

    if (isKnownError(error, "P2002")) {
      throw duplicateBudgetError();
    }

    throw error;
  }
}

export async function deleteBudget(id: string): Promise<{ id: string }> {
  try {
    await prisma.budget.delete({ where: { id } });
    return { id };
  } catch (error) {
    if (isKnownError(error, "P2025")) {
      throw budgetNotFoundError();
    }

    throw error;
  }
}
