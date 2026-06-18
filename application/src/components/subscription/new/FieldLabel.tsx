import { Text } from "react-native";
import { s } from "./styles";

export function FieldLabel({ children }: { children: string }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}
