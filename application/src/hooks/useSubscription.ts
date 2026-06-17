import { useCallback, useEffect, useState } from "react";

import type { Subscription } from "@/types/subscription";
import { api, ApiError } from "@/lib/api";

type UseSubscriptionResult = {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useSubscription(
  id: string | number | undefined,
): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.get<Subscription>(`/subscriptions/${id}`);
      setSubscription(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 404 ? "Abonnement introuvable" : err.message);
      } else {
        setError("Impossible de charger l'abonnement");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, loading, error, refetch: fetchSubscription };
}
