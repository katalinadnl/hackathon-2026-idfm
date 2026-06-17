import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { loadStripe, Stripe, StripeIbanElement } from "@stripe/stripe-js";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DS } from "@/constants/theme";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/api/billing";

type Props = {
  clientSecret: string;
  billingName: string;
  billingEmail: string;

  onSuccess: (setupIntentId: string) => void;
  onCancel: () => void;
};

export function StripeIbanForm({
  clientSecret,
  billingName,
  billingEmail,
  onSuccess,
  onCancel,
}: Props) {
  const ibanMountRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const ibanElRef = useRef<StripeIbanElement | null>(null);

  const [name, setName] = useState(billingName);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!STRIPE_PUBLISHABLE_KEY) {
      setError(
        "Clé publique Stripe absente (EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY).",
      );
      return;
    }
    loadStripe(STRIPE_PUBLISHABLE_KEY).then((stripe) => {
      if (!active || !stripe || !ibanMountRef.current) return;
      const elements = stripe.elements();
      const iban = elements.create("iban", {
        supportedCountries: ["SEPA"],
        placeholderCountry: "FR",
        style: {
          base: { fontSize: "16px", color: DS.textStrong },
        },
      });
      iban.mount(ibanMountRef.current);
      iban.on("change", (e) => setError(e.error?.message ?? null));
      stripeRef.current = stripe;
      ibanElRef.current = iban;
      setReady(true);
    });
    return () => {
      active = false;
      ibanElRef.current?.unmount();
    };
  }, []);

  const handleSubmit = async () => {
    const stripe = stripeRef.current;
    const iban = ibanElRef.current;
    if (!stripe || !iban) return;

    setSubmitting(true);
    setError(null);
    const { error: confirmError, setupIntent } =
      await stripe.confirmSepaDebitSetup(clientSecret, {
        payment_method: {
          sepa_debit: iban,

          billing_details: { name: name.trim(), email: billingEmail.trim() },
        },
      });

    if (confirmError) {
      setError(confirmError.message ?? "Échec de la validation du RIB.");
      setSubmitting(false);
      return;
    }
    onSuccess(setupIntent!.id);
  };

  const canSubmit = ready && !submitting && name.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      <Input
        label="Titulaire du compte"
        leadingIcon="person"
        placeholder="Nom du titulaire"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <View style={styles.label}>
        <Text style={styles.labelText}>Nouvel IBAN</Text>
      </View>

      <View style={styles.field}>
        <div ref={ibanMountRef} style={{ width: "100%" }} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <Button variant="tertiary" onPress={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button
          leadingIcon="check"
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? "Validation…" : "Valider le nouveau RIB"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: DS.space3 },
  label: {},
  labelText: { fontSize: 13, fontWeight: "600", color: DS.textMuted },
  field: {
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    borderRadius: DS.radiusSm,
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space4,
    justifyContent: "center",
    minHeight: DS.targetMin,
  },
  error: { fontSize: 13, color: DS.dangerText },
  actions: { flexDirection: "row", gap: DS.space3, justifyContent: "flex-end" },
});
