import { Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { s } from "./styles";

export function PaymentChoice({
  icon,
  label,
  description,
  selected,
  onPress,
}: {
  icon: string;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Card style={[s.paymentChoice, selected && s.paymentChoiceSelected]}>
        <View style={s.paymentChoiceRow}>
          <View style={[s.planRadio, selected && s.planRadioSelected]}>
            {selected && <View style={s.planRadioDot} />}
          </View>
          <View style={s.paymentChoiceIcon}>
            <Icon
              name={icon}
              size={20}
              color={selected ? DS.actionPrimary : DS.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                s.paymentChoiceLabel,
                selected && s.paymentChoiceLabelSelected,
              ]}
            >
              {label}
            </Text>
            <Text style={s.paymentChoiceDesc}>{description}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
