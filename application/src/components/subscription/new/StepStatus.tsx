import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SectionTitle } from "@/components/ui/Section";
import type { BeneficiaryStatus } from "@/lib/api/beneficiaries";
import { STATUS_OPTIONS } from "./types";
import { FieldLabel } from "./FieldLabel";
import { StepActions } from "./StepActions";
import { s } from "./styles";

export function StepStatus({
  age,
  status,
  ssn,
  errors,
  onStatusChange,
  onSsnChange,
  onBack,
  onContinue,
}: {
  age: number | null;
  status: BeneficiaryStatus | null;
  ssn: string;
  errors: Record<string, string>;
  onStatusChange: (status: BeneficiaryStatus) => void;
  onSsnChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const locked = (age !== null && age >= 62) || (age !== null && age < 16);

  return (
    <View style={s.section}>
      <SectionTitle>Statut</SectionTitle>

      {age !== null && age >= 62 ? (
        <Text style={s.noteText}>
          Le bénéficiaire a {age} ans : le statut Senior est attribué
          automatiquement.
        </Text>
      ) : age !== null && age < 16 ? (
        <Text style={s.noteText}>
          Le bénéficiaire a {age} ans : le statut Mineur est attribué
          automatiquement.
        </Text>
      ) : (
        <Text style={s.noteText}>
          Sélectionnez la situation actuelle. Le forfait recommandé sera adapté
          en fonction du statut et de l&apos;âge.
        </Text>
      )}

      <View>
        <FieldLabel>Statut</FieldLabel>
        <View style={s.chipsRow}>
          {STATUS_OPTIONS.filter((opt) => {
            if (age !== null && age >= 62) return opt.value === "SENIOR";
            if (age !== null && age < 16) return opt.value === "MINOR";
            if (opt.value === "MINOR") return false;
            if (opt.value === "SENIOR") return age === null || age >= 62;
            if (opt.value === "STUDENT") return age === null || age <= 26;
            return true;
          }).map((opt) => {
            const selected = status === opt.value;
            return (
              <Button
                key={opt.value}
                onPress={() => onStatusChange(opt.value)}
                variant={selected ? "primary" : "secondary"}
                disabled={locked}
                size="sm"
              >
                <Text>{opt.label}</Text>
              </Button>
            );
          })}
        </View>
        {!!errors.status && <Text style={s.fieldError}>{errors.status}</Text>}
      </View>

      {status === "DISABLED" && (
        <Input
          label="Numéro de sécurité sociale"
          placeholder="1 23 45 67 890 123"
          value={ssn}
          onChangeText={onSsnChange}
          error={errors.ssn}
          keyboardType="number-pad"
        />
      )}

      <StepActions onBack={onBack} onContinue={onContinue} />
    </View>
  );
}
