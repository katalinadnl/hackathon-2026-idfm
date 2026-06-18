import { useRef } from "react";
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View, ViewProps } from "react-native";

import { DS } from "@/constants/theme";
import { Icon } from "./Icon";

type InputProps = TextInputProps & {
  label: string;
  leadingIcon?: string;
  trailingIcon?: string;
  error?: string;
  wrapperProps?: ViewProps;
};

export function Input({ label, leadingIcon, trailingIcon, error, style, onFocus, onBlur, wrapperProps, ...rest }: InputProps) {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    Animated.timing(focusAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    Animated.timing(focusAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    onBlur?.(e);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DS.borderDefault, DS.actionPrimary],
  });

  return (
    <View style={[styles.wrapper, wrapperProps?.style]}>
      <Text style={styles.label} accessibilityRole="text">{label}</Text>
      <Animated.View style={[styles.inputRow, { borderColor }, !!error && styles.inputRowError]}>
        {leadingIcon && <Icon name={leadingIcon} size={20} color={DS.textMuted} />}
        <TextInput
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          placeholderTextColor={DS.textMuted}
          {...rest}
        />
        {trailingIcon && <Icon name={trailingIcon} size={20} color={DS.textMuted} />}
      </Animated.View>
      {!!error && (
        <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: DS.space2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: DS.targetMin,
    borderRadius: DS.radiusMd,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    backgroundColor: DS.surfaceCard,
    paddingHorizontal: DS.space4,
    gap: DS.space2,
  },
  inputRowError: {
    borderColor: DS.danger,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: DS.textStrong,
    lineHeight: 22,
  },
  error: {
    fontSize: 13,
    color: DS.dangerText,
    fontWeight: "500",
  },
});
