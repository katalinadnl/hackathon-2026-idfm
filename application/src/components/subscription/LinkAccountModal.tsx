import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { DS } from "@/constants/theme";
import { AccountInfo } from "@/types/subscription";
import { searchAccountsByEmail, linkAccount } from "@/lib/api/subscriptions";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  subscriptionId: number;
  onClose: () => void;
  onSuccess: () => void;
};

function accountLabel(account: AccountInfo) {
  return account.beneficiary
    ? `${account.beneficiary.firstName} ${account.beneficiary.lastName}`
    : account.accountNumber;
}

export function LinkAccountModal({
  visible,
  subscriptionId,
  onClose,
  onSuccess,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AccountInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AccountInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const accounts = await searchAccountsByEmail(query.trim());
        setResults(accounts);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setSelected(null);
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!selected && !manualEmail) return;
    setSubmitting(true);
    setError(null);
    const emailToUse = selected?.email ?? manualEmail;
    if (!emailToUse) return;
    try {
      await linkAccount(subscriptionId, emailToUse);
      handleClose();
      onSuccess();
    } catch {
      setError("Impossible d'associer ce compte.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <View style={s.overlay}>
        <Card style={s.modal}>
          <View style={s.header}>
            <Icon name="person" size={22} color={DS.actionPrimary} accessible={false} />
            <Text style={s.title} accessibilityRole="header">Associer un compte</Text>
          </View>

          <Text style={s.body}>
            Recherchez un compte existant par email puis sélectionnez-le.
          </Text>

          <Input
            label="Email"
            placeholder="prenom.nom@email.fr"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setSelected(null);
              setManualEmail(null);
            }}
            leadingIcon="search"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          {searching && (
            <View style={s.searchingRow}>
              <ActivityIndicator
                size="small"
                color={DS.actionPrimary}
                accessibilityLabel="Recherche en cours"
              />
              <Text style={s.searchingText} accessibilityElementsHidden>Recherche…</Text>
            </View>
          )}

          {!searching && results.length > 0 && (
            <View style={s.resultsList} accessibilityRole="list">
              {results.map((account) => (
                <Card
                  key={account.id}
                  interactive
                  onPress={() => setSelected(account)}
                  accessibilityLabel={`${accountLabel(account)}, ${account.email}${selected?.id === account.id ? ", sélectionné" : ""}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected?.id === account.id }}
                  style={[
                    s.resultCard,
                    selected?.id === account.id && s.resultCardSelected,
                  ]}
                >
                  <View style={s.resultCardRow}>
                    <View>
                      <Text style={s.resultName}>{accountLabel(account)}</Text>
                      <Text style={s.resultEmail}>{account.email}</Text>
                    </View>

                    {selected?.id === account.id && (
                      <Icon name="check" size={18} color={DS.actionPrimary} />
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ color: DS.actionPrimary }}>
                {manualEmail
                  ? `Nouveau compte : ${manualEmail}`
                  : "Aucun compte trouvé."}
              </Text>

              <Button
                variant="secondary"
                fullWidth
                size="sm"
                onPress={() => {
                  setManualEmail(query.trim().toLowerCase());
                  setSelected(null);
                }}
              >
                Utiliser cet email
              </Button>
            </View>
          )}

          {error && (
            <Text style={s.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">
              {error}
            </Text>
          )}

          <View style={s.actions}>
            <Button
              variant="tertiary"
              onPress={handleClose}
              disabled={submitting}
            >
              Annuler
            </Button>

            <Button
              variant="primary"
              onPress={handleConfirm}
              disabled={(!selected && !manualEmail) || submitting}
            >
              {submitting ? "Association…" : "Associer"}
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
  modal: { width: "100%", maxWidth: 440, gap: DS.space3 },
  header: { flexDirection: "row", alignItems: "center", gap: DS.space2 },
  title: { fontSize: 17, fontWeight: "700", color: DS.textStrong, flex: 1 },
  body: { fontSize: 14, color: DS.textBody, lineHeight: 20 },
  searchingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    paddingVertical: DS.space2,
  },
  searchingText: { fontSize: 13, color: DS.textMuted },
  resultsList: { gap: DS.space2, maxHeight: 240 },
  resultCard: { padding: DS.space3 },
  resultCardSelected: { borderColor: DS.actionPrimary, borderWidth: 1.5 },
  resultCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultCardText: { gap: 2 },
  resultName: { fontSize: 14, fontWeight: "600", color: DS.textStrong },
  resultEmail: { fontSize: 12, color: DS.textMuted },
  noResults: { fontSize: 13, color: DS.textMuted, fontStyle: "italic" },
  error: { fontSize: 13, color: DS.dangerText },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: DS.space3,
    marginTop: DS.space2,
  },
});
