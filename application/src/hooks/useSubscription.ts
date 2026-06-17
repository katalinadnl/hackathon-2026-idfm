import { useCallback, useEffect, useState } from "react";

import type { Subscription } from "@/types/subscription";
import { ApiError, AsyncState, http } from "@/services/api";

export function useSubscription(
  id: string | number | undefined,
): AsyncState<Subscription | null> {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await http.get<Subscription>(`/subscriptions/${id}`);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubscription();
  }, [fetchSubscription]);

  return { data: subscription, loading, error, reload: fetchSubscription };
}
