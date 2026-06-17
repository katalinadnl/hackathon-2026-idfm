import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { DS } from "@/constants/theme";

type CardProps = {
  children: React.ReactNode;
  interactive?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  interactive = false,
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  if (interactive || onPress) {
    // On web, Pressable with accessibilityRole="button" renders as <button>.
    // If the card contains a Button child, that creates invalid nested <button> HTML.
    // Fix: render as a focusable <div> on web (role="none" + tabIndex + keyboard handler)
    // so keyboard users can still activate the card, without the nesting violation.
    const webProps: Record<string, unknown> =
      Platform.OS === "web"
        ? {
            tabIndex: 0,
            onKeyDown: onPress
              ? (e: { key: string; preventDefault(): void }) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPress();
                  }
                }
              : undefined,
          }
        : {};

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed, hovered }) => [
          styles.card,
          interactive && styles.cardInteractive,
          pressed && styles.cardPressed,

          hovered && styles.cardHovered,
          style,
        ]}
        accessible
        accessibilityRole={Platform.OS === "web" ? "none" : "button"}
        accessibilityLabel={accessibilityLabel}
        {...(webProps as any)}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusLg,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    padding: DS.space5,
    shadowColor: DS.anthracite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    borderColor: DS.borderBrand,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },

  cardInteractive: {
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "border-color 150ms ease",
        } as any)
      : {}),
  },
  cardHovered: {
    borderColor: DS.actionPrimary,
  },
});
