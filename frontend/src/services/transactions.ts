import { apiRequest } from "../api/client";
import type {
  ApiSuccess,
  CreateTransactionPayload,
  Transaction,
  TransactionFilters,
  TransactionListResult,
  UpdateTransactionPayload,
} from "../types/api";

function buildQuery(filters: TransactionFilters): string {
  const query = new URLSearchParams();

  if (filters.type !== undefined) {
    query.set("type", filters.type);
  }

  if (filters.category !== undefined) {
    query.set("category", filters.category);
  }

  if (filters.search !== undefined) {
    query.set("search", filters.search);
  }

  if (filters.startDate !== undefined) {
    query.set("startDate", filters.startDate);
  }

  if (filters.endDate !== undefined) {
    query.set("endDate", filters.endDate);
  }

  if (filters.page !== undefined) {
    query.set("page", String(filters.page));
  }

  if (filters.limit !== undefined) {
    query.set("limit", String(filters.limit));
  }

  const value = query.toString();
  return value.length > 0 ? `?${value}` : "";
}

export async function listTransactions(
  filters: TransactionFilters = {},
  signal?: AbortSignal,
): Promise<TransactionListResult> {
  const response = await apiRequest<ApiSuccess<TransactionListResult>>(
    `/transactions${buildQuery(filters)}`,
    { signal },
  );

  return response.data;
}

export async function getTransaction(
  id: string,
  signal?: AbortSignal,
): Promise<Transaction> {
  const response = await apiRequest<ApiSuccess<Transaction>>(
    `/transactions/${encodeURIComponent(id)}`,
    { signal },
  );

  return response.data;
}

export async function createTransaction(
  payload: CreateTransactionPayload,
): Promise<Transaction> {
  const response = await apiRequest<ApiSuccess<Transaction>>(
    "/transactions",
    {
      method: "POST",
      body: payload,
    },
  );

  return response.data;
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
): Promise<Transaction> {
  const response = await apiRequest<ApiSuccess<Transaction>>(
    `/transactions/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: payload,
    },
  );

  return response.data;
}

export async function deleteTransaction(id: string): Promise<{ id: string }> {
  const response = await apiRequest<ApiSuccess<{ id: string }>>(
    `/transactions/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

  return response.data;
}
