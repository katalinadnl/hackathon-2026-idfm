import { useCallback, useEffect, useState } from 'react';

import {
  billingApi,
  MandateResponse,
  PassSummary,
  PaymentMethodResponse,
  TransactionsResponse,
} from '@/lib/api';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

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

export function useMandate(
  accountId: number,
  subscriptionId: number | null,
): AsyncState<MandateResponse> {
  const [data, setData] = useState<MandateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (subscriptionId === null) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    billingApi
      .getMandate(accountId, subscriptionId)
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

export function usePaymentMethod(
  accountId: number,
  subscriptionId: number | null,
): AsyncState<PaymentMethodResponse> {
  const [data, setData] = useState<PaymentMethodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (subscriptionId === null) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    billingApi
      .getPaymentMethod(accountId, subscriptionId)
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
