import { StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import type { Delivery, DeliveryStatus } from "@/types/subscription";
import { formatDate } from "@/lib/subscription-helpers";

const DELIVERY_STEPS: { key: DeliveryStatus; label: string; icon: string }[] = [
  { key: "ordered", label: "Commandé", icon: "check" },
  { key: "preparing", label: "En préparation", icon: "clock" },
  { key: "shipped", label: "Expédié", icon: "bus" },
  { key: "delivered", label: "Livré", icon: "map-pin" },
];

const DELIVERY_ORDER: DeliveryStatus[] = [
  "ordered",
  "preparing",
  "shipped",
  "delivered",
];

type DeliveryBannerProps = {
  delivery: Delivery;
};

export function DeliveryBanner({ delivery }: DeliveryBannerProps) {
  const currentIdx = DELIVERY_ORDER.indexOf(delivery.status);

  return (
    <View style={s.banner}>
      <View style={s.header}>
        <Icon name="post" size={16} color={DS.actionPrimary} />
        <Text style={s.title}>Suivi de livraison</Text>
        {delivery.trackingNumber && (
          <Text style={s.tracking}>n° {delivery.trackingNumber}</Text>
        )}
      </View>

      <View style={s.steps}>
        {DELIVERY_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <View key={step.key} style={s.step}>
              {i > 0 && (
                <View style={[s.line, i <= currentIdx && s.lineDone]} />
              )}
              <View style={[s.dot, done && s.dotDone, active && s.dotActive]}>
                <Icon
                  name={step.icon}
                  size={12}
                  color={done ? DS.white : DS.borderDefault}
                />
              </View>
              <Text
                style={[
                  s.stepLabel,
                  done && s.stepLabelDone,
                  active && s.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={s.eta}>
        Livraison estimée le {formatDate(delivery.estimatedAt)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderBrand,
    padding: DS.space4,
    gap: DS.space4,
    marginTop: DS.space2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: DS.textStrong,
    flex: 1,
  },
  tracking: {
    fontSize: 12,
    color: DS.textMuted,
    fontFamily: "monospace",
  },
  steps: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  step: {
    flex: 1,
    alignItems: "center",
    gap: DS.space2,
  },
  line: {
    position: "absolute",
    top: 14,
    right: "50%",
    left: "-50%",
    height: 2,
    backgroundColor: DS.borderSubtle,
  },
  lineDone: {
    backgroundColor: DS.actionPrimary,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DS.grey200,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: DS.borderSubtle,
    zIndex: 1,
  },
  dotDone: {
    backgroundColor: DS.actionPrimary,
    borderColor: DS.actionPrimary,
  },
  dotActive: {
    borderColor: DS.actionPrimary,
    backgroundColor: DS.blueSoft,
  },
  stepLabel: {
    fontSize: 11,
    color: DS.textMuted,
    textAlign: "center",
  },
  stepLabelDone: {
    color: DS.textBody,
    fontWeight: "500",
  },
  stepLabelActive: {
    color: DS.actionPrimary,
    fontWeight: "700",
  },
  eta: {
    fontSize: 13,
    color: DS.textMuted,
    textAlign: "center",
  },
});
