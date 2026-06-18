import { View, Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import type { Target } from "./types";
import { s } from "./styles";

export function StepTarget({
  onSelect,
}: {
  onSelect: (target: Target) => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLead}>
        Pour qui souhaitez-vous souscrire ce nouvel abonnement ?
      </Text>

      <Card style={s.choiceCard}>
        <View style={s.choiceIcon}>
          <Icon name="person" size={22} color={DS.actionPrimary} />
        </View>
        <View style={s.choiceText}>
          <Text style={s.choiceTitle}>Pour moi</Text>
          <Text style={s.choiceDesc}>
            Vous serez titulaire et payeur de l&apos;abonnement.
          </Text>
        </View>
        <Button
          size="sm"
          trailingIcon="arrow-right"
          onPress={() => onSelect("self")}
        >
          Choisir
        </Button>
      </Card>

      <Card style={s.choiceCard}>
        <View style={s.choiceIcon}>
          <Icon name="user-plus" size={22} color={DS.actionPrimary} />
        </View>
        <View style={s.choiceText}>
          <Text style={s.choiceTitle}>Pour une autre personne</Text>
          <Text style={s.choiceDesc}>
            Un proche sera titulaire ; vous serez référent et payeur.
          </Text>
        </View>
        <Button
          size="sm"
          variant="secondary"
          trailingIcon="arrow-right"
          onPress={() => onSelect("other")}
        >
          Choisir
        </Button>
      </Card>
    </View>
  );
}
