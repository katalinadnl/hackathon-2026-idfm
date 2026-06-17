import { StyleSheet, Text } from "react-native";

import { DS } from "@/constants/theme";

type SectionTitleProps = {
  children: string;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <Text style={s.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

const s = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: DS.space2,
    marginBottom: DS.space1,
    marginLeft: DS.space1,
  },
});
