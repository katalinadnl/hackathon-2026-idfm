import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SectionTitle } from "@/components/ui/Section";
import { DS } from "@/constants/theme";
import type { Tariff, TariffReduction } from "@/lib/api/tariffs";
import { s } from "./styles";

export function StepReductionProof({
  recommended,
  reduction,
  proofState,
  proofDocumentName,
  onPickProof,
  onSkip,
  onContinue,
  onBack,
}: {
  recommended: Tariff | null;
  reduction: TariffReduction;
  proofState: "idle" | "uploading" | "done";
  proofDocumentName: string | null;
  onPickProof: () => void;
  onSkip: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <View style={s.section}>
      <SectionTitle>Justificatif de réduction</SectionTitle>
      <Text style={s.sectionLead}>
        Votre statut vous donne potentiellement accès à{" "}
        {reduction.isFree
          ? "la gratuité"
          : reduction.reductionPercent
            ? `une réduction de ${reduction.reductionPercent} %`
            : "une réduction"}{" "}
        sur {recommended?.name} ({reduction.name}). Vous pouvez transmettre un
        justificatif maintenant pour accélérer la vérification, ou continuer
        sans et le déclarer sur l&apos;honneur (simulation : aucun document réel
        n&apos;est analysé).
      </Text>

      <Card style={s.scanCard}>
        <View style={[s.scanIcon, proofState === "done" && s.scanIconDone]}>
          <Icon
            name={proofState === "done" ? "check" : "upload"}
            size={26}
            color={proofState === "done" ? DS.white : DS.actionPrimary}
          />
        </View>

        {proofState === "idle" && (
          <>
            <Text style={s.scanText}>
              Aucun justificatif transmis pour le moment.
            </Text>
            <View style={s.scanActionsRow}>
              <Button leadingIcon="upload" onPress={onPickProof}>
                Importer un justificatif
              </Button>
            </View>
            <Pressable onPress={onSkip} style={s.skipScanLink}>
              <Text style={s.skipScanLinkText}>
                Continuer sans justificatif — je déclare mon éligibilité sur
                l&apos;honneur
              </Text>
            </Pressable>
          </>
        )}

        {proofState === "uploading" && (
          <View style={s.inlineLoading}>
            <ActivityIndicator color={DS.actionPrimary} />
            <Text style={s.noteText}>Analyse du justificatif en cours…</Text>
          </View>
        )}

        {proofState === "done" && (
          <Text style={s.scanText}>
            Justificatif transmis : {proofDocumentName}
          </Text>
        )}
      </Card>

      {proofState === "done" ? (
        <View style={s.stepActions}>
          <Button
            variant="secondary"
            leadingIcon="arrow-left"
            style={s.stepActionBtn}
            onPress={onBack}
          >
            Précédent
          </Button>
          <Button
            trailingIcon="arrow-right"
            style={s.stepActionBtn}
            onPress={onContinue}
          >
            Continuer
          </Button>
        </View>
      ) : (
        <Button
          variant="secondary"
          leadingIcon="arrow-left"
          disabled={proofState === "uploading"}
          onPress={onBack}
        >
          Précédent
        </Button>
      )}
    </View>
  );
}
