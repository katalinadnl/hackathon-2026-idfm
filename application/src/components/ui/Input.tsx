import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from "react-native";

import { DS } from "@/constants/theme";
import { Icon } from "./Icon";

type InputProps = TextInputProps & {
  label: string;
  leadingIcon?: string;
  trailingIcon?: string;
  error?: string;
  wrapperProps?: ViewProps;
};

export function Input({
  label,
  leadingIcon,
  trailingIcon,
  error,
  style,
  wrapperProps,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, wrapperProps?.style]}>
      <Text style={styles.label} accessibilityRole="text">
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          !!error && styles.inputRowError,
        ]}
      >
        {leadingIcon && (
          <Icon
            name={leadingIcon}
            size={20}
            color={focused ? DS.actionPrimary : DS.textMuted}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          placeholderTextColor={DS.textMuted}
          {...rest}
        />
        {trailingIcon && (
          <Icon name={trailingIcon} size={20} color={DS.textMuted} />
        )}
      </View>
      {!!error && (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
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
  inputRowFocused: {
    borderColor: DS.actionPrimary,
    shadowColor: DS.actionPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
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
