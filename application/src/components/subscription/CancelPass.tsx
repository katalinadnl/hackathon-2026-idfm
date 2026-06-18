import { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { DS } from "@/constants/theme";
import { Address } from "@/types/subscription";
import { reportLostOrStolen, ReportReason } from "@/lib/api/subscriptions";

type Props = {
  visible: boolean;
  subscriptionId: number;
  addresses: Address[];
  onClose: () => void;
  onSuccess: () => void;
};

const REASON_LABELS: Record<ReportReason, string> = {
  lost: "Perdu",
  stolen: "Volé",
  damaged: "Endommagé",
};

function addressLabel(address: Address) {
  const typeLabel =
    address.type === "delivery"
      ? "Livraison"
      : address.type === "billing"
        ? "Facturation"
        : "Domicile";
  return `${typeLabel}${address.isDefault ? " (par défaut)" : ""}`;
}

// "Nouvelle adresse" est traité comme une carte sélectionnable parmi les
// autres, identifiée par cette valeur spéciale plutôt qu'un id numérique.
const NEW_ADDRESS_KEY = "new";

export function ReportLostOrStolenModal({
  visible,
  subscriptionId,
  addresses,
  onClose,
  onSuccess,
}: Props) {
  const homeAddress =
    addresses.find((a) => a.type === "home" && a.isDefault) ??
    addresses.find((a) => a.type === "home") ??
    addresses[0] ??
    null;

  const [reason, setReason] = useState<ReportReason>("stolen");
  const [selectedKey, setSelectedKey] = useState<
    number | typeof NEW_ADDRESS_KEY
  >(homeAddress?.id ?? NEW_ADDRESS_KEY);
  const [newLine1, setNewLine1] = useState("");
  const [newLine2, setNewLine2] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNewAddressSelected = selectedKey === NEW_ADDRESS_KEY;
  const canSubmit = isNewAddressSelected
    ? newLine1.trim().length > 0 &&
      newCity.trim().length > 0 &&
      newPostalCode.trim().length > 0
    : true;

  const handleConfirm = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await reportLostOrStolen(subscriptionId, {
        reason,
        ...(isNewAddressSelected
          ? {
              newAddress: {
                line1: newLine1.trim(),
                line2: newLine2.trim() || undefined,
                city: newCity.trim(),
                postalCode: newPostalCode.trim(),
              },
            }
          : { addressId: selectedKey }),
      });
      onSuccess();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
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
    >
      <View style={s.overlay}>
        <Card style={s.modal}>
          <View style={s.header}>
            <Icon name="alert-triangle" size={24} color={DS.dangerText} />
            <Text style={s.title}>Signaler une perte ou un vol</Text>
          </View>

          <Text style={s.body}>
            Votre pass Navigo sera immédiatement bloqué et un nouveau pass sera
            commandé.
          </Text>

          <Text style={s.sectionLabel}>Motif</Text>
          <View style={s.reasonRow}>
            {(Object.keys(REASON_LABELS) as ReportReason[]).map((r) => (
              <Button
                key={r}
                variant={reason === r ? "primary" : "tertiary"}
                size="sm"
                onPress={() => setReason(r)}
              >
                {REASON_LABELS[r]}
              </Button>
            ))}
          </View>

          <Text style={s.sectionLabel}>Adresse de livraison</Text>
          <View style={s.addressList}>
            {addresses.map((address) => (
              <Card
                key={address.id}
                interactive
                onPress={() => setSelectedKey(address.id)}
                style={[
                  s.addressCard,
                  selectedKey === address.id && s.addressCardSelected,
                ]}
              >
                <View style={s.addressCardHeader}>
                  <Text style={s.addressType}>{addressLabel(address)}</Text>
                  {selectedKey === address.id && (
                    <Icon name="check" size={16} color={DS.actionPrimary} />
                  )}
                </View>
                <Text style={s.addressLine}>
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </Text>
                <Text style={s.addressLine}>
                  {address.postalCode} {address.city}
                </Text>
              </Card>
            ))}

            <Card
              interactive
              onPress={() => setSelectedKey(NEW_ADDRESS_KEY)}
              style={[
                s.addressCard,
                isNewAddressSelected && s.addressCardSelected,
              ]}
            >
              <View style={s.addressCardHeader}>
                <View style={s.newAddressLabel}>
                  <Icon name="plus" size={16} color={DS.actionPrimary} />
                  <Text style={s.addressType}>Nouvelle adresse</Text>
                </View>
                {isNewAddressSelected && (
                  <Icon name="check" size={16} color={DS.actionPrimary} />
                )}
              </View>

              {isNewAddressSelected && (
                <View style={s.newAddressForm}>
                  <Input
                    label="Adresse (n° et rue)"
                    placeholder="21 rue"
                    value={newLine1}
                    onChangeText={setNewLine1}
                  />
                  <Input
                    label="Complément"
                    value={newLine2}
                    onChangeText={setNewLine2}
                  />
                  <View style={s.cityRow}>
                    <Input
                      label="Code postal"
                      placeholder="Code 75000"
                      value={newPostalCode}
                      onChangeText={setNewPostalCode}
                      keyboardType="number-pad"
                      wrapperProps={{ style: s.postalCodeInput }}
                    />
                    <Input
                      label="Ville"
                      placeholder="Paris"
                      value={newCity}
                      onChangeText={setNewCity}
                      wrapperProps={{ style: s.cityInput }}
                    />
                  </View>
                </View>
              )}
            </Card>
          </View>

          {error && <Text style={s.error}>{error}</Text>}

          <View style={s.actions}>
            <Button variant="tertiary" onPress={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button
              variant="danger"
              leadingIcon="alert-triangle"
              onPress={handleConfirm}
              disabled={submitting || !canSubmit}
            >
              {submitting ? "Blocage en cours…" : "Bloquer le pass"}
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
  modal: { width: "100%", maxWidth: 550, gap: DS.space3 },
  header: { flexDirection: "row", alignItems: "center", gap: DS.space2 },
  title: { fontSize: 17, fontWeight: "700", color: DS.textStrong, flex: 1 },
  body: { fontSize: 14, color: DS.textBody, lineHeight: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: DS.space2,
  },
  reasonRow: { flexDirection: "row", gap: DS.space2 },
  addressList: { gap: DS.space2 },
  addressCard: { gap: 2, padding: DS.space3 },
  addressCardSelected: { borderColor: DS.actionPrimary, borderWidth: 1.5 },
  addressCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  newAddressLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  addressType: { fontSize: 13, fontWeight: "600", color: DS.textStrong },
  addressLine: { fontSize: 13, color: DS.textMuted },
  newAddressForm: { gap: DS.space2, marginTop: DS.space2 },
  cityRow: { flexDirection: "row", gap: DS.space2, width: "100%" },
  postalCodeInput: { flex: 1 },
  cityInput: { flex: 1 },
  error: { fontSize: 13, color: DS.dangerText },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: DS.space3,
    marginTop: DS.space2,
  },
});
