import { useEffect, useState } from 'react';

import { API_BASE_URL } from '@/services/api';

const API_URL = API_BASE_URL;

export type SubscriptionRole = 'titulaire' | 'payeur' | 'gestionnaire';

export interface ApiSubscription {
  id: number;
  navigoNumber: string;
  subscriptionType: string;
  startDate: string;
  endDate: string;
  status: string;
  roles: SubscriptionRole[];
  beneficiary: { id: number; firstName: string; lastName: string };
  latestPayment: { amount: number; paidAt: string; status: string } | null;
}

export function useSubscriptions(accountId: number | null) {
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (accountId === null) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/accounts/${accountId}/subscriptions`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiSubscription[]>;
      })
      .then((data) => {
        setSubscriptions(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e);
        setLoading(false);
      });
  }, [accountId]);

  return { subscriptions, loading, error };
}