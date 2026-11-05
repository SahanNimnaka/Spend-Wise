import { useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage, isAbortError } from "../api/client";
import {
  getDashboardActivity,
  getDashboardBudgets,
  getDashboardSummary,
} from "../services/dashboard";
import type {
  DashboardActivity,
  DashboardBudgetOverview,
  DashboardSummary,
  Period,
} from "../types/api";

type DashboardState = {
  summary: DashboardSummary | null;
  overview: DashboardBudgetOverview | null;
  activity: DashboardActivity | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: DashboardState = {
  summary: null,
  overview: null,
  activity: null,
  isLoading: true,
  error: null,
};

export function useDashboardData(period: Period) {
  const [state, setState] = useState<DashboardState>(initialState);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const reload = useCallback(async (): Promise<void> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((previous) => ({
      ...previous,
      isLoading: true,
      error: null,
    }));

    const requestPeriod = { month: period.month, year: period.year };

    try {
      const [summary, overview, activity] = await Promise.all([
        getDashboardSummary(requestPeriod, controller.signal),
        getDashboardBudgets(requestPeriod, controller.signal),
        getDashboardActivity(requestPeriod, controller.signal),
      ]);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setState({
        summary,
        overview,
        activity,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (isAbortError(error) || requestId !== requestIdRef.current) {
        return;
      }

      setState((previous) => ({
        ...previous,
        isLoading: false,
        error: getApiErrorMessage(error),
      }));
    }
  }, [period.month, period.year]);

  useEffect(() => {
    // Data fetching on mount is the intended external synchronization here.
    // oxlint-disable-next-line react/set-state-in-effect
    void reload();

    return () => {
      controllerRef.current?.abort();
    };
  }, [reload]);

  return { ...state, reload };
}
