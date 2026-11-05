import { Prisma } from "@prisma/client";
import type { Transaction } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateTransactionInput,
  TransactionFilters,
  UpdateTransactionInput,
} from "../utils/transaction.validation.js";

export type SerializedTransaction = {
  id: string;
  title: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionListResult = {
  items: SerializedTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function serializeTransaction(
  transaction: Transaction,
): SerializedTransaction {
  return {
    id: transaction.id,
    title: transaction.title,
    amount: transaction.amount.toFixed(2),
    type: transaction.type,
    category: transaction.category,
    date: transaction.date.toISOString(),
    description: transaction.description,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

function buildWhere(filters: TransactionFilters): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};

  if (filters.type !== undefined) {
    where.type = filters.type;
  }

  if (filters.category !== undefined) {
    where.category = {
      equals: filters.category,
      mode: "insensitive",
    };
  }

  if (filters.startDate !== undefined || filters.endDate !== undefined) {
    const dateFilter: Prisma.DateTimeFilter = {};

    if (filters.startDate !== undefined) {
      dateFilter.gte = filters.startDate;
    }

    if (filters.endDate !== undefined) {
      dateFilter.lte = filters.endDate;
    }

    where.date = dateFilter;
  }

  if (filters.search !== undefined) {
    where.OR = [
      {
        title: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  return where;
}

function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export async function listTransactions(
  filters: TransactionFilters,
): Promise<TransactionListResult> {
  const where = buildWhere(filters);
  const skip = (filters.page - 1) * filters.limit;

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip,
      take: filters.limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items: transactions.map(serializeTransaction),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getTransactionById(
  id: string,
): Promise<SerializedTransaction> {
  const transaction = await prisma.transaction.findUnique({ where: { id } });

  if (transaction === null) {
    throw new AppError(
      "Transaction not found.",
      404,
      "TRANSACTION_NOT_FOUND",
    );
  }

  return serializeTransaction(transaction);
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<SerializedTransaction> {
  const transaction = await prisma.transaction.create({
    data: {
      title: input.title,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: input.date,
      description: input.description,
    },
  });

  return serializeTransaction(transaction);
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<SerializedTransaction> {
  const data: Prisma.TransactionUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.amount !== undefined) {
    data.amount = input.amount;
  }

  if (input.type !== undefined) {
    data.type = input.type;
  }

  if (input.category !== undefined) {
    data.category = input.category;
  }

  if (input.date !== undefined) {
    data.date = input.date;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data,
    });

    return serializeTransaction(transaction);
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new AppError(
        "Transaction not found.",
        404,
        "TRANSACTION_NOT_FOUND",
      );
    }

    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<{ id: string }> {
  try {
    await prisma.transaction.delete({ where: { id } });
    return { id };
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new AppError(
        "Transaction not found.",
        404,
        "TRANSACTION_NOT_FOUND",
      );
    }

    throw error;
  }
}
