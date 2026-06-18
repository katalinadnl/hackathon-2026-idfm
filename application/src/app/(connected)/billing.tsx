import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MandateTab } from "@/components/billing/MandateTab";
import { PassSelector } from "@/components/billing/PassSelector";
import { RibTab } from "@/components/billing/RibTab";
import { SegmentedTabs } from "@/components/billing/SegmentedTabs";
import { TransactionsTab } from "@/components/billing/TransactionsTab";
import { Card } from "@/components/ui/Card";
import { pageInner, usePageLayout } from "@/hooks/use-page-layout";
import { DS } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { usePasses } from "@/hooks/useBilling";
import { Badge } from "@/components/ui/Badge";
type TabKey = "transactions" | "mandate" | "rib";

const TABS = [
  { key: "transactions", label: "Historique" },
  { key: "mandate", label: "Mandat SEPA" },
  { key: "rib", label: "RIB" },
];

export default function BillingScreen() {
  const { user } = useAuth();
  const accountId = user?.id ?? null;
  const { data: passes, loading, error } = usePasses(accountId);

  const [selectedPassId, setSelectedPassId] = useState<number | null>(
    passes?.length === 1 ? passes[0].subscriptionId : null,
  );
  const [activeTab, setActiveTab] = useState<TabKey>("transactions");
  const hasMultiplePasses = (passes?.length ?? 0) > 1;
  const effectivePassId =
    selectedPassId ?? (passes?.length === 1 ? passes[0].subscriptionId : null);

  const selectedPass = passes?.find(
    (p) => p.subscriptionId === effectivePassId,
  );
  const anySepa = passes?.some((p) => p.hasSepa) ?? false;
  const hasSepa = selectedPass ? selectedPass.hasSepa : anySepa;

  const tabs = [
    { key: "transactions", label: "Historique" },
    ...(hasSepa
      ? [
          { key: "mandate", label: "Mandat SEPA" },
          { key: "rib", label: "RIB" },
        ]
      : []),
  ];

  const paymentModeLabel = selectedPass
    ? selectedPass.paymentMode === "card_once"
      ? "Paiement CB en une fois"
      : selectedPass.paymentMode === "sepa_once"
        ? "Prélèvement SEPA annuel"
        : "Prélèvement SEPA mensuel"
    : null;

  if (accountId === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={DS.actionPrimary} />
      </View>
    );
  }

  return (
    <View>
      <View style={[styles.header]}>
        <Text style={styles.title} accessibilityRole="header">
          Facturation
        </Text>
        <Text style={styles.subtitle}>
          Retrouvez les prélèvements, mandats et coordonnées bancaires de vos
          passes.
        </Text>
      </View>

      <View style={[]}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={DS.actionPrimary} />
          </View>
        )}
        {error && (
          <Card>
            <Text style={styles.errorTitle}>
              Impossible de charger vos passes
            </Text>
            <Text style={styles.errorBody}>{error}</Text>
          </Card>
        )}
        {passes && hasMultiplePasses && (
          <PassSelector
            passes={passes}
            selectedId={effectivePassId}
            onSelect={setSelectedPassId}
          />
        )}
      </View>

      {paymentModeLabel && (
        <View style={[]}>
          <Badge tone="info">
            <Text>{paymentModeLabel}</Text>
          </Badge>
        </View>
      )}

      {tabs.length > 1 && (
        <View style={[]}>
          <SegmentedTabs
            segments={tabs}
            active={activeTab}
            onChange={(k) => setActiveTab(k as TabKey)}
          />
        </View>
      )}

      <View style={[]}>
        {activeTab === "transactions" && (
          <TransactionsTab
            accountId={accountId}
            subscriptionId={effectivePassId}
          />
        )}
        {activeTab === "mandate" && hasSepa && (
          <MandateTab
            accountId={accountId}
            subscriptionId={effectivePassId}
            onGoToRib={() => setActiveTab("rib")}
          />
        )}
        {activeTab === "rib" && hasSepa && (
          <RibTab accountId={accountId} subscriptionId={effectivePassId} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: DS.space1,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: DS.textStrong,
  },
  subtitle: { fontSize: 16, color: DS.textBody, lineHeight: 24, maxWidth: 520 },
  center: { alignItems: "center" },
  errorTitle: { fontSize: 15, fontWeight: "700", color: DS.dangerText },
  errorBody: { fontSize: 13, color: DS.textMuted, marginTop: 4 },
});
