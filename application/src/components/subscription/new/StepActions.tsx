import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { s } from "./styles";

export function StepActions({
  onBack,
  onContinue,
  continueLabel = "Continuer",
  continueIcon = "arrow-right",
  disabled,
}: {
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueIcon?: string;
  disabled?: boolean;
}) {
  return (
    <View style={s.stepActions}>
      <Button
        variant="secondary"
        leadingIcon="arrow-left"
        style={s.stepActionBtn}
        disabled={disabled}
        onPress={onBack}
      >
        Précédent
      </Button>
      <Button
        trailingIcon={continueIcon}
        style={s.stepActionBtn}
        disabled={disabled}
        onPress={onContinue}
      >
        {continueLabel}
      </Button>
    </View>
  );
}
