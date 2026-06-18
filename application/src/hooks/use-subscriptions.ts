import { useEffect, useState } from "react";

import { API_BASE_URL } from "@/services/api";
import { SubscriptionResponse } from "@/types/subscription";

const API_URL = API_BASE_URL;

export type SubscriptionRole = "titulaire" | "payeur" | "gestionnaire";

export type ApiSubscription = Pick<
  SubscriptionResponse,
  "id" | "subscriptionType" | "startDate" | "endDate" | "status" | "reference"
> & {
  roles: SubscriptionRole[];
  beneficiary: { id: number; firstName: string; lastName: string };
  latestPayment: { amount: number; paidAt: string; status: string } | null;
  transportProductId: number | null;
};

export function useSubscriptions(accountId: number | null) {
  const enabled = accountId !== null;

  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/accounts/${accountId}/subscriptions`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ApiSubscription[];
        if (!cancelled) setSubscriptions(data);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled, accountId]);

  return {
    subscriptions: enabled ? subscriptions : [],
    loading: enabled ? loading : false,
    error,
  };
}
