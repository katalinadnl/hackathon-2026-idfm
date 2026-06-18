import { StyleSheet, Text, View } from "react-native";

import { Badge, BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DS } from "@/constants/theme";
import { SubscriptionResponse, SubscriptionStatus } from "@/types/subscription";

export const STATUS_TONE: Record<SubscriptionStatus, BadgeTone> = {
  active: "success",
  expired: "neutral",
  cancelled: "danger",
  pending_cancellation: "warning",
};

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Actif",
  expired: "Expiré",
  cancelled: "Bloqué",
  pending_cancellation: "En cours d'arrêt",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type SubscriptionHeaderProps = {
  subscription: SubscriptionResponse;
  onBack: () => void;
};

export function SubscriptionHeader({
  subscription,
  onBack,
}: SubscriptionHeaderProps) {
  return (
    <View style={s.header}>
      <Button
        variant="tertiary"
        size="sm"
        onPress={onBack}
        accessibilityLabel="Retour"
      >
        ← Retour
      </Button>

      <View style={s.headerMain}>
        <View style={s.headerText}>
          <Text style={s.headerTitle} accessibilityRole="header">{subscription.subscriptionType}</Text>
          <Text style={s.headerSub}>
            {subscription.beneficiary.firstName}{" "}
            {subscription.beneficiary.lastName}
          </Text>
        </View>
        <Badge tone={STATUS_TONE[subscription.status]} dot>
          {STATUS_LABEL[subscription.status]}
        </Badge>
      </View>

      <View style={s.headerDates}>
        <View
          accessible
          accessibilityLabel={`Date de début : ${formatDate(subscription.startDate)}`}
        >
          <Text style={s.dateLabel} accessibilityElementsHidden>Début</Text>
          <Text style={s.dateValue} accessibilityElementsHidden>{formatDate(subscription.startDate)}</Text>
        </View>
        <View style={s.dateDivider} accessible={false} />
        <View
          accessible
          accessibilityLabel={`Date de fin : ${formatDate(subscription.endDate)}`}
        >
          <Text style={s.dateLabel} accessibilityElementsHidden>Fin</Text>
          <Text style={s.dateValue} accessibilityElementsHidden>{formatDate(subscription.endDate)}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: DS.space5,
    paddingTop: DS.space3,
    paddingBottom: DS.space4,
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
  headerSub: { fontSize: 14, color: DS.textMuted, marginTop: DS.space1 },
  headerDates: { flexDirection: "row", alignItems: "center", gap: DS.space4 },
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
  dateDivider: { width: 1, height: 28, backgroundColor: DS.borderSubtle },
});
