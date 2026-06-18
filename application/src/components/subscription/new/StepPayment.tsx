import { ActivityIndicator, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SectionTitle } from "@/components/ui/Section";
import { DS } from "@/constants/theme";
import type { Tariff } from "@/lib/api/tariffs";
import type { PaymentMode } from "@/lib/api/subscriptions";
import { PaymentChoice } from "./PaymentChoice";
import { FieldLabel } from "./FieldLabel";
import { StepActions } from "./StepActions";
import { s } from "./styles";

function priceTotal(selectedPlan: Tariff | null): string {
  return selectedPlan
    ? `${(((selectedPlan.priceCents ?? 0) / 100) * 12).toFixed(2).replace(".", ",")} €`
    : "—";
}

function priceMonthly(selectedPlan: Tariff | null): string {
  return selectedPlan
    ? `${((selectedPlan.priceCents ?? 0) / 100).toFixed(2).replace(".", ",")} €`
    : "—";
}

export function StepPayment({
  selectedPlan,
  paymentMode,
  onPaymentModeChange,
  iban,
  onIbanChange,
  bic,
  onBicChange,
  holderName,
  onHolderNameChange,
  errors,
  submitError,
  submitting,
  onBack,
  onConfirm,
}: {
  selectedPlan: Tariff | null;
  paymentMode: PaymentMode | null;
  onPaymentModeChange: (mode: PaymentMode) => void;
  iban: string;
  onIbanChange: (value: string) => void;
  bic: string;
  onBicChange: (value: string) => void;
  holderName: string;
  onHolderNameChange: (value: string) => void;
  errors: Record<string, string>;
  submitError: string | null;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const isSepa = paymentMode === "SEPA_ONCE" || paymentMode === "SEPA_MONTHLY";

  return (
    <View style={s.section}>
      <SectionTitle>Paiement</SectionTitle>
      <Text style={s.sectionLead}>
        Choisissez votre mode de paiement et renseignez vos coordonnées
        bancaires.
      </Text>

      <View>
        <FieldLabel>Mode de paiement</FieldLabel>
        <View style={s.paymentChoices}>
          <PaymentChoice
            icon="creditcard"
            label="Carte bancaire"
            description={`Paiement annuel en une fois par carte (${priceTotal(selectedPlan)})`}
            selected={paymentMode === "CARD_ONCE"}
            onPress={() => onPaymentModeChange("CARD_ONCE")}
          />
          <PaymentChoice
            icon="receipt"
            label="Prélèvement SEPA"
            description="Prélèvement bancaire par IBAN"
            selected={isSepa}
            onPress={() => onPaymentModeChange("SEPA_ONCE")}
          />
        </View>
        {!!errors.paymentMode && (
          <Text style={s.fieldError}>{errors.paymentMode}</Text>
        )}
      </View>

      {paymentMode === "CARD_ONCE" && (
        <View style={s.infoBanner}>
          <Icon name="lock" size={16} color={DS.infoText} />
          <Text style={s.infoBannerText}>
            Vous serez redirigé·e vers notre partenaire Stripe pour saisir vos
            informations de carte bancaire en toute sécurité.
          </Text>
        </View>
      )}

      {isSepa && (
        <View style={s.section}>
          <FieldLabel>Fréquence de prélèvement</FieldLabel>
          <View style={s.paymentChoices}>
            <PaymentChoice
              icon="receipt"
              label="En une fois"
              description={`${priceTotal(selectedPlan)} prélevés en une fois`}
              selected={paymentMode === "SEPA_ONCE"}
              onPress={() => onPaymentModeChange("SEPA_ONCE")}
            />
            <PaymentChoice
              icon="receipt"
              label="Mensuel"
              description={`${priceMonthly(selectedPlan)} / mois pendant 12 mois`}
              selected={paymentMode === "SEPA_MONTHLY"}
              onPress={() => onPaymentModeChange("SEPA_MONTHLY")}
            />
          </View>

          <FieldLabel>Coordonnées bancaires (RIB)</FieldLabel>

          <Input
            label="IBAN"
            placeholder="FR76 1234 5678 9012 3456 7890 123"
            value={iban}
            onChangeText={onIbanChange}
            error={errors.iban}
            autoCapitalize="characters"
          />

          <Input
            label="BIC"
            placeholder="BNPAFRPP"
            value={bic}
            onChangeText={onBicChange}
            autoCapitalize="characters"
          />

          <Input
            label="Titulaire du compte"
            placeholder="Nom et prénom du titulaire"
            value={holderName}
            onChangeText={onHolderNameChange}
            error={errors.holderName}
            autoCapitalize="words"
          />
        </View>
      )}

      {!!submitError && (
        <View style={s.inlineError}>
          <Icon name="alert-triangle" size={16} color={DS.dangerText} />
          <Text style={s.inlineErrorText}>{submitError}</Text>
        </View>
      )}

      <StepActions
        onBack={onBack}
        onContinue={onConfirm}
        continueLabel={
          submitting
            ? "Envoi en cours…"
            : paymentMode === "CARD_ONCE"
              ? "Payer par carte"
              : "Valider et payer"
        }
        continueIcon={
          submitting
            ? undefined
            : paymentMode === "CARD_ONCE"
              ? "link"
              : "check"
        }
        disabled={submitting || !paymentMode}
      />
      {submitting && <ActivityIndicator color={DS.actionPrimary} />}
    </View>
  );
}
