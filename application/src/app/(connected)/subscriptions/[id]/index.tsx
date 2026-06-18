import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InfoRow } from "@/components/subscription/InfoRow";
import { DeliveryBanner } from "@/components/subscription/DeliveryBanner";
import { DocumentCard } from "@/components/subscription/DocumentCard";
import { RenewalBanner } from "@/components/subscription/RenewalBanner";
import { SubscriptionHeader } from "@/components/subscription/SubscriptionHeader";
import { DS } from "@/constants/theme";
import { AccountsSection } from "@/components/subscription/AccountSection";
import { Section } from "@/components/ui/Section";
import { PaymentHistoryCta } from "@/components/subscription/PaiementHistory";
import { Icon } from "@/components/ui/Icon";
import { formatDate, getAge } from "@/lib/subscription-helpers";
import { useFetch } from "@/hooks/useFetch";
import { ReportLostOrStolenModal } from "@/components/subscription/CancelPass";
import { useState } from "react";
import { SubscriptionResponse } from "@/types/subscription";
import { CancelSubscriptionModal } from "@/components/subscription/CancelSubscriptionModal";
import { maskIbanDisplay } from "@/lib/bank-info-helpters";
import { ChangeBankInfoModal } from "@/components/subscription/ChangeBankInfoModal";

export default function SubscriptionDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [bankInfoModalVisible, setBankInfoModalVisible] = useState(false);
  const {
    data: subscription,
    loading,
    error,
    reload,
  } = useFetch<SubscriptionResponse>(id ? `/subscriptions/${id}` : null);

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={DS.actionPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !subscription) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <Icon name="alert-triangle" size={32} color={DS.danger} />
          <Text style={s.errorText}>{error ?? "Abonnement introuvable"}</Text>
          <Button variant="secondary" size="sm" onPress={reload}>
            Réessayer
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isOldEnough = getAge(subscription.beneficiary.birthDate) >= 16;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.wrapper}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SubscriptionHeader
            subscription={subscription}
            onBack={() => router.back()}
          />

          {!subscription.renewed && (
            <RenewalBanner
              endDate={subscription.endDate}
              onPress={() =>
                router.push(`/subscriptions/${subscription.id}/renew` as any)
              }
            />
          )}

          {subscription.passes.map(
            (pass) =>
              pass.delivery.status !== "delivered" && (
                <DeliveryBanner delivery={pass.delivery} key={pass.id} />
              ),
          )}

          {/* Abonnement + Titulaire côte à côte */}
          <View style={s.topGrid}>
            <Section title="Abonnement">
              <Card style={s.topGridCard}>
                <InfoRow
                  label="Numéro de pass"
                  value={subscription.passes[0].navigoNumber}
                />
                <InfoRow
                  label="Numéro client"
                  value={subscription.clientNumber}
                  last
                />
              </Card>
            </Section>
            <Section title="Titulaire">
              <Card style={s.topGridCard}>
                <InfoRow
                  label="Nom"
                  value={`${subscription.beneficiary.firstName} ${subscription.beneficiary.lastName}`}
                />
                <InfoRow
                  label="Département"
                  value={subscription.beneficiary.residenceDepartment.name}
                />
                <InfoRow
                  label="Naissance"
                  value={formatDate(subscription.beneficiary.birthDate)}
                  last
                />
              </Card>
            </Section>
          </View>

          <AccountsSection
            isOldEnough={isOldEnough}
            accountBeneficiary={subscription.beneficiary.account}
            referrer={subscription.referrer}
            subscriptionId={subscription.id}
            onReferrerChanged={() => reload()}
          />
          <Section title="Moyen de paiement">
            <Card style={s.bankInfoCard}>
              <View style={s.bankInfoRow}>
                <View style={s.bankInfoIcon}>
                  <Icon name="credit-card" size={18} color={DS.actionPrimary} />
                </View>
                <View style={s.bankInfoText}>
                  {subscription.bankInfo ? (
                    <>
                      <Text style={s.bankInfoLabel}>
                        {subscription.bankInfo.label ??
                          subscription.bankInfo.holderName}
                      </Text>
                      <Text style={s.bankInfoIban}>
                        {maskIbanDisplay(subscription.bankInfo.iban)}
                      </Text>
                    </>
                  ) : (
                    <Text style={s.bankInfoEmpty}>
                      Aucun moyen de paiement configuré
                    </Text>
                  )}
                </View>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setBankInfoModalVisible(true)}
                >
                  {subscription.bankInfo ? "Modifier" : "Ajouter"}
                </Button>
              </View>
            </Card>
          </Section>
          <Section title="Mes documents">
            {subscription.documents.length === 0 ? (
              <Card>
                <InfoRow label="Aucun document disponible" value="" last />
              </Card>
            ) : (
              <View style={s.docGrid}>
                {subscription.documents.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </View>
            )}
          </Section>

          <PaymentHistoryCta
            payments={subscription.payments}
            onPress={() =>
              router.push(`/subscriptions/${subscription.id}/payments` as any)
            }
          />
          <Section title="Actions">
            <Card style={s.actionsCard}>
              {subscription.passes.some(
                (pass) =>
                  pass.status === "active" &&
                  pass.delivery.status === "delivered",
              ) && (
                <Button
                  variant="secondary"
                  size="md"
                  leadingIcon="alert-triangle"
                  fullWidth
                  onPress={() => setReportModalVisible(true)}
                >
                  Signaler une perte ou un vol
                </Button>
              )}
              {subscription.status === "active" && (
                <Button
                  variant="danger"
                  size="md"
                  fullWidth
                  onPress={() => setCancelModalVisible(true)}
                >
                  Résilier l&apos;abonnement
                </Button>
              )}
            </Card>
          </Section>
        </ScrollView>
      </View>
      <ReportLostOrStolenModal
        visible={reportModalVisible}
        subscriptionId={subscription.id}
        addresses={subscription.beneficiary.addresses}
        onClose={() => setReportModalVisible(false)}
        onSuccess={() => {
          setReportModalVisible(false);
          reload();
        }}
      />

      <CancelSubscriptionModal
        visible={cancelModalVisible}
        subscriptionId={subscription.id}
        onClose={() => setCancelModalVisible(false)}
        onSuccess={() => {
          router.replace("/dashboard");
        }}
      />
      <ChangeBankInfoModal
        visible={bankInfoModalVisible}
        subscriptionId={subscription.id}
        currentBankInfoId={subscription.bankInfo?.id ?? null}
        onClose={() => setBankInfoModalVisible(false)}
        onSuccess={() => {
          setBankInfoModalVisible(false);
          reload();
        }}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: DS.space3,
  },
  errorText: {
    fontSize: 14,
    color: DS.textMuted,
    textAlign: "center",
  },
  wrapper: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: DS.space8,
    gap: DS.space6,
  },
  topGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.space5,
  },
  topGridCol: { flex: 1, minWidth: 240, gap: DS.space4 },
  topGridCard: { flex: 1 },
  docGrid: { flexDirection: "row", flexWrap: "wrap", gap: DS.space3 },
  actionsCard: { gap: DS.space3 },

  bankInfoCard: { padding: DS.space4 },
  bankInfoRow: { flexDirection: "row", alignItems: "center", gap: DS.space3 },
  bankInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  bankInfoText: { flex: 1, gap: 2 },
  bankInfoLabel: { fontSize: 14, fontWeight: "600", color: DS.textStrong },
  bankInfoIban: { fontSize: 13, color: DS.textMuted },
  bankInfoEmpty: { fontSize: 13, color: DS.textMuted, fontStyle: "italic" },
});
