import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MandateTab } from "@/components/billing/MandateTab";
import { PassSelector } from "@/components/billing/PassSelector";
import { RibTab } from "@/components/billing/RibTab";
import { SegmentedTabs } from "@/components/billing/SegmentedTabs";
import { TransactionsTab } from "@/components/billing/TransactionsTab";
import { Card } from "@/components/ui/Card";
import { BottomTabInset, DS, MaxContentWidth } from "@/constants/theme";
import { usePasses } from "@/hooks/useBilling";
import { CURRENT_ACCOUNT_ID } from "@/lib/api/billing";

const DESKTOP_BP = 768;

type TabKey = "transactions" | "mandate" | "rib";

const TABS = [
  { key: "transactions", label: "Historique" },
  { key: "mandate", label: "Mandat SEPA" },
  { key: "rib", label: "RIB" },
];

export default function BillingScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;

  const accountId = CURRENT_ACCOUNT_ID;
  const { data: passes, loading, error } = usePasses(accountId);

  const [selectedPassId, setSelectedPassId] = useState<number | null>(
    passes?.length === 1 ? passes[0].subscriptionId : null,
  );
  const [activeTab, setActiveTab] = useState<TabKey>("transactions");

  const sectionPad = isDesktop
    ? { paddingHorizontal: DS.space8 }
    : { paddingHorizontal: DS.space5 };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: BottomTabInset + DS.space8 },
      ]}
    >
      <SafeAreaView edges={Platform.OS === "web" ? [] : ["top"]}>
        <View style={[isDesktop && styles.pageInner]}>
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
            {passes && (
              <PassSelector
                passes={passes}
                selectedId={selectedPassId}
                onSelect={setSelectedPassId}
              />
            )}
          </View>

          <View style={[styles.block, sectionPad]}>
            <SegmentedTabs
              segments={TABS}
              active={activeTab}
              onChange={(k) => setActiveTab(k as TabKey)}
            />
          </View>

          <View style={[styles.block, sectionPad]}>
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
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: DS.surfacePage },
  content: { flexGrow: 1 },
  pageInner: {
    maxWidth: MaxContentWidth,
    width: "100%",
    marginHorizontal: "auto" as any,
  },
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
  subtitle: { fontSize: 16, color: DS.textBody, lineHeight: 24, maxWidth: 520 },
  block: { paddingVertical: DS.space3 },
  center: { paddingVertical: DS.space6, alignItems: "center" },
  errorTitle: { fontSize: 15, fontWeight: "700", color: DS.dangerText },
  errorBody: { fontSize: 13, color: DS.textMuted, marginTop: 4 },
});
