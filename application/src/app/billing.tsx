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
import { BottomTabInset, DS, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { usePasses } from "@/hooks/useBilling";

type TabKey = "transactions" | "mandate" | "rib";

export default function BillingScreen() {
  const { isDesktop, hPad } = usePageLayout();
  const { user } = useAuth();
  const accountId = user?.id ?? null;
  const { data: passes, loading, error } = usePasses(accountId);

  const [selectedPassId, setSelectedPassId] = useState<number | null>(null);
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

  const sectionPad = { paddingHorizontal: hPad };

  if (accountId === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={DS.actionPrimary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: BottomTabInset + DS.space8 },
      ]}
    >
      <SafeAreaView edges={Platform.OS === "web" ? [] : ["top"]}>
        <View style={isDesktop && pageInner}>
          <View style={[styles.header, sectionPad]}>
            <Text style={styles.title} accessibilityRole="header">
              Facturation
            </Text>
            <Text style={styles.subtitle}>
              Retrouvez les prélèvements, mandats et coordonnées bancaires de
              vos passes.
            </Text>
          </View>

          <View style={[styles.block, sectionPad]}>
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
            <View style={[styles.block, sectionPad]}>
              <View style={styles.modeBadge}>
                <Text style={styles.modeText}>{paymentModeLabel}</Text>
              </View>
            </View>
          )}

          {tabs.length > 1 && (
            <View style={[styles.block, sectionPad]}>
              <SegmentedTabs
                segments={tabs}
                active={activeTab}
                onChange={(k) => setActiveTab(k as TabKey)}
              />
            </View>
          )}

          <View style={[styles.block, sectionPad]}>
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
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: DS.surfacePage },
  content: { flexGrow: 1 },
  header: {
    paddingTop: DS.space6,
    paddingBottom: DS.space4,
    gap: DS.space2,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: DS.textStrong,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    color: DS.textBody,
    lineHeight: 24,
    maxWidth: 520,
  },
  block: { paddingVertical: DS.space3 },
  center: { paddingVertical: DS.space6, alignItems: "center" },
  errorTitle: { fontSize: 15, fontWeight: "700", color: DS.dangerText },
  errorBody: { fontSize: 13, color: DS.textMuted, marginTop: 4 },
  modeBadge: {
    backgroundColor: DS.surfaceTint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  modeText: {
    fontSize: 13,
    fontWeight: "700",
    color: DS.actionPrimary,
  },
});