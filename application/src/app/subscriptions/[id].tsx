import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { DS, Fonts } from "@/constants/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

type Payment = {
  id: number;
  paidAt: string;
  amount: number;
  method: "card" | "direct_debit";
  status: "succeeded" | "failed";
};

type Document = {
  id: number;
  type: "attestation" | "contrat";
  label: string;
  date: string;
  url: string;
};

type Subscription = {
  id: number;
  navigoNumber: string;
  subscriptionType: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "blocked";
  clientNumber: string;
  renewed: boolean;
  beneficiary: {
    firstName: string;
    lastName: string;
    email: string;
    birthDate: string;
    residenceDepartment: { name: string };
  };
  account: { email: string } | null;
  payments: Payment[];
  documents: Document[];
};

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
    firstName: "Alice",
    lastName: "Martin",
    email: "alice.martin@email.fr",
    birthDate: "1998-03-15",
    residenceDepartment: { name: "Paris" },
  },
  account: { email: "alice.martin@email.fr" },
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
    {
      id: 4,
      paidAt: "2024-08-01",
      amount: 38.1,
      method: "direct_debit",
      status: "succeeded",
    },
    {
      id: 5,
      paidAt: "2024-07-01",
      amount: 38.1,
      method: "direct_debit",
      status: "succeeded",
    },
    {
      id: 6,
      paidAt: "2024-06-01",
      amount: 38.1,
      method: "direct_debit",
      status: "succeeded",
    },
    {
      id: 7,
      paidAt: "2024-05-01",
      amount: 38.1,
      method: "direct_debit",
      status: "succeeded",
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
};

const PAYMENTS_PER_PAGE = 3;

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

function formatAmount(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function monthsUntil(iso: string) {
  const end = new Date(iso);
  const today = new Date();
  return (
    (end.getFullYear() - today.getFullYear()) * 12 +
    (end.getMonth() - today.getMonth())
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={s.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function PaymentRow({ payment, last }: { payment: Payment; last: boolean }) {
  const ok = payment.status === "succeeded";
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <View style={s.paymentLeft}>
        <Badge tone={ok ? "success" : "danger"} dot>
          {ok ? "Réussi" : "Échoué"}
        </Badge>
        <View>
          <Text style={s.paymentDate}>{formatDate(payment.paidAt)}</Text>
          <Text style={s.paymentMethod}>
            {payment.method === "card" ? "Carte bancaire" : "Prélèvement"}
          </Text>
        </View>
      </View>
      <Text style={[s.paymentAmount, !ok && s.paymentAmountFail]}>
        {formatAmount(payment.amount)}
      </Text>
    </View>
  );
}

function DocumentRow({ doc, last }: { doc: Document; last: boolean }) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <View style={s.docLeft}>
        <View style={s.docIconWrap}>
          <Icon name="ticket" size={18} color={DS.actionPrimary} />
        </View>
        <View>
          <Text style={s.docLabel}>{doc.label}</Text>
          <Text style={s.paymentMethod}>{formatDate(doc.date)}</Text>
        </View>
      </View>
      <Button
        variant="secondary"
        size="sm"
        leadingIcon="link"
        onPress={() => {}}
        accessibilityLabel={`Télécharger ${doc.label}`}
      >
        Télécharger
      </Button>
    </View>
  );
}

function RenewalBanner({
  endDate,
  onPress,
}: {
  endDate: string;
  onPress: () => void;
}) {
  const months = monthsUntil(endDate);
  // Affiche la bannière entre 4 mois et 0 mois avant la fin
  if (months > 4 || months < 0) return null;

  const urgent = months <= 1;
  const tone = urgent ? "danger" : "warning";
  const bg = urgent ? DS.dangerTint : DS.warningTint;
  const border = urgent ? DS.danger : DS.warning;
  const text = urgent ? DS.dangerText : DS.warningText;
  const iconColor = urgent ? DS.danger : DS.warning;

  const message =
    months === 0
      ? "Votre abonnement expire ce mois-ci."
      : months === 1
        ? "Votre abonnement expire le mois prochain."
        : `Votre abonnement expire dans ${months} mois (${formatDate(endDate)}).`;

  return (
    <View
      style={[s.renewalBanner, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={s.renewalBannerTop}>
        <Icon name="alert-triangle" size={18} color={iconColor} />
        <Text style={[s.renewalTitle, { color: text }]}>
          {urgent ? "Renouvellement urgent" : "Pensez à renouveler"}
        </Text>
        <Badge tone={tone}>{months === 0 ? "Ce mois" : `${months} mois`}</Badge>
      </View>
      <Text style={[s.renewalMessage, { color: text }]}>{message}</Text>
      <Button
        variant={urgent ? "danger" : "primary"}
        size="sm"
        trailingIcon="arrow-right"
        onPress={onPress}
        accessibilityLabel="Renouveler mon abonnement"
      >
        Renouveler maintenant
      </Button>
    </View>
  );
}

function Pagination({
  page,
  total,
  perPage,
  onChange,
}: {
  page: number;
  total: number;
  perPage: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  return (
    <View style={s.pagination}>
      <Button
        variant="tertiary"
        size="sm"
        leadingIcon="arrow-left"
        disabled={page === 0}
        onPress={() => onChange(page - 1)}
        accessibilityLabel="Page précédente"
      >
        Précédent
      </Button>
      <Text style={s.paginationLabel}>
        {page + 1} / {totalPages}
      </Text>
      <Button
        variant="tertiary"
        size="sm"
        trailingIcon="arrow-right"
        disabled={page === totalPages - 1}
        onPress={() => onChange(page + 1)}
        accessibilityLabel="Page suivante"
      >
        Suivant
      </Button>
    </View>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

import { useState } from "react";

export default function SubscriptionDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [paymentPage, setPaymentPage] = useState(0);

  // TODO: remplacer par fetch(`/subscriptions/${id}`)
  const sub = MOCK;
  const age = getAge(sub.beneficiary.birthDate);
  const isOldEnough = age >= 16;

  const statusTone = {
    active: "success",
    expired: "neutral",
    blocked: "danger",
  }[sub.status] as "success" | "neutral" | "danger";
  const statusLabel = { active: "Actif", expired: "Expiré", blocked: "Bloqué" }[
    sub.status
  ];

  const pagedPayments = sub.payments.slice(
    paymentPage * PAYMENTS_PER_PAGE,
    (paymentPage + 1) * PAYMENTS_PER_PAGE,
  );

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <Button
          variant="tertiary"
          size="sm"
          leadingIcon="arrow-left"
          onPress={() => router.back()}
          accessibilityLabel="Retour"
        >
          Retour
        </Button>

        <View style={s.headerMain}>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>{sub.subscriptionType}</Text>
            <Text style={s.headerSub}>
              {sub.beneficiary.firstName} {sub.beneficiary.lastName}
            </Text>
          </View>
          <Badge tone={statusTone} dot>
            {statusLabel}
          </Badge>
        </View>

        <View style={s.headerDates}>
          <View>
            <Text style={s.dateLabel}>Début</Text>
            <Text style={s.dateValue}>{formatDate(sub.startDate)}</Text>
          </View>
          <View style={s.dateDivider} />
          <View>
            <Text style={s.dateLabel}>Fin</Text>
            <Text style={s.dateValue}>{formatDate(sub.endDate)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bannière renouvellement */}
        {!sub.renewed && (
          <RenewalBanner
            endDate={sub.endDate}
            onPress={() => router.push(`/subscriptions/${sub.id}/renew` as any)}
          />
        )}

        {/* Abonnement */}
        <SectionTitle>Abonnement</SectionTitle>
        <Card>
          <InfoRow label="Numéro de pass" value={sub.navigoNumber} />
          <InfoRow label="Numéro client" value={sub.clientNumber} last />
        </Card>

        {/* Titulaire */}
        <SectionTitle>Titulaire</SectionTitle>
        <Card>
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
            label="Date de naissance"
            value={formatDate(sub.beneficiary.birthDate)}
            last
          />
        </Card>

        {/* Compte associé */}
        <SectionTitle>Compte associé</SectionTitle>
        {isOldEnough ? (
          sub.account ? (
            <Card>
              <InfoRow label="Email du compte" value={sub.account.email} last />
            </Card>
          ) : (
            <Card
              interactive
              onPress={() =>
                router.push(`/subscriptions/${sub.id}/link-account` as any)
              }
              accessibilityLabel="Associer ce pass à un compte"
            >
              <View style={s.linkAccountRow}>
                <Icon name="person" size={22} color={DS.actionPrimary} />
                <View style={s.linkAccountText}>
                  <Text style={s.linkAccountLabel}>Associer à un compte</Text>
                  <Text style={s.linkAccountSub}>
                    Connecter ce pass à un compte existant
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={DS.borderDefault} />
              </View>
            </Card>
          )
        ) : (
          <Card>
            <View style={s.lockedRow}>
              <Icon name="info" size={18} color={DS.textMuted} />
              <Text style={s.lockedText}>Disponible à partir de 16 ans</Text>
            </View>
          </Card>
        )}

        {/* Documents */}
        <SectionTitle>Mes documents</SectionTitle>
        <Card>
          {sub.documents.length === 0 ? (
            <View style={s.emptyRow}>
              <Text style={s.emptyText}>Aucun document disponible</Text>
            </View>
          ) : (
            sub.documents.map((doc, i) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                last={i === sub.documents.length - 1}
              />
            ))
          )}
        </Card>

        {/* Historique paiement */}
        <SectionTitle>Historique de paiement</SectionTitle>
        <Card>
          {sub.payments.length === 0 ? (
            <View style={s.emptyRow}>
              <Text style={s.emptyText}>Aucun paiement enregistré</Text>
            </View>
          ) : (
            pagedPayments.map((p, i) => (
              <PaymentRow
                key={p.id}
                payment={p}
                last={i === pagedPayments.length - 1}
              />
            ))
          )}
        </Card>
        <Pagination
          page={paymentPage}
          total={sub.payments.length}
          perPage={PAYMENTS_PER_PAGE}
          onChange={setPaymentPage}
        />

        {/* Actions */}
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
  root: {
    flex: 1,
    backgroundColor: DS.surfacePage,
  },

  // Header
  header: {
    backgroundColor: DS.surfaceCard,
    paddingHorizontal: DS.space5,
    paddingTop: DS.space3,
    paddingBottom: DS.space4,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
    gap: DS.space3,
  },
  headerMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: DS.space3,
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: DS.textStrong,

    lineHeight: 26,
  },
  headerSub: {
    fontSize: 14,
    color: DS.textMuted,

    marginTop: DS.space1,
  },
  headerDates: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space4,
  },
  dateLabel: {
    fontSize: 11,
    color: DS.textMuted,

    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "600",
    color: DS.textBody,

    marginTop: 2,
  },
  dateDivider: {
    width: 1,
    height: 28,
    backgroundColor: DS.borderSubtle,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: DS.space4,
    paddingBottom: DS.space8,
    gap: DS.space2,
  },

  // Renewal banner
  renewalBanner: {
    borderRadius: DS.radiusMd,
    borderWidth: 1.5,
    padding: DS.space4,
    gap: DS.space3,
    marginTop: DS.space4,
  },
  renewalBannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  renewalTitle: {
    fontSize: 15,
    fontWeight: "700",

    flex: 1,
  },
  renewalMessage: {
    fontSize: 13,

    lineHeight: 20,
  },

  // Section title
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,

    marginTop: DS.space4,
    marginBottom: DS.space1,
    marginLeft: DS.space1,
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: DS.space3,
    minHeight: DS.targetMin,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  infoLabel: {
    fontSize: 14,
    color: DS.textMuted,

    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: DS.textStrong,

    flexShrink: 1,
    textAlign: "right",
    marginLeft: DS.space3,
  },

  // Link account
  linkAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  linkAccountText: { flex: 1 },
  linkAccountLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: DS.actionPrimary,
  },
  linkAccountSub: {
    fontSize: 13,
    color: DS.textMuted,

    marginTop: 2,
  },

  // Locked
  lockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    paddingVertical: DS.space2,
  },
  lockedText: {
    fontSize: 14,
    color: DS.textMuted,
  },

  // Empty
  emptyRow: {
    paddingVertical: DS.space4,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: DS.textMuted,
  },

  // Documents
  docLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    flex: 1,
    marginRight: DS.space3,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: DS.radiusSm,
    backgroundColor: DS.bluePale,
    alignItems: "center",
    justifyContent: "center",
  },
  docLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: DS.textStrong,
  },

  // Payment
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    flex: 1,
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: "500",
    color: DS.textStrong,
  },
  paymentMethod: {
    fontSize: 12,
    color: DS.textMuted,

    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
  },
  paymentAmountFail: {
    color: DS.danger,
  },

  // Pagination
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DS.space2,
    marginTop: DS.space1,
  },
  paginationLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: DS.textMuted,
  },

  // Actions
  actionsCard: {
    gap: DS.space3,
  },
});
