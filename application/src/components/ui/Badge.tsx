import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { DS } from "@/constants/theme";

const TONES = {
  neutral: { bg: DS.grey200, fg: DS.textStrong },
  info: { bg: DS.infoTint, fg: DS.infoText },
  success: { bg: DS.successTint, fg: DS.successText },
  warning: { bg: DS.warningTint, fg: DS.warningText },
  danger: { bg: DS.dangerTint, fg: DS.dangerText },
  brand: { bg: DS.actionPrimary, fg: DS.white },
} as const;

export type BadgeTone = keyof typeof TONES;

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  style,
}: BadgeProps) {
  const t = TONES[tone];
  return (
    <View
      style={[styles.container, { backgroundColor: t.bg }, style]}
      accessible
      accessibilityRole="text"
    >
      {dot && <View style={[styles.dot, { backgroundColor: t.fg }]} />}
      <Text style={[styles.label, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DS.radiusPill,
    alignSelf: "flex-start",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
