import { Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SectionTitle } from "@/components/ui/Section";
import { DS } from "@/constants/theme";
import type { Tariff } from "@/lib/api/tariffs";
import type { Target } from "./types";
import { formatTariffPrice } from "./helpers";
import { RecapRow } from "./RecapRow";
import { StepActions } from "./StepActions";
import { s } from "./styles";
import { Department } from "@/lib/api/departments";

export function StepReview({
  target,
  beneficiaryLabel,
  statusLabel,
  residenceDeptLabel,
  workDeptLabel,
  selectedPlan,
  startDate,
  endDateLabel,
  submitError,
  onBack,
  onContinue,
}: {
  target: Target | null;
  beneficiaryLabel: string;
  statusLabel: string | undefined;
  residenceDeptLabel: Department | undefined;
  workDeptLabel: Department | undefined;
  selectedPlan: Tariff;
  startDate: string;
  endDateLabel: string | null;
  submitError: string | null;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={s.section}>
      <SectionTitle>Récapitulatif</SectionTitle>

      <Card style={s.recapCard}>
        <RecapRow label="Titulaire" value={beneficiaryLabel} />
        <RecapRow label="Statut" value={statusLabel ?? "—"} />
        <RecapRow
          label="Résidence"
          value={
            residenceDeptLabel
              ? `${residenceDeptLabel.code} – ${residenceDeptLabel.name}`
              : "—"
          }
        />
        {workDeptLabel && (
          <RecapRow
            label="Travail / études"
            value={`${workDeptLabel.code} – ${workDeptLabel.name}`}
          />
        )}
        <RecapRow label="Formule" value={selectedPlan.name} />
        <RecapRow label="Tarif" value={formatTariffPrice(selectedPlan)} />
        <RecapRow
          label="Validité"
          value={
            endDateLabel
              ? `Du ${startDate} au ${endDateLabel}`
              : `À partir du ${startDate}`
          }
          last
        />
      </Card>

      {target === "other" && (
        <View style={s.infoBanner}>
          <Icon name="info" size={16} color={DS.infoText} />
          <Text style={s.infoBannerText}>
            Vous serez désigné·e référent·e et payeur·se de cet abonnement ;{" "}
            {beneficiaryLabel} en sera titulaire.
          </Text>
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
        onContinue={onContinue}
        continueLabel="Passer au paiement"
        continueIcon="arrow-right"
      />
    </View>
  );
}
