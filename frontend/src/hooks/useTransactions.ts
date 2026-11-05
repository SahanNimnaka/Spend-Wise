import { useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage, isAbortError } from "../api/client";
import { listTransactions } from "../services/transactions";
import type { Transaction } from "../types/api";
import { useDebouncedValue } from "./useDebouncedValue";

const TRANSACTION_LIMIT = 100;

export function useTransactions(search: string) {
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const reload = useCallback(async (): Promise<void> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listTransactions(
        {
          search: debouncedSearch.length > 0 ? debouncedSearch : undefined,
          page: 1,
          limit: TRANSACTION_LIMIT,
        },
        controller.signal,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      setItems(result.items);
      setTotal(result.pagination.total);
      setIsLoading(false);
    } catch (requestError) {
      if (isAbortError(requestError) || requestId !== requestIdRef.current) {
        return;
      }

      setError(getApiErrorMessage(requestError));
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    // Data fetching on mount is the intended external synchronization here.
    // oxlint-disable-next-line react/set-state-in-effect
    void reload();

    return () => {
      controllerRef.current?.abort();
    };
  }, [reload]);

  return { items, total, isLoading, error, reload };
}
