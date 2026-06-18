import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { DS } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { ApiSubscription } from "@/hooks/use-subscriptions";
import { useFetch } from "@/hooks/useFetch";
import { LoadingPlaceholder, PassRow } from "../dashboard";

export default function SubscriptionsView() {
  const { user } = useAuth();

  const {
    data: subscriptions,
    loading,
    error,
  } = useFetch<ApiSubscription[]>(
    user ? `/accounts/${user.id}/subscriptions` : null,
  );
  if (!user || !subscriptions) return null;

  return (
    <>
      <View>
        <Text style={styles.viewTitle}>Vos abonnements</Text>
        <Text style={styles.viewSubtitle}>
          Gérez vos titres de transport actifs et renouvelés automatiquement.
        </Text>
      </View>
      <View>
        {loading ? (
          <LoadingPlaceholder />
        ) : subscriptions.length === 0 ? (
          <Text style={styles.emptyText}>Aucun abonnement trouvé.</Text>
        ) : (
          subscriptions.map((s, i) => (
            <View key={s.id}>
              <PassRow sub={s} />
              {i < subscriptions.length - 1 && <View style={styles.divider} />}
            </View>
          ))
        )}
      </View>

      <Button variant="secondary" size="md" leadingIcon="ticket">
        Ajouter un abonnement
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontSize: 14,
    color: DS.textMuted,
    padding: DS.space5,
  },

  divider: {
    height: 1,
    backgroundColor: DS.borderSubtle,
    marginHorizontal: DS.space5,
  },

  viewTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: DS.textStrong,
  },
  viewSubtitle: {
    fontSize: 15,
    color: DS.textMuted,
  },
});
