import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { DS } from "@/constants/theme";
import { Icon } from "./Icon";

const DEFAULT_LANGS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
] as const;

type LanguageSwitcherProps = {
  languages?: readonly { code: string; label: string }[];
  value?: string;
  onChange?: (code: string) => void;
};

export function LanguageSwitcher({
  languages = DEFAULT_LANGS,
  value = "fr",
  onChange,
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const current = languages.find((l) => l.code === value) ?? languages[0];

  const pick = (code: string) => {
    setOpen(false);
    onChange?.(code);
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
        ]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Langue : ${current.label}. Appuyez pour changer de langue.`}
        accessibilityHint="Ouvre la liste des langues disponibles"
      >
        <Icon name="globe" size={20} color={DS.textStrong} />
        <Text style={styles.triggerText}>{current.code.toUpperCase()}</Text>
        <Icon name="chevron-down" size={16} color={DS.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        accessible
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback
          onPress={() => setOpen(false)}
          accessible={false}
        >
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View
          style={styles.sheet}
          accessibilityRole="menu"
          accessibilityLabel="Choisir une langue"
        >
          <Text style={styles.sheetTitle}>Choisir une langue</Text>
          {languages.map((lang) => {
            const selected = lang.code === value;
            return (
              <Pressable
                key={lang.code}
                onPress={() => pick(lang.code)}
                style={({ pressed }) => [
                  styles.langItem,
                  selected && styles.langItemSelected,
                  pressed && styles.langItemPressed,
                ]}
                accessible
                accessibilityRole="menuitem"
                accessibilityLabel={lang.label}
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.langLabel,
                    selected && styles.langLabelSelected,
                  ]}
                >
                  {lang.label}
                </Text>
                {selected && (
                  <Icon
                    name="check"
                    size={18}
                    color={DS.actionPrimary}
                    label="Sélectionné"
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    minHeight: DS.targetMin,
    paddingHorizontal: DS.space4,
    borderRadius: DS.radiusSm,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    backgroundColor: "transparent",
  },
  triggerPressed: {
    backgroundColor: DS.bluePale,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: "700",
    color: DS.textStrong,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DS.surfaceCard,
    borderTopLeftRadius: DS.radiusXl,
    borderTopRightRadius: DS.radiusXl,
    padding: DS.space5,
    paddingBottom: DS.space8,
    gap: DS.space1,
    shadowColor: DS.anthracite,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: DS.textStrong,
    paddingBottom: DS.space3,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
    marginBottom: DS.space2,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: DS.targetMin,
    paddingHorizontal: DS.space4,
    borderRadius: DS.radiusSm,
  },
  langItemSelected: {
    backgroundColor: DS.surfaceSelected,
  },
  langItemPressed: {
    backgroundColor: DS.bluePale,
  },
  langLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: DS.textStrong,
  },
  langLabelSelected: {
    fontWeight: "700",
  },
});
