import { StyleSheet, Text, View } from "react-native";

import { Badge, BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DS } from "@/constants/theme";
import { SubscriptionResponse, SubscriptionStatus } from "@/types/subscription";
import { GradientPassCard } from "../ui/GradientPassCard";

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
    <GradientPassCard
      header={
        <View style={s.headerMain}>
          <Button
            variant="tertiary"
            size="sm"
            onPress={onBack}
            accessibilityLabel="Retour"
          >
            ← Retour
          </Button>

          <Badge tone={STATUS_TONE[subscription.status]} dot>
            {STATUS_LABEL[subscription.status]}
          </Badge>
        </View>
      }
      content={
        <View style={s.headerText}>
          <Text style={s.headerTitle}>{subscription.subscriptionType}</Text>
          <Text style={s.headerSub}>
            {subscription.beneficiary.firstName}{" "}
            {subscription.beneficiary.lastName}
          </Text>
        </View>
      }
      footer={
        <View style={s.headerDates}>
          <View>
            <Text style={s.dateLabel}>Début</Text>
            <Text style={s.dateValue}>
              {formatDate(subscription.startDate)}
            </Text>
          </View>
          <View style={s.dateDivider} />
          <View>
            <Text style={s.dateLabel}>Fin</Text>
            <Text style={s.dateValue}>{formatDate(subscription.endDate)}</Text>
          </View>
        </View>
      }
    />
  );
}

const s = StyleSheet.create({
  headerMain: {
    gap: DS.space3,
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: DS.white,
    lineHeight: 26,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: DS.space1,
  },
  headerDates: { flexDirection: "row", alignItems: "center", gap: DS.space4 },
  dateLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "600",
    color: DS.white,
    marginTop: 2,
  },
  dateDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
