import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { DS } from "@/constants/theme";
import { Icon } from "./Icon";

const SIZES = {
  sm: {
    minHeight: 36,
    paddingHorizontal: 14,
    fontSize: 15,
    gap: 6,
    iconSize: 18,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: 20,
    fontSize: 16,
    gap: 8,
    iconSize: 20,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: 28,
    fontSize: 17,
    gap: 10,
    iconSize: 22,
  },
} as const;

const VARIANTS = {
  primary: {
    bg: DS.actionPrimary,
    bgPress: DS.actionPrimaryActive,
    text: DS.white,
    border: DS.actionPrimary,
    focusBorder: "#FFFFFF",
    focusShadow: "0 0 0 2px #FFFFFF, 0 0 0 5px #1972D2",
  },
  secondary: {
    bg: DS.surfaceCard,
    bgPress: DS.blueSoft,
    text: DS.actionPrimary,
    border: DS.borderDefault,
    focusBorder: DS.actionPrimary,
    focusShadow: "0 0 0 3px #1972D2",
  },
  tertiary: {
    bg: DS.bluePale,
    bgPress: DS.blueSoft,
    text: DS.actionPrimary,
    border: "transparent",
    focusBorder: DS.actionPrimary,
    focusShadow: "0 0 0 3px #1972D2",
  },
  danger: {
    bg: DS.danger,
    bgPress: DS.dangerText,
    text: DS.white,
    border: DS.danger,
    focusBorder: "#FFFFFF",
    focusShadow: "0 0 0 2px #FFFFFF, 0 0 0 5px #C52625",
  },
} as const;

type ButtonVariant = keyof typeof VARIANTS;
type ButtonSize = keyof typeof SIZES;

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: string;
  trailingIcon?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, focused }) => [
        styles.base,
        {
          minHeight: s.minHeight,
          paddingHorizontal: s.paddingHorizontal,
          backgroundColor: pressed ? v.bgPress : v.bg,
          borderColor: focused ? v.focusBorder : v.border,
          borderWidth: focused ? 2.5 : 1.5,
          gap: s.gap,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: disabled ? 0.5 : 1,
        },
        focused && Platform.OS === "web" && ({ boxShadow: v.focusShadow, outline: "none" } as any),
        style,
      ]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ??
        (typeof children === "string" ? children : undefined)
      }
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {leadingIcon && (
        <Icon name={leadingIcon} size={s.iconSize} color={v.text} />
      )}
      <Text style={[styles.label, { fontSize: s.fontSize, color: v.text }]}>
        {children}
      </Text>
      {trailingIcon && (
        <Icon name={trailingIcon} size={s.iconSize} color={v.text} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DS.radiusSm,
    borderWidth: 1.5,
  },
  label: {
    fontWeight: "600",
    lineHeight: 20,
  },
});
