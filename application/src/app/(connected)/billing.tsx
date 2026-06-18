import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { MandateTab } from "@/components/billing/MandateTab";
import { PassSelector } from "@/components/billing/PassSelector";
import { RibTab } from "@/components/billing/RibTab";
import { SegmentedTabs } from "@/components/billing/SegmentedTabs";
import { TransactionsTab } from "@/components/billing/TransactionsTab";
import { Card } from "@/components/ui/Card";
import { DS } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { usePasses } from "@/hooks/useBilling";
type TabKey = "transactions" | "mandate" | "rib";

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

  if (accountId === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={DS.actionPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Facturation
        </Text>
        <Text style={styles.subtitle}>
          Retrouvez les prélèvements, mandats et coordonnées bancaires de vos
          passes.
        </Text>
      </View>

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

      {tabs.length > 1 && (
        <SegmentedTabs
          segments={tabs}
          active={activeTab}
          onChange={(k) => setActiveTab(k as TabKey)}
        />
      )}

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
  );
}

const styles = StyleSheet.create({
  page: {
    gap: DS.space5,
  },
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
