import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { formatDate, monthsUntil } from "@/lib/subscription-helpers";

type RenewalBannerProps = {
  endDate: string;
  onPress: () => void;
};

export function RenewalBanner({ endDate, onPress }: RenewalBannerProps) {
  const months = monthsUntil(endDate);
  // Affiche la bannière entre 4 mois et 0 mois avant la fin
  if (months > 4 || months < 0) return null;

  const urgent = months <= 1;
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
      style={[s.banner, { backgroundColor: bg, borderColor: border }]}
      accessibilityRole={urgent ? "alert" : "none"}
      accessibilityLabel={`${urgent ? "Renouvellement urgent" : "Pensez à renouveler"} : ${message}`}
    >
      <View style={s.top}>
        <Icon name="alert-triangle" size={18} color={iconColor} accessible={false} />
        <Text style={[s.title, { color: text }]} accessibilityElementsHidden>
          {urgent ? "Renouvellement urgent" : "Pensez à renouveler"}
        </Text>
        <Badge tone={urgent ? "danger" : "warning"} accessibilityElementsHidden>
          {months === 0 ? "Ce mois" : `${months} mois`}
        </Badge>
      </View>
      <Text style={[s.message, { color: text }]} accessibilityElementsHidden>{message}</Text>
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

const s = StyleSheet.create({
  banner: {
    borderRadius: DS.radiusMd,
    borderWidth: 1.5,
    padding: DS.space4,
    gap: DS.space3,
    marginTop: DS.space4,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
  },
});
