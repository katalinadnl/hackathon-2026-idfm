import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
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
import { Subscription } from "@/types/subscription";
import { AccountsSection } from "@/components/subscription/AccountSection";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PaymentHistoryCta } from "@/components/subscription/PaiementHistory";
import { useSubscription } from "@/hooks/useSubscription";
import { Icon } from "@/components/ui/Icon";
// ── Mock ──────────────────────────────────────────────────────────────────────

const MOCK: Subscription = {
  id: 1,
  navigoNumber: "NAV-2024-001",
  subscriptionType: "Navigo Mois Étudiant",
  startDate: "2024-09-01",
  endDate: "2025-06-30",
  status: "active",
  clientNumber: "ACC-000001",
  renewed: false,
  beneficiary: {
    id: 1,
    firstName: "Alice",
    lastName: "Martin",
    email: "alice.martin@email.fr",
    birthDate: "1998-03-15",
    residenceDepartment: { name: "Paris" },
  },
  account: { email: "alice.martin@email.fr" },
  referrer: {
    id: 3,
    email: "pierre.moreau@email.fr",
    accountNumber: "ACC-000003",
    beneficiary: { firstName: "Pierre", lastName: "Moreau" },
  },
  payer: {
    id: 3,
    email: "pierre.moreau@email.fr",
    accountNumber: "ACC-000003",
    beneficiary: { firstName: "Pierre", lastName: "Moreau" },
  },
  payments: [
    {
      id: 1,
      paidAt: "2024-11-01",
      amount: 38.1,
      method: "card",
      status: "succeeded",
    },
    {
      id: 2,
      paidAt: "2024-10-01",
      amount: 38.1,
      method: "card",
      status: "succeeded",
    },
    {
      id: 3,
      paidAt: "2024-09-01",
      amount: 38.1,
      method: "card",
      status: "failed",
    },
  ],
  documents: [
    {
      id: 1,
      type: "attestation",
      label: "Attestation de souscription",
      date: "2024-09-01",
      url: "https://example.com/attestation.pdf",
    },
    {
      id: 2,
      type: "contrat",
      label: "Contrat d'abonnement",
      date: "2024-09-01",
      url: "https://example.com/contrat.pdf",
    },
  ],
  delivery: {
    status: "shipped",
    orderedAt: "2024-11-01",
    estimatedAt: "2024-11-08",
    trackingNumber: "2C4567891234FR",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { subscription: sub, loading, error, refetch } = useSubscription(id);
  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={DS.actionPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !sub) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <Icon name="alert-triangle" size={32} color={DS.danger} />
          <Text style={s.errorText}>{error ?? "Abonnement introuvable"}</Text>
          <Button variant="secondary" size="sm" onPress={refetch}>
            Réessayer
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isOldEnough = getAge(sub.beneficiary.birthDate) >= 16;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <SubscriptionHeader subscription={sub} onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!sub.renewed && (
          <RenewalBanner
            endDate={sub.endDate}
            onPress={() => router.push(`/subscriptions/${sub.id}/renew` as any)}
          />
        )}

        {sub.delivery && sub.delivery.status !== "delivered" && (
          <DeliveryBanner delivery={sub.delivery} />
        )}

        {/* Abonnement + Titulaire côte à côte */}
        <View style={s.topGrid}>
          <View style={s.topGridCol}>
            <SectionTitle>Abonnement</SectionTitle>
            <Card style={s.topGridCard}>
              <InfoRow label="Numéro de pass" value={sub.navigoNumber} />
              <InfoRow label="Numéro client" value={sub.clientNumber} last />
            </Card>
          </View>
          <View style={s.topGridCol}>
            <SectionTitle>Titulaire</SectionTitle>
            <Card style={s.topGridCard}>
              <InfoRow
                label="Nom"
                value={`${sub.beneficiary.firstName} ${sub.beneficiary.lastName}`}
              />
              <InfoRow label="Email" value={sub.beneficiary.email} />
              <InfoRow
                label="Département"
                value={sub.beneficiary.residenceDepartment.name}
              />
              <InfoRow
                label="Naissance"
                value={formatDate(sub.beneficiary.birthDate)}
                last
              />
            </Card>
          </View>
        </View>

        <AccountsSection
          isOldEnough={isOldEnough}
          account={sub.account}
          referrer={sub.referrer}
          payer={sub.payer}
          onLinkAccount={() =>
            router.push(`/subscriptions/${sub.id}/link-account` as any)
          }
        />

        <SectionTitle>Mes documents</SectionTitle>
        {sub.documents.length === 0 ? (
          <Card>
            <InfoRow label="Aucun document disponible" value="" last />
          </Card>
        ) : (
          <View style={s.docGrid}>
            {sub.documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </View>
        )}

        <PaymentHistoryCta
          payments={sub.payments}
          onPress={() =>
            router.push(`/subscriptions/${sub.id}/payments` as any)
          }
        />

        <SectionTitle>Actions</SectionTitle>
        <Card style={s.actionsCard}>
          <Button
            variant="secondary"
            size="md"
            leadingIcon="alert-triangle"
            fullWidth
            onPress={() =>
              Alert.alert(
                "Signaler une perte ou un vol",
                "Cette action bloquera votre pass Navigo immédiatement. Voulez-vous continuer ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Bloquer le pass",
                    style: "destructive",
                    onPress: () => {},
                  },
                ],
              )
            }
          >
            Signaler une perte ou un vol
          </Button>

          <Button
            variant="secondary"
            size="md"
            leadingIcon="ticket"
            fullWidth
            disabled
            onPress={() => {}}
          >
            Commander un nouveau pass
          </Button>

          <Button
            variant="danger"
            size="md"
            fullWidth
            disabled
            onPress={() => {}}
          >
            Résilier l'abonnement
          </Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.surfacePage },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: DS.space3,
    padding: DS.space5,
  },
  errorText: {
    fontSize: 14,
    color: DS.textMuted,
    textAlign: "center",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: DS.space4,
    paddingBottom: DS.space8,
    gap: DS.space2,
  },
  topGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.space3,
    marginTop: DS.space4,
  },
  topGridCol: { flex: 1, minWidth: 240, gap: DS.space1 },
  topGridCard: { flex: 1 },
  docGrid: { flexDirection: "row", flexWrap: "wrap", gap: DS.space3 },
  actionsCard: { gap: DS.space3 },
});
