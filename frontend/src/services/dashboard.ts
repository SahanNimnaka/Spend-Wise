import { apiRequest } from "../api/client";
import type {
  ApiSuccess,
  DashboardActivity,
  DashboardBudgetOverview,
  DashboardSummary,
  Period,
} from "../types/api";

function periodQuery(period: Period): string {
  const query = new URLSearchParams({
    month: String(period.month),
    year: String(period.year),
  });

  return query.toString();
}

export async function getDashboardSummary(
  period: Period,
  signal?: AbortSignal,
): Promise<DashboardSummary> {
  const response = await apiRequest<ApiSuccess<DashboardSummary>>(
    `/dashboard/summary?${periodQuery(period)}`,
    { signal },
  );

  return response.data;
}

export async function getDashboardActivity(
  period: Period,
  signal?: AbortSignal,
): Promise<DashboardActivity> {
  const response = await apiRequest<ApiSuccess<DashboardActivity>>(
    `/dashboard/activity?${periodQuery(period)}`,
    { signal },
  );

  return response.data;
}

export async function getDashboardBudgets(
  period: Period,
  signal?: AbortSignal,
): Promise<DashboardBudgetOverview> {
  const response = await apiRequest<ApiSuccess<DashboardBudgetOverview>>(
    `/dashboard/budgets?${periodQuery(period)}`,
    { signal },
  );

  return response.data;
}
