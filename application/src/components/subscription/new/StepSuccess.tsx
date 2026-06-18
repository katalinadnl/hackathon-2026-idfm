import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { s } from "./styles";

export function StepSuccess({
  planName,
  beneficiaryLabel,
  onBackToDashboard,
}: {
  planName: string | undefined;
  beneficiaryLabel: string;
  onBackToDashboard: () => void;
}) {
  return (
    <View style={s.successWrap}>
      <View style={s.successIcon}>
        <Icon name="check" size={28} color={DS.white} />
      </View>
      <Text style={s.successTitle}>Demande envoyée</Text>
      <Text style={s.successDesc}>
        Votre demande d&apos;abonnement {planName} pour {beneficiaryLabel} a
        bien été enregistrée.
      </Text>
      <Button fullWidth onPress={onBackToDashboard}>
        Retour à mon espace
      </Button>
    </View>
  );
}
