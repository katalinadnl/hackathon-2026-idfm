import { View, Text } from "react-native";
import { s } from "./styles";

export function RecapRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[s.recapRow, !last && s.recapRowBorder]}>
      <Text style={s.recapLabel}>{label}</Text>
      <Text style={s.recapValue}>{value}</Text>
    </View>
  );
}
