import { useCallback, useEffect, useState } from 'react';

import {
  billingApi,
  PassSummary,
  TransactionsResponse,
} from '@/lib/api';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Passes the account can bill — feeds the pass selector. */
export function usePasses(accountId: number): AsyncState<PassSummary[]> {
  const [data, setData] = useState<PassSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    billingApi
      .getPasses(accountId)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  useEffect(() => load(), [load]);
  return { data, loading, error, reload: load };
}

/**
 * Transaction history. `subscriptionId === null` → global view (all passes).
 */
export function useTransactions(
  accountId: number,
  subscriptionId: number | null,
): AsyncState<TransactionsResponse> {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    billingApi
      .getTransactions(accountId, subscriptionId ?? undefined)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [accountId, subscriptionId]);

  useEffect(() => load(), [load]);
  return { data, loading, error, reload: load };
}