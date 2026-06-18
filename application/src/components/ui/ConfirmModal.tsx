import { Modal, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DS } from "@/constants/theme";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Remplace Alert.alert pour les confirmations, car Alert.alert avec
 * plusieurs boutons ne fonctionne pas de façon fiable sur React Native Web.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Annuler",
  confirmVariant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <Card style={s.modal}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          <View style={s.actions}>
            <Button variant="tertiary" onPress={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? "…" : confirmLabel}
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: DS.space5,
  },
  modal: { width: "100%", maxWidth: 400, gap: DS.space3 },
  title: { fontSize: 17, fontWeight: "700", color: DS.textStrong },
  message: { fontSize: 14, color: DS.textBody, lineHeight: 20 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: DS.space3,
    marginTop: DS.space2,
  },
});
