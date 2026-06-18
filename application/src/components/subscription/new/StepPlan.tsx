import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SectionTitle } from "@/components/ui/Section";
import { DS } from "@/constants/theme";
import type { ApiSubscription } from "@/hooks/use-subscriptions";
import type { Tariff, TariffReduction } from "@/lib/api/tariffs";
import {
  formatFrDate,
  formatTariffPrice,
  formatTariffPriceWithReduction,
} from "./helpers";
import { PlanCard } from "./PlanCard";
import { StepActions } from "./StepActions";
import { s } from "./styles";

export function StepPlan({
  tariffs,
  tariffsLoading,
  tariffsError,
  onReloadTariffs,
  recommended,
  reduction,
  reason,
  advisory,
  proofSource,
  proofDocumentName,
  planId,
  onPlanIdChange,
  showAllPlans,
  onShowAllPlans,
  heldLongPlans,
  startDate,
  onStartDateChange,
  errors,
  onBack,
  onContinue,
}: {
  tariffs: Tariff[];
  tariffsLoading: boolean;
  tariffsError: string | null;
  onReloadTariffs: () => void;
  recommended: Tariff | null;
  reduction: TariffReduction | null;
  reason: string | null;
  advisory: string | null;
  proofSource: "MANUAL_DOCUMENT" | "DECLARATIVE" | null;
  proofDocumentName: string | null;
  planId: number | null;
  onPlanIdChange: (id: number) => void;
  showAllPlans: boolean;
  onShowAllPlans: () => void;
  heldLongPlans: Map<number, ApiSubscription>;
  startDate: string;
  onStartDateChange: (value: string) => void;
  errors: Record<string, string>;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={s.section}>
      <SectionTitle>Formule</SectionTitle>

      {tariffsLoading && (
        <View style={s.inlineLoading}>
          <ActivityIndicator color={DS.actionPrimary} />
          <Text style={s.noteText}>Chargement des formules…</Text>
        </View>
      )}

      {!tariffsLoading && tariffsError && (
        <View style={s.inlineError}>
          <Icon name="alert-triangle" size={16} color={DS.dangerText} />
          <Text style={s.inlineErrorText}>{tariffsError}</Text>
          <Button size="sm" variant="secondary" onPress={onReloadTariffs}>
            Réessayer
          </Button>
        </View>
      )}

      {!tariffsLoading && !tariffsError && tariffs.length === 0 && (
        <Text style={s.noteText}>
          Aucune formule longue durée disponible pour le moment.
        </Text>
      )}

      {!tariffsLoading && !tariffsError && recommended && (
        <View style={s.section}>
          <View style={s.recommendedBadgeRow}>
            <Icon name="star" size={14} color={DS.actionPrimary} />
            <Text style={s.recommendedBadgeText}>
              Recommandé pour vous{reason ? ` — ${reason}` : ""}
            </Text>
          </View>

          <PlanCard
            tariff={recommended}
            selected={planId === recommended.id}
            recommended
            description={recommended.description}
            sellingArguments={recommended.sellingArguments}
            onPress={() => onPlanIdChange(recommended.id)}
            priceOverride={
              proofSource && reduction ? (
                <View style={s.planPriceCol}>
                  <Text style={s.planPriceStrike}>
                    {formatTariffPrice(recommended)}
                  </Text>
                  <Text style={s.planPrice}>
                    {formatTariffPriceWithReduction(recommended, reduction)}
                  </Text>
                </View>
              ) : undefined
            }
          />

          {reduction && proofSource ? (
            <View style={s.infoBanner}>
              <Icon name="check" size={16} color={DS.infoText} />
              <Text style={s.infoBannerText}>
                Réduction appliquée : {reduction.name}
                {proofSource === "MANUAL_DOCUMENT"
                  ? ` — justificatif transmis (${proofDocumentName ?? "document"}).`
                  : " — déclarée sur l'honneur, sans justificatif transmis."}
              </Text>
            </View>
          ) : (
            !!advisory && (
              <View style={s.infoBanner}>
                <Icon name="info" size={16} color={DS.infoText} />
                <Text style={s.infoBannerText}>{advisory}</Text>
              </View>
            )
          )}
        </View>
      )}

      {!tariffsLoading && !tariffsError && tariffs.length > 0 && (
        <>
          {!showAllPlans ? (
            <Button
              variant="tertiary"
              size="sm"
              leadingIcon="chevron-down"
              style={s.regenerateBtn}
              onPress={onShowAllPlans}
            >
              Voir les autres formules
            </Button>
          ) : (
            tariffs
              .filter((t) => t.id !== recommended?.id)
              .map((t) => {
                const heldSub = heldLongPlans.get(t.id);
                const held = Boolean(heldSub);
                return (
                  <PlanCard
                    key={t.id}
                    tariff={t}
                    selected={planId === t.id}
                    held={held}
                    heldUntilLabel={
                      heldSub
                        ? formatFrDate(new Date(heldSub.endDate))
                        : undefined
                    }
                    description={t.description}
                    onPress={() => {
                      if (!held) onPlanIdChange(t.id);
                    }}
                  />
                );
              })
          )}
        </>
      )}

      {!!errors.plan && <Text style={s.fieldError}>{errors.plan}</Text>}

      <Input
        label="Date de début souhaitée"
        placeholder="JJ/MM/AAAA"
        value={startDate}
        onChangeText={onStartDateChange}
        error={errors.startDate}
      />

      <StepActions onBack={onBack} onContinue={onContinue} />
    </View>
  );
}
