import type { Response } from "supertest";

import { prisma } from "../src/config/prisma.js";

export type ValidationIssue = {
  field: string;
  message: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationIssue[];
  };
};

export type TransactionPayload = {
  title: string;
  amount: string | number;
  type: string;
  category: string;
  date: string;
  description?: string | null;
};

export type BudgetPayload = {
  category: string;
  limit: string | number;
  month: number | string;
  year: number | string;
};

export function successData<T>(response: Response): T {
  return (response.body as ApiSuccess<T>).data;
}

export function errorData(response: Response): ApiFailure["error"] {
  return (response.body as ApiFailure).error;
}

export async function resetDatabase(): Promise<void> {
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
