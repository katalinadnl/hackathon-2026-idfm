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
    <View style={styles.sectionContent}>
      <Text style={styles.viewTitle}>Vos abonnements</Text>
      <Text style={styles.viewSubtitle}>
        Gérez vos titres de transport actifs et renouvelés automatiquement.
      </Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: DS.surfacePage,
  },
  pageContent: {
    flexGrow: 1,
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space6,
    paddingBottom: DS.space9,
  },

  layout: {
    flexDirection: "column",
    gap: DS.space4,
  },
  layoutDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DS.space6,
  },

  sidebar: {
    width: 228,
    flexShrink: 0,
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    padding: DS.space3,
    gap: 2,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: DS.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: DS.space3,
    paddingTop: DS.space2,
    paddingBottom: DS.space3,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    paddingHorizontal: DS.space3,
    paddingVertical: 11,
    borderRadius: DS.radiusSm,
  },
  navItemActive: {
    backgroundColor: DS.surfaceSelected,
  },
  navItemPressed: {
    backgroundColor: DS.grey200,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: DS.textStrong,
    flex: 1,
  },
  navLabelActive: {
    color: DS.actionPrimary,
    fontWeight: "600",
  },

  horizNav: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
  },
  horizNavContent: {
    paddingHorizontal: DS.space2,
    paddingVertical: DS.space2,
    gap: DS.space1,
    flexDirection: "row",
  },
  navItemHoriz: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: DS.space3,
    paddingVertical: DS.space2,
    gap: DS.space1,
    minWidth: 80,
  },
  navItemActiveHoriz: {
    backgroundColor: DS.surfaceSelected,
    borderRadius: DS.radiusSm,
  },
  navLabelHoriz: {
    fontSize: 12,
  },

  main: {
    flex: 1,
    gap: DS.space5,
  },
  mainDesktop: {
    gap: DS.space6,
  },

  greeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space4,
  },
  avatarBubble: {
    width: 52,
    height: 52,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: DS.white,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: "800",
    color: DS.textStrong,
    lineHeight: 32,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: DS.textMuted,
    marginTop: 2,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    backgroundColor: DS.warningTint,
    borderRadius: DS.radiusSm,
    padding: DS.space3,
  },
  errorText: {
    fontSize: 14,
    color: DS.warningText,
    flex: 1,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    padding: DS.space5,
  },
  loadingText: {
    fontSize: 14,
    color: DS.textMuted,
  },

  emptyText: {
    fontSize: 14,
    color: DS.textMuted,
    padding: DS.space5,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: DS.space2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: DS.textStrong,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: "600",
    color: DS.textLink,
  },

  sectionContent: {
    gap: DS.space4,
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
    marginTop: -DS.space2,
  },
});
