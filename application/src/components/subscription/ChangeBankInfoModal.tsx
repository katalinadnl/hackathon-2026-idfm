import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { BankInfo } from "@/types/bankInfo";
import { maskIbanDisplay } from "@/lib/bank-info-helpters";
import { changeBankInfo, getAvailableBankInfos } from "@/lib/api/subscriptions";

type Props = {
  visible: boolean;
  subscriptionId: number;
  currentBankInfoId: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function ChangeBankInfoModal({
  visible,
  subscriptionId,
  currentBankInfoId,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<BankInfo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    setLoading(true);
    setError(null);
    getAvailableBankInfos(subscriptionId)
      .then((data) => {
        setOptions(data);
        setSelectedId(currentBankInfoId);
      })
      .catch(() => setError("Impossible de récupérer vos moyens de paiement."))
      .finally(() => setLoading(false));
  }, [visible, subscriptionId, currentBankInfoId]);

  const handleConfirm = async () => {
    if (!selectedId) return;

    setSubmitting(true);
    setError(null);
    try {
      await changeBankInfo(subscriptionId, selectedId);
      onSuccess();
    } catch {
      setError("Impossible de mettre à jour le moyen de paiement.");
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
            <Icon name="credit-card" size={22} color={DS.actionPrimary} accessible={false} />
            <Text style={s.title} accessibilityRole="header">Changer le moyen de paiement</Text>
          </View>

          <Text style={s.body}>
            Sélectionnez l&apos;IBAN qui sera utilisé pour les prochains
            prélèvements de cet abonnement.
          </Text>

          {loading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator
                size="small"
                color={DS.actionPrimary}
                accessibilityLabel="Chargement des moyens de paiement"
              />
            </View>
          ) : options.length === 0 ? (
            <Text style={s.empty}>
              Aucun moyen de paiement disponible. Ajoutez un IBAN depuis votre
              compte avant de continuer.
            </Text>
          ) : (
            <View style={s.list} accessibilityRole="list">
              {options.map((bankInfo) => (
                <Card
                  key={bankInfo.id}
                  interactive
                  onPress={() => setSelectedId(bankInfo.id)}
                  accessibilityLabel={`${bankInfo.label ?? bankInfo.holderName}, ${maskIbanDisplay(bankInfo.iban)}${selectedId === bankInfo.id ? ", sélectionné" : ""}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedId === bankInfo.id }}
                  style={[
                    s.optionCard,
                    selectedId === bankInfo.id && s.optionCardSelected,
                  ]}
                >
                  <View style={s.optionRow}>
                    <View style={s.optionText}>
                      <Text style={s.optionLabel}>
                        {bankInfo.label ?? bankInfo.holderName}
                      </Text>
                      <Text style={s.optionIban}>
                        {maskIbanDisplay(bankInfo.iban)}
                      </Text>
                      <Text style={s.optionHolder}>{bankInfo.holderName}</Text>
                    </View>
                    {selectedId === bankInfo.id && (
                      <Icon name="check" size={18} color={DS.actionPrimary} />
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}

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
              variant="primary"
              onPress={handleConfirm}
              disabled={
                !selectedId || selectedId === currentBankInfoId || submitting
              }
            >
              {submitting ? "Mise à jour…" : "Confirmer"}
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
  loadingRow: { paddingVertical: DS.space4, alignItems: "center" },
  empty: { fontSize: 13, color: DS.textMuted, fontStyle: "italic" },
  list: { gap: DS.space2, maxHeight: 280 },
  optionCard: { padding: DS.space3 },
  optionCardSelected: { borderColor: DS.actionPrimary, borderWidth: 1.5 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: { gap: 2 },
  optionLabel: { fontSize: 14, fontWeight: "600", color: DS.textStrong },
  optionIban: { fontSize: 12, color: DS.textMuted },
  optionHolder: { fontSize: 12, color: DS.textMuted },
  error: { fontSize: 13, color: DS.dangerText },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: DS.space3,
    marginTop: DS.space2,
  },
});
