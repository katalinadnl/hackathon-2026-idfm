import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StripeIbanForm } from "@/components/billing/StripeIbanForm";
import { DS } from "@/constants/theme";
import { usePaymentMethod } from "@/hooks/useBilling";
import { billingApi, RibChangeResponse } from "@/lib/api/billing";

type Props = { accountId: number; subscriptionId: number | null };

export function RibTab({ accountId, subscriptionId }: Props) {
  const { data, loading, error, reload } = usePaymentMethod(
    accountId,
    subscriptionId,
  );
  const [change, setChange] = useState<RibChangeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (subscriptionId === null) {
    return (
      <Card>
        <Text style={styles.hint}>
          Sélectionnez un pass précis pour afficher le RIB associé.
        </Text>
      </Card>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={DS.actionPrimary} />
      </View>
    );
  }

  if (error || !data?.paymentMethod) {
    return (
      <Card>
        <Text style={styles.hint}>
          {error ?? "Aucun RIB enregistré pour ce pass."}
        </Text>
      </Card>
    );
  }

  const pm = data.paymentMethod;

  const handleModify = async () => {
    setBusy(true);
    setDone(false);
    try {
      setChange(await billingApi.startRibChange(accountId, subscriptionId));
    } finally {
      setBusy(false);
    }
  };

  const handleSuccess = async (setupIntentId: string) => {
    await billingApi.finalizeRibChange(
      accountId,
      subscriptionId,
      setupIntentId,
    );
    setChange(null);
    setDone(true);
    reload();
  };

  const canCollect =
    change?.clientSecret && change.billingName && change.billingEmail;

  return (
    <View style={styles.wrapper}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Coordonnées bancaires</Text>
            <Text style={styles.subtitle}>Prélèvement SEPA</Text>
          </View>
          {pm.isDefault && <Badge tone="info">Par défaut</Badge>}
        </View>

        <View style={styles.ibanBox}>
          <Icon name="creditcard" size={22} color={DS.actionPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.iban}>{pm.ibanMasked}</Text>
            <Text style={styles.bank}>
              {pm.bankName} · {pm.holderName}
            </Text>
          </View>
        </View>

        {done && <Text style={styles.success}>RIB mis à jour ✓</Text>}

        {!change && (
          <Button
            leadingIcon="creditcard"
            onPress={handleModify}
            disabled={busy}
          >
            {busy ? "Préparation…" : "Modifier mon RIB"}
          </Button>
        )}
      </Card>

      {change && (
        <Card style={styles.card}>
          <Text style={styles.title}>Nouveau RIB</Text>
          <Text style={styles.changeNote}>
            Saisir un nouvel IBAN crée un nouveau mandat SEPA et révoque
            l’ancien. Le nouveau RIB devient votre moyen de paiement par défaut.
          </Text>

          {canCollect ? (
            <StripeIbanForm
              clientSecret={change.clientSecret as string}
              billingName={change.billingName as string}
              billingEmail={change.billingEmail as string}
              onSuccess={handleSuccess}
              onCancel={() => setChange(null)}
            />
          ) : (
            <>
              <Text style={styles.message}>{change.message}</Text>
              <View style={styles.actions}>
                <Button variant="tertiary" onPress={() => setChange(null)}>
                  Fermer
                </Button>
              </View>
            </>
          )}
        </Card>
      )}

      {!data.connected && (
        <Text style={styles.note}>
          Données représentatives en attendant le branchement de Stripe.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: DS.space3 },
  center: { paddingVertical: DS.space8, alignItems: "center" },
  card: { gap: DS.space4 },
  header: { flexDirection: "row", alignItems: "center", gap: DS.space3 },
  title: { fontSize: 18, fontWeight: "800", color: DS.textStrong },
  subtitle: { fontSize: 13, color: DS.textMuted, marginTop: 2 },
  ibanBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    backgroundColor: DS.surfaceTint,
    borderRadius: DS.radiusMd,
    padding: DS.space4,
  },
  iban: {
    fontSize: 17,
    fontWeight: "800",
    color: DS.textStrong,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  bank: { fontSize: 13, color: DS.textMuted, marginTop: 2 },
  success: { fontSize: 14, fontWeight: "700", color: DS.successText },
  changeNote: { fontSize: 13, color: DS.textBody, lineHeight: 19 },
  message: { fontSize: 13, color: DS.infoText },
  actions: { flexDirection: "row", gap: DS.space3, justifyContent: "flex-end" },
  hint: { fontSize: 15, color: DS.textMuted, textAlign: "center" },
  note: {
    fontSize: 12,
    color: DS.textMuted,
    fontStyle: "italic",
    paddingHorizontal: DS.space2,
  },
});
