import { Text, View } from "react-native";
import { Input } from "@/components/ui/Input";
import { SectionTitle } from "@/components/ui/Section";
import type { Target } from "./types";
import { StepActions } from "./StepActions";
import { s } from "./styles";

export function StepProfile({
  target,
  hasIdentity,
  showScan,
  scanDone,
  firstName,
  lastName,
  birthDate,
  errors,
  onFirstNameChange,
  onLastNameChange,
  onBirthDateChange,
  onBack,
  onContinue,
}: {
  target: Target | null;
  hasIdentity: boolean;
  showScan: boolean;
  scanDone: boolean;
  firstName: string;
  lastName: string;
  birthDate: string;
  errors: Record<string, string>;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onBirthDateChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={s.section}>
      <SectionTitle>Profil</SectionTitle>

      {target === "self" && hasIdentity && (
        <Text style={s.noteText}>
          Prénom, nom, et date de naissance sont pré-remplis depuis votre compte
          (simulation France Connect). Vous pouvez les modifier si besoin.
        </Text>
      )}

      {showScan && scanDone && (
        <Text style={s.noteText}>
          {target === "self"
            ? "Prénom, nom et date de naissance ont été extraits du scan de votre pièce d'identité (simulation)."
            : "Prénom, nom et date de naissance ont été extraits du scan de la pièce d'identité de cette personne (simulation)."}{" "}
          Vous pouvez les modifier si besoin.
        </Text>
      )}

      <View style={s.formRow}>
        <View style={s.formCol}>
          <Input
            label="Prénom"
            value={firstName}
            onChangeText={onFirstNameChange}
            error={errors.firstName}
            autoCapitalize="words"
          />
        </View>
        <View style={s.formCol}>
          <Input
            label="Nom"
            value={lastName}
            onChangeText={onLastNameChange}
            error={errors.lastName}
            autoCapitalize="words"
          />
        </View>
      </View>

      <Input
        label="Date de naissance"
        placeholder="JJ/MM/AAAA"
        value={birthDate}
        onChangeText={(text) => {
          const digits = text.replace(/\D/g, "").slice(0, 8);
          let formatted = digits;
          if (digits.length > 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
          } else if (digits.length > 2) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
          }
          onBirthDateChange(formatted);
        }}
        error={errors.birthDate}
        keyboardType="number-pad"
        maxLength={10}
      />

      <StepActions onBack={onBack} onContinue={onContinue} />
    </View>
  );
}
