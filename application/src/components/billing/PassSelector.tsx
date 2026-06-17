import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { DS } from "@/constants/theme";
import { PassSummary } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/format";

type Props = {
  passes: PassSummary[];

  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

export function PassSelector({ passes, selectedId, onSelect }: Props) {
  const showAll = passes.length > 1;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {showAll && (
        <Pill
          label="Tous mes passes"
          selected={selectedId === null}
          onPress={() => onSelect(null)}
        />
      )}
      {passes.map((p) => (
        <Pill
          key={p.subscriptionId}
          label={p.subscriptionType}
          sublabel={p.holderName}
          roles={p.roles.map((r) => ROLE_LABELS[r])}
          selected={selectedId === p.subscriptionId}
          onPress={() => onSelect(p.subscriptionId)}
        />
      ))}
    </ScrollView>
  );
}

function Pill({
  label,
  sublabel,
  roles,
  selected,
  onPress,
}: {
  label: string;
  sublabel?: string;
  roles?: string[];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.pillSelected,
        pressed && styles.pillPressed,
      ]}
    >
      <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>
        {label}
      </Text>
      {sublabel && (
        <Text style={[styles.pillSub, selected && styles.pillSubSelected]}>
          {sublabel}
        </Text>
      )}
      {roles && roles.length > 0 && (
        <View style={styles.roleRow}>
          {roles.map((r) => (
            <Badge key={r} tone={selected ? "brand" : "info"}>
              {r}
            </Badge>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: DS.space3,
    paddingVertical: DS.space2,
    paddingRight: DS.space4,
  },
  pill: {
    minWidth: 140,
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space3,
    borderRadius: DS.radiusMd,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    backgroundColor: DS.surfaceCard,
    gap: 4,
    justifyContent: "center",
  },
  pillSelected: {
    borderColor: DS.actionPrimary,
    backgroundColor: DS.bluePale,
  },
  pillPressed: {
    opacity: 0.85,
  },
  pillLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: DS.textStrong,
  },
  pillLabelSelected: {
    color: DS.actionPrimary,
  },
  pillSub: {
    fontSize: 13,
    color: DS.textMuted,
  },
  pillSubSelected: {
    color: DS.actionPrimary,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
});
