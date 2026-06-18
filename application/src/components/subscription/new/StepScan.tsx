import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SectionTitle } from "@/components/ui/Section";
import { DS } from "@/constants/theme";
import type { Beneficiary } from "@/lib/api/beneficiaries";
import type { Target } from "./types";
import { RecapRow } from "./RecapRow";
import { s } from "./styles";

export function StepScan({
  target,
  scanState,
  firstName,
  lastName,
  birthDate,
  otherBeneficiaries,
  otherBeneficiariesLoading,
  onSelectExisting,
  onScan,
  onPickDocument,
  onSkip,
  onContinue,
  onBack,
}: {
  target: Target | null;
  scanState: "idle" | "scanning" | "done";
  firstName: string;
  lastName: string;
  birthDate: string;
  otherBeneficiaries: Beneficiary[];
  otherBeneficiariesLoading: boolean;
  onSelectExisting: (b: Beneficiary) => void;
  onScan: () => void;
  onPickDocument: () => void;
  onSkip: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <>
      {target === "other" &&
        scanState === "idle" &&
        otherBeneficiaries.length > 0 && (
          <View style={s.existingBeneficiaryBlock}>
            <Text style={s.fieldLabel}>
              Ou choisissez un bénéficiaire déjà lié à votre compte
            </Text>
            <View style={s.chipsRow}>
              {otherBeneficiaries.map((b) => (
                <Card
                  key={b.id}
                  onPress={() => onSelectExisting(b)}
                  interactive
                  style={s.chip}
                >
                  <Text style={s.chipLabel}>
                    {b.firstName} {b.lastName}
                  </Text>
                </Card>
              ))}
            </View>
            <Text style={s.noteText}>
              Ou continuez ci-dessous pour ajouter une nouvelle personne.
            </Text>
          </View>
        )}

      {target === "other" &&
        scanState === "idle" &&
        otherBeneficiariesLoading && (
          <View style={s.inlineLoading}>
            <ActivityIndicator color={DS.actionPrimary} />
            <Text style={s.noteText}>Chargement de vos bénéficiaires…</Text>
          </View>
        )}

      <View style={s.section}>
        <SectionTitle>Vérification d&apos;identité</SectionTitle>
        <Text style={s.sectionLead}>
          {target === "self"
            ? "Votre compte ne contient pas encore d'identité vérifiée. Scannez votre carte d'identité ou votre passeport pour pré-remplir vos informations (simulation : aucun document réel n'est analysé)."
            : "Scannez ou importez la carte d'identité ou le passeport de cette personne pour pré-remplir ses informations (simulation : aucun document réel n'est analysé)."}
        </Text>

        <Card style={s.scanCard}>
          <View style={[s.scanIcon, scanState === "done" && s.scanIconDone]}>
            <Icon
              name={scanState === "done" ? "check" : "creditcard"}
              size={26}
              color={scanState === "done" ? DS.white : DS.actionPrimary}
            />
          </View>

          {scanState === "idle" && (
            <>
              <Text style={s.scanText}>
                Aucun document scanné pour le moment.
              </Text>
              <View style={s.scanActionsRow}>
                <Button leadingIcon="camera" onPress={onScan}>
                  {target === "self"
                    ? "Scanner ma pièce d'identité"
                    : "Scanner sa pièce d'identité"}
                </Button>
                <Button
                  variant="secondary"
                  leadingIcon="upload"
                  onPress={onPickDocument}
                >
                  Importer un fichier
                </Button>
              </View>
              <Pressable onPress={onSkip} style={s.skipScanLink}>
                <Text style={s.skipScanLinkText}>
                  {target === "self"
                    ? "Je ne souhaite pas transmettre de document — renseigner mes informations moi-même"
                    : "Pas de document disponible — renseigner ses informations manuellement"}
                </Text>
              </Pressable>
            </>
          )}

          {scanState === "scanning" && (
            <View style={s.inlineLoading}>
              <ActivityIndicator color={DS.actionPrimary} />
              <Text style={s.noteText}>Analyse du document en cours…</Text>
            </View>
          )}

          {scanState === "done" && (
            <>
              <Text style={s.scanText}>
                Informations extraites avec succès.
              </Text>
              <View style={s.recapCard}>
                <RecapRow label="Prénom" value={firstName} />
                <RecapRow label="Nom" value={lastName} />
                <RecapRow label="Naissance" value={birthDate} last />
              </View>
            </>
          )}
        </Card>

        {scanState === "done" ? (
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
            disabled={scanState === "scanning"}
            onPress={onBack}
          >
            Précédent
          </Button>
        )}
      </View>
    </>
  );
}
