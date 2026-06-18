import { StyleSheet, Text, View } from "react-native";

import { DS } from "@/constants/theme";
import { ReactNode } from "react";

type SectionTitleProps = {
  children: string;
  action?: ReactNode;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <Text style={s.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}
type Props = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
};
export function Section({ children, title, action }: Props) {
  return (
    <View style={s.section}>
      <SectionTitle action={action}>{title}</SectionTitle>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  section: { flex: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: DS.space2,
    marginBottom: DS.space2,
    marginLeft: DS.space1,
  },
});
