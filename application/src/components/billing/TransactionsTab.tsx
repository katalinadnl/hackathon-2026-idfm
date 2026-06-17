import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DS } from "@/constants/theme";
import { Transaction, TransactionStatus } from "@/lib/api/billing";
import {
  formatDate,
  formatEuro,
  formatEuroPlain,
  METHOD_LABELS,
} from "@/lib/format";
import { useTransactions } from "@/hooks/useBilling";

const STATUS_META: Record<
  TransactionStatus,
  { label: string; tone: "success" | "danger" | "info" }
> = {
  succeeded: { label: "Payé", tone: "success" },
  failed: { label: "Échoué", tone: "danger" },
  refunded: { label: "Remboursé", tone: "info" },
};

type Props = {
  accountId: number;

  subscriptionId: number | null;
};

export function TransactionsTab({ accountId, subscriptionId }: Props) {
  const { data, loading, error, reload } = useTransactions(
    accountId,
    subscriptionId,
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={DS.actionPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <Card>
        <Text style={styles.errorTitle}>
          Impossible de charger l’historique
        </Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Text style={styles.retry} onPress={reload} accessibilityRole="button">
          Réessayer
        </Text>
      </Card>
    );
  }

  if (!data || data.transactions.length === 0) {
    return (
      <Card>
        <Text style={styles.empty}>
          Aucun prélèvement pour cette sélection.
        </Text>
      </Card>
    );
  }

  const settled = data.outstanding <= 0;
  const unpaidCount = data.transactions.filter(
    (t) => t.status === "failed",
  ).length;

  return (
    <View style={styles.wrapper}>
      <Card
        style={[styles.totalCard, settled ? styles.cardOk : styles.cardDue]}
      >
        <Text style={styles.totalLabel}>Restant à payer</Text>
        <Text
          style={[
            styles.totalValue,
            settled ? styles.valueOk : styles.valueDue,
          ]}
        >
          {formatEuroPlain(data.outstanding)}
        </Text>
        <Text style={styles.totalMeta}>
          {settled
            ? "Tout est réglé ✓"
            : `${unpaidCount} paiement${unpaidCount > 1 ? "s" : ""} impayé${
                unpaidCount > 1 ? "s" : ""
              }`}
        </Text>
      </Card>

      <Card style={styles.listCard}>
        {data.transactions.map((tx, i) => (
          <Row key={tx.id} tx={tx} last={i === data.transactions.length - 1} />
        ))}
      </Card>
    </View>
  );
}

function Row({ tx, last }: { tx: Transaction; last: boolean }) {
  const meta = STATUS_META[tx.status];
  const positive = tx.amount > 0;
  return (
    <View
      style={[styles.row, !last && styles.rowBorder]}
      accessible
      accessibilityLabel={`${formatDate(tx.date)}, ${tx.label}, ${formatEuro(
        tx.amount,
      )}, ${meta.label}`}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {tx.label}
        </Text>
        <Text style={styles.rowMeta}>
          {formatDate(tx.date)} · {METHOD_LABELS[tx.method] ?? tx.method}
        </Text>
        <View style={styles.rowBadge}>
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
        </View>
      </View>
      <Text
        style={[
          styles.amount,
          positive && styles.amountPositive,
          tx.status === "failed" && styles.amountFailed,
        ]}
      >
        {formatEuro(tx.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: DS.space4 },
  center: { paddingVertical: DS.space8, alignItems: "center" },

  totalCard: { gap: 2 },
  cardOk: { backgroundColor: DS.successTint, borderColor: DS.success },
  cardDue: { backgroundColor: DS.dangerTint, borderColor: DS.danger },
  totalLabel: { fontSize: 14, color: DS.textMuted, fontWeight: "600" },
  totalValue: { fontSize: 28, fontWeight: "800" },
  valueOk: { color: DS.successText },
  valueDue: { color: DS.dangerText },
  totalMeta: { fontSize: 13, color: DS.textMuted },

  listCard: { padding: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DS.space3,
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space4,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  rowMain: { flex: 1, gap: 4 },
  rowLabel: { fontSize: 15, fontWeight: "700", color: DS.textStrong },
  rowMeta: { fontSize: 13, color: DS.textMuted },
  rowBadge: { marginTop: 2 },
  amount: {
    fontSize: 16,
    fontWeight: "800",
    color: DS.textStrong,
    fontVariant: ["tabular-nums"],
  },
  amountPositive: { color: DS.successText },
  amountFailed: { color: DS.textMuted, textDecorationLine: "line-through" },

  errorTitle: { fontSize: 15, fontWeight: "700", color: DS.dangerText },
  errorBody: { fontSize: 13, color: DS.textMuted, marginTop: 4 },
  retry: {
    fontSize: 15,
    fontWeight: "700",
    color: DS.actionPrimary,
    marginTop: DS.space3,
  },
  empty: { fontSize: 15, color: DS.textMuted, textAlign: "center" },
});
