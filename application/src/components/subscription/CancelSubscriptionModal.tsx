import { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { cancelSubscription } from "@/lib/api/subscriptions";

type Props = {
  visible: boolean;
  subscriptionId: number;
  onClose: () => void;
  onSuccess: () => void;
};

function formatEffectiveDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CancelSubscriptionModal({
  visible,
  subscriptionId,
  onClose,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const effectiveDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await cancelSubscription(subscriptionId);
      onSuccess();
    } catch {
      setError("Impossible de résilier l'abonnement. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={s.overlay}>
        <Card style={s.modal}>
          <View style={s.header}>
            <Icon name="alert-triangle" size={24} color={DS.dangerText} accessible={false} />
            <Text style={s.title} accessibilityRole="header">Résilier l&apos;abonnement</Text>
          </View>

          <Text style={s.body}>
            Conformément aux conditions générales d&apos;Île-de-France Mobilités
            :
          </Text>

          <View style={s.bulletList} accessibilityRole="list">
            <View style={s.bulletRow} accessibilityRole="listitem">
              <Icon name="check" size={14} color={DS.textMuted} accessible={false} />
              <Text style={s.bulletText}>
                Aucun préavis n&apos;est nécessaire pour faire la demande.
              </Text>
            </View>
            <View style={s.bulletRow} accessibilityRole="listitem">
              <Icon name="check" size={14} color={DS.textMuted} accessible={false} />
              <Text style={s.bulletText}>
                Le mois en cours reste dû dans son intégralité.
              </Text>
            </View>
            <View style={s.bulletRow} accessibilityRole="listitem">
              <Icon name="check" size={14} color={DS.textMuted} accessible={false} />
              <Text style={s.bulletText}>
                Le pass sera bloqué dès maintenant, mais l&apos;abonnement ne
                sera effectivement résilié qu&apos;à partir du{" "}
                <Text style={s.bulletEmphasis}>
                  {formatEffectiveDate(effectiveDate)}
                </Text>
                .
              </Text>
            </View>
          </View>

          {error && (
            <Text style={s.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">
              {error}
            </Text>
          )}

          <View style={s.actions}>
            <Button variant="tertiary" onPress={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? "Résiliation…" : "Confirmer la résiliation"}
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
  modal: { width: "100%", maxWidth: 460, gap: DS.space3 },
  header: { flexDirection: "row", alignItems: "center", gap: DS.space2 },
  title: { fontSize: 17, fontWeight: "700", color: DS.textStrong, flex: 1 },
  body: { fontSize: 14, color: DS.textBody, lineHeight: 20 },
  bulletList: { gap: DS.space2 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: DS.space2 },
  bulletText: { flex: 1, fontSize: 13, color: DS.textBody, lineHeight: 19 },
  bulletEmphasis: { fontWeight: "700", color: DS.textStrong },
  error: { fontSize: 13, color: DS.dangerText },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: DS.space3,
    marginTop: DS.space2,
  },
});
