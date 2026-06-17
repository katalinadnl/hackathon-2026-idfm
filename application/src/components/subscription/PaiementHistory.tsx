import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { DS } from "@/constants/theme";
import { Payment } from "@/types/subscription";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatAmount(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

type PaymentHistoryCtaProps = {
  payments: Payment[];
  onPress: () => void;
};

export function PaymentHistoryCta({
  payments,
  onPress,
}: PaymentHistoryCtaProps) {
  const last = payments[0];

  return (
    <>
      <SectionTitle>Historique de paiement</SectionTitle>
      <Card
        interactive
        onPress={onPress}
        accessibilityLabel="Voir l'historique de paiement"
      >
        <View style={s.paymentCta}>
          <View style={s.paymentCtaLeft}>
            <Text style={s.paymentCtaLabel}>
              {payments.length} paiement{payments.length > 1 ? "s" : ""}
            </Text>
            <Text style={s.paymentCtaSub}>
              Dernier : {last ? formatDate(last.paidAt) : "—"}
              {last ? ` · ${formatAmount(last.amount)}` : ""}
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color={DS.borderDefault} />
        </View>
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  paymentCta: { flexDirection: "row", alignItems: "center", gap: DS.space3 },
  paymentCtaLeft: { flex: 1, gap: 2 },
  paymentCtaLabel: { fontSize: 15, fontWeight: "600", color: DS.textStrong },
  paymentCtaSub: { fontSize: 13, color: DS.textMuted },
});
