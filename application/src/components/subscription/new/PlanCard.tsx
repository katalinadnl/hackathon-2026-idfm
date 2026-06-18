import { Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import type { Tariff } from "@/lib/api/tariffs";
import { formatTariffPrice } from "./helpers";
import { s } from "./styles";

export function PlanCard({
  tariff,
  selected,
  held,
  heldUntilLabel,
  recommended,
  priceOverride,
  description,
  sellingArguments,
  onPress,
}: {
  tariff: Tariff;
  selected: boolean;
  held?: boolean;
  heldUntilLabel?: string;
  recommended?: boolean;
  priceOverride?: React.ReactNode;
  description?: string | null;
  sellingArguments?: string[];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: held }}
    >
      <Card
        style={[
          s.planCard,
          recommended && s.planCardRecommended,
          selected && s.planCardSelected,
          held && s.planCardHeld,
        ]}
      >
        <View style={s.planRow}>
          <View style={[s.planRadio, selected && s.planRadioSelected]}>
            {selected && <View style={s.planRadioDot} />}
          </View>
          <View style={s.planText}>
            <Text style={s.planLabel}>{tariff.name}</Text>
            {!!description && <Text style={s.planDesc}>{description}</Text>}
            {sellingArguments?.map((arg) => (
              <Text key={arg} style={s.sellingArgItem}>
                • {arg}
              </Text>
            ))}
            {held && heldUntilLabel && (
              <Text style={s.planHeldNote}>
                Vous avez déjà cet abonnement — actif jusqu&apos;au{" "}
                {heldUntilLabel}
              </Text>
            )}
          </View>
          {priceOverride ?? (
            <Text style={s.planPrice}>{formatTariffPrice(tariff)}</Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
