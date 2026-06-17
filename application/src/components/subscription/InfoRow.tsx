import { StyleSheet, Text, View } from "react-native";

import { DS } from "@/constants/theme";

type InfoRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

export function InfoRow({ label, value, last = false }: InfoRowProps) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: DS.space3,
    minHeight: DS.targetMin,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  infoLabel: {
    fontSize: 14,
    color: DS.textMuted,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: DS.textStrong,
    flexShrink: 1,
    textAlign: "right",
    marginLeft: DS.space3,
  },
});
