import { StyleSheet, Text, View } from "react-native";

import { DS } from "@/constants/theme";
import { ReactNode } from "react";

type SectionTitleProps = {
  children: string;
  action?: ReactNode;
};

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <View style={s.sectionTitle}>
      <Text style={s.title} accessibilityRole="header">
        {children}
      </Text>
      {action}
    </View>
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
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: DS.space2,
    marginTop: DS.space2,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: DS.space1,
  },
});
