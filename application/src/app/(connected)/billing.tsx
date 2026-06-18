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

type TabKey = "transactions" | "mandate" | "rib";

const TABS = [
  { key: "transactions", label: "Historique" },
  { key: "mandate", label: "Mandat SEPA" },
  { key: "rib", label: "RIB" },
];

export default function BillingScreen() {
  const { isDesktop, hPad } = usePageLayout();
  const { user } = useAuth();
  const accountId = user?.id ?? null;
  const { data: passes, loading, error } = usePasses(accountId);

  const [selectedPassId, setSelectedPassId] = useState<number | null>(
    passes?.length === 1 ? passes[0].subscriptionId : null,
  );
  const [activeTab, setActiveTab] = useState<TabKey>("transactions");

  if (accountId === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={DS.actionPrimary} />
      </View>
    );
  }

  return (
    <>
      <View style={[styles.header]}>
        <Text style={styles.title} accessibilityRole="header">
          Facturation
        </Text>
        <Text style={styles.subtitle}>
          Retrouvez les prélèvements, mandats et coordonnées bancaires de vos
          passes.
        </Text>
      </View>

      <View>
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
        {passes && (
          <PassSelector
            passes={passes}
            selectedId={selectedPassId}
            onSelect={setSelectedPassId}
          />
        )}
      </View>

      <View>
        <SegmentedTabs
          segments={TABS}
          active={activeTab}
          onChange={(k) => setActiveTab(k as TabKey)}
        />
      </View>

      <View>
        {activeTab === "transactions" && (
          <TransactionsTab
            accountId={accountId}
            subscriptionId={selectedPassId}
          />
        )}
        {activeTab === "mandate" && (
          <MandateTab
            accountId={accountId}
            subscriptionId={selectedPassId}
            onGoToRib={() => setActiveTab("rib")}
          />
        )}
        {activeTab === "rib" && (
          <RibTab accountId={accountId} subscriptionId={selectedPassId} />
        )}
      </View>
    </>
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
