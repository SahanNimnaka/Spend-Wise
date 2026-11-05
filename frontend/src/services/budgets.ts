import { apiRequest } from "../api/client";
import type {
  ApiSuccess,
  Budget,
  BudgetFilters,
  BudgetListResult,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "../types/api";

function buildQuery(filters: BudgetFilters): string {
  const query = new URLSearchParams();

  if (filters.month !== undefined) {
    query.set("month", String(filters.month));
  }

  if (filters.year !== undefined) {
    query.set("year", String(filters.year));
  }

  const value = query.toString();
  return value.length > 0 ? `?${value}` : "";
}

export async function listBudgets(
  filters: BudgetFilters = {},
  signal?: AbortSignal,
): Promise<BudgetListResult> {
  const response = await apiRequest<ApiSuccess<BudgetListResult>>(
    `/budgets${buildQuery(filters)}`,
    { signal },
  );

  return response.data;
}

export async function getBudget(
  id: string,
  signal?: AbortSignal,
): Promise<Budget> {
  const response = await apiRequest<ApiSuccess<Budget>>(
    `/budgets/${encodeURIComponent(id)}`,
    { signal },
  );

  return response.data;
}

export async function createBudget(
  payload: CreateBudgetPayload,
): Promise<Budget> {
  const response = await apiRequest<ApiSuccess<Budget>>("/budgets", {
    method: "POST",
    body: payload,
  });

  return response.data;
}

export async function updateBudget(
  id: string,
  payload: UpdateBudgetPayload,
): Promise<Budget> {
  const response = await apiRequest<ApiSuccess<Budget>>(
    `/budgets/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: payload,
    },
  );

  return response.data;
}

export async function deleteBudget(id: string): Promise<{ id: string }> {
  const response = await apiRequest<ApiSuccess<{ id: string }>>(
    `/budgets/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

  return response.data;
}
