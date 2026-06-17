import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import type { Document } from "@/types/subscription";
import { formatDate } from "@/lib/subscription-helpers";

type DocumentCardProps = {
  doc: Document;
};

export function DocumentCard({ doc }: DocumentCardProps) {
  const iconName = doc.type === "contrat" ? "ticket" : "check";

  return (
    <Card style={s.card} accessibilityLabel={doc.label}>
      <View style={s.iconWrap}>
        <Icon name={iconName} size={20} color={DS.actionPrimary} />
      </View>
      <View style={s.body}>
        <Text style={s.label} numberOfLines={2}>
          {doc.label}
        </Text>
        <Text style={s.date}>{formatDate(doc.date)}</Text>
      </View>
      <Button
        variant="secondary"
        size="sm"
        leadingIcon="link"
        fullWidth
        onPress={() => {}}
        accessibilityLabel={`Télécharger ${doc.label}`}
      >
        Télécharger
      </Button>
    </Card>
  );
}

const s = StyleSheet.create({
  card: {
    gap: DS.space3,
    minWidth: 140,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: DS.radiusSm,
    backgroundColor: DS.bluePale,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: DS.space1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: DS.textMuted,
  },
});
