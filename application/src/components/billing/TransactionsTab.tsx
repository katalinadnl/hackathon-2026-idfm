import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DS } from "@/constants/theme";
import {
  billingApi,
  CurrentMonthStatus,
  invoiceUrl,
  monthInvoiceUrl,
  MonthGroup,
  Transaction,
  TransactionStatus,
} from "@/lib/api/billing";
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

const MONTH_STATUS_META: Record<
  CurrentMonthStatus,
  { label: string; tone: "success" | "danger" | "info" | "warning" }
> = {
  paid: { label: "Mois en cours réglé", tone: "success" },
  pending: { label: "Paiement en cours de traitement", tone: "info" },
  upcoming: { label: "Prochain prélèvement à venir", tone: "info" },
  failed: { label: "Impayé ce mois-ci", tone: "danger" },
  not_applicable: { label: "", tone: "info" },
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
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [payingCardId, setPayingCardId] = useState<string | null>(null);
  const [monthPage, setMonthPage] = useState(0);

  const handleRetry = async (paymentId: string) => {
    setRetryingId(paymentId);
    try {
      await billingApi.retryPayment(Number(paymentId));
      reload?.();
    } catch {
      // reload will show current state
    } finally {
      setRetryingId(null);
    }
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      const onFocus = () => reload?.();
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") reload?.();
    });
    return () => sub.remove();
  }, [reload]);

  const handlePayByCard = async (paymentId: string) => {
    setPayingCardId(paymentId);
    try {
      const res = await billingApi.payByCard(Number(paymentId));
      if (res.url) {
        if (Platform.OS === "web") {
          window.open(res.url, "_blank");
        } else {
          Linking.openURL(res.url);
        }
        return;
      }
      reload?.();
    } catch {
      reload?.();
    } finally {
      setPayingCardId(null);
    }
  };

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
          Impossible de charger l'historique
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

  const isOnce =
    data.paymentMode === "card_once" || data.paymentMode === "sepa_once";
  const settled = data.outstanding <= 0;
  const unpaidCount = data.transactions.filter(
    (t) => t.status === "failed",
  ).length;

  const monthMeta =
    data.currentMonthStatus !== "not_applicable"
      ? MONTH_STATUS_META[data.currentMonthStatus]
      : null;

  const isGrouped = data.monthGroups && data.monthGroups.length > 0;

  return (
    <View style={styles.wrapper}>
      {/* Status card */}
      {isOnce ? (
        <Card
          style={[
            styles.totalCard,
            data.annualPaid ? styles.cardOk : styles.cardDue,
          ]}
        >
          <Text style={styles.totalLabel}>Paiement annuel</Text>
          <Text
            style={[
              styles.totalValue,
              data.annualPaid ? styles.valueOk : styles.valueDue,
            ]}
          >
            {formatEuroPlain(
              data.annualPaid ? 0 : Math.abs(data.transactions[0]?.amount ?? 0),
            )}
          </Text>
          <Text style={styles.totalMeta}>
            {data.annualPaid
              ? "Réglé intégralement"
              : "En attente de règlement"}
          </Text>
        </Card>
      ) : (
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
              ? "Tout est réglé"
              : `${unpaidCount} paiement${unpaidCount > 1 ? "s" : ""} impayé${unpaidCount > 1 ? "s" : ""}`}
          </Text>
        </Card>
      )}

      {/* Current month status */}
      {monthMeta && (
        <Card style={styles.monthCard}>
          <View style={styles.monthRow}>
            <Badge tone={monthMeta.tone} dot>
              {monthMeta.label}
            </Badge>
          </View>
          {data.nextPayment && (
            <Text style={styles.nextPayment}>
              Prochain prélèvement : {formatEuroPlain(data.nextPayment.amount)}{" "}
              le {formatDate(data.nextPayment.date)}
            </Text>
          )}
        </Card>
      )}

      {/* Transaction list — grouped or flat */}
      {isGrouped ? (
        <>
          {data
            .monthGroups!.slice(monthPage * 5, (monthPage + 1) * 5)
            .map((group) => (
              <MonthGroupCard
                key={group.month}
                group={group}
                onRetry={handleRetry}
                onPayByCard={handlePayByCard}
                retryingId={retryingId}
                payingCardId={payingCardId}
              />
            ))}
          {data.monthGroups!.length > 5 && (
            <View style={styles.monthPagination}>
              <Pressable
                onPress={() => setMonthPage((p) => Math.max(0, p - 1))}
                disabled={monthPage === 0}
                style={styles.pageBtn}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    monthPage === 0 && styles.pageDisabled,
                  ]}
                >
                  ← Précédent
                </Text>
              </Pressable>
              <Text style={styles.pageInfo}>
                {monthPage + 1} /{" "}
                {Math.ceil(data.monthGroups!.length / 5)}
              </Text>
              <Pressable
                onPress={() =>
                  setMonthPage((p) =>
                    Math.min(
                      Math.ceil(data.monthGroups!.length / 5) - 1,
                      p + 1,
                    ),
                  )
                }
                disabled={
                  monthPage ===
                  Math.ceil(data.monthGroups!.length / 5) - 1
                }
                style={styles.pageBtn}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    monthPage ===
                      Math.ceil(data.monthGroups!.length / 5) - 1 &&
                      styles.pageDisabled,
                  ]}
                >
                  Suivant →
                </Text>
              </Pressable>
            </View>
          )}
        </>
      ) : (
        <Card style={styles.listCard}>
          {data.transactions.map((tx, i) => (
            <Row
              key={tx.id}
              tx={tx}
              last={i === data.transactions.length - 1}
              onRetry={
                tx.status === "failed" ? () => handleRetry(tx.id) : undefined
              }
              onPayByCard={
                tx.status === "failed"
                  ? () => handlePayByCard(tx.id)
                  : undefined
              }
              retrying={retryingId === tx.id}
              payingCard={payingCardId === tx.id}
            />
          ))}
        </Card>
      )}
    </View>
  );
}

function MonthGroupCard({
  group,
  onRetry,
  onPayByCard,
  retryingId,
  payingCardId,
}: {
  group: MonthGroup;
  onRetry: (id: string) => void;
  onPayByCard: (id: string) => void;
  retryingId: string | null;
  payingCardId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const hasUnpaid = group.outstanding > 0;
  const totalForDisplay = Math.abs(group.total) + group.outstanding;

  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(group.transactions.length / PAGE_SIZE);
  const paginated = group.transactions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const handleDownloadMonth = async () => {
    const url = await monthInvoiceUrl(group.month);
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <Card style={styles.groupCard}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={styles.groupHeader}
        accessibilityRole="button"
      >
        <View style={styles.groupHeaderLeft}>
          <Text style={styles.groupMonth}>{group.label}</Text>
          <Text style={styles.groupCount}>
            {group.transactions.length} paiement
            {group.transactions.length > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.groupHeaderRight}>
          {hasUnpaid && (
            <Badge tone="danger" dot>
              {formatEuroPlain(group.outstanding)} impayé
            </Badge>
          )}
          <Text style={[styles.groupTotal, hasUnpaid && styles.groupTotalDue]}>
            {formatEuroPlain(totalForDisplay)}
          </Text>
          <Text style={styles.expandIcon}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.groupBody}>
          <Pressable
            onPress={handleDownloadMonth}
            style={({ pressed }) => [
              styles.monthDownloadBtn,
              pressed && styles.downloadPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Télécharger la facture ${group.label}`}
          >
            <Text style={styles.monthDownloadText}>
              ↓ Télécharger la facture du mois
            </Text>
          </Pressable>
          {paginated.map((tx, i) => (
            <Row
              key={tx.id}
              tx={tx}
              last={i === paginated.length - 1 && totalPages <= 1}
              onRetry={
                tx.status === "failed" ? () => onRetry(tx.id) : undefined
              }
              onPayByCard={
                tx.status === "failed" ? () => onPayByCard(tx.id) : undefined
              }
              retrying={retryingId === tx.id}
              payingCard={payingCardId === tx.id}
            />
          ))}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <Pressable
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={styles.pageBtn}
              >
                <Text
                  style={[styles.pageBtnText, page === 0 && styles.pageDisabled]}
                >
                  ← Précédent
                </Text>
              </Pressable>
              <Text style={styles.pageInfo}>
                {page + 1} / {totalPages}
              </Text>
              <Pressable
                onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={styles.pageBtn}
              >
                <Text
                  style={[
                    styles.pageBtnText,
                    page === totalPages - 1 && styles.pageDisabled,
                  ]}
                >
                  Suivant →
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

function Row({
  tx,
  last,
  onRetry,
  onPayByCard,
  retrying,
  payingCard,
}: {
  tx: Transaction;
  last: boolean;
  onRetry?: () => void;
  onPayByCard?: () => void;
  retrying?: boolean;
  payingCard?: boolean;
}) {
  const meta = STATUS_META[tx.status];
  const positive = tx.amount > 0;

  const handleDownload = async () => {
    const url = await invoiceUrl(Number(tx.id));
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      Linking.openURL(url);
    }
  };

  const isOtherPayer = !!tx.paidByOther;

  return (
    <View
      style={[styles.row, !last && styles.rowBorder]}
      accessible
      accessibilityLabel={`${formatDate(tx.date)}, ${tx.label}, ${formatEuro(tx.amount)}, ${meta.label}`}
    >
      <View style={styles.rowMain}>
        <Text
          style={[styles.rowLabel, isOtherPayer && styles.rowLabelMuted]}
          numberOfLines={1}
        >
          {tx.label}
        </Text>
        <Text style={styles.rowMeta}>
          {formatDate(tx.date)} · {METHOD_LABELS[tx.method] ?? tx.method}
        </Text>
        {isOtherPayer && (
          <Text style={styles.otherPayer}>
            Payé par {tx.paidByOther}
          </Text>
        )}
        <View style={styles.rowActions}>
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
          {tx.status === "succeeded" && (
            <Pressable
              onPress={handleDownload}
              style={({ pressed }) => [
                styles.downloadButton,
                pressed && styles.downloadPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Télécharger la facture"
            >
              <Text style={styles.downloadIcon}>↓</Text>
              <Text style={styles.downloadText}>Télécharger la facture</Text>
            </Pressable>
          )}
        </View>
        {!isOtherPayer && onPayByCard && (
          <Pressable
            onPress={onPayByCard}
            disabled={payingCard}
            style={({ pressed }) => [
              styles.payCardButton,
              pressed && styles.downloadPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Payer par carte bancaire"
          >
            {payingCard ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.payCardText}>
                💳 Payer par carte bancaire
              </Text>
            )}
          </Pressable>
        )}
      </View>
      <Text
        style={[
          styles.amount,
          positive && styles.amountPositive,
          tx.status === "failed" && styles.amountFailed,
          isOtherPayer && styles.amountMuted,
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

  monthCard: { gap: DS.space2 },
  monthRow: { flexDirection: "row", alignItems: "center" },
  nextPayment: { fontSize: 13, color: DS.textBody },

  listCard: { padding: 0 },

  // Grouped view
  groupCard: { padding: 0, overflow: "hidden" },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space4,
  },
  groupHeaderLeft: { flex: 1, gap: 2 },
  groupMonth: {
    fontSize: 16,
    fontWeight: "800",
    color: DS.textStrong,
    textTransform: "capitalize",
  },
  groupCount: { fontSize: 13, color: DS.textMuted },
  groupHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  groupTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: DS.textStrong,
    fontVariant: ["tabular-nums"],
  },
  groupTotalDue: { color: DS.dangerText },
  expandIcon: { fontSize: 12, color: DS.textMuted },
  groupBody: {
    borderTopWidth: 1,
    borderTopColor: DS.borderSubtle,
  },
  monthDownloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: DS.space3,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  monthDownloadText: {
    fontSize: 13,
    fontWeight: "700",
    color: DS.actionPrimary,
  },
  monthPagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DS.space5,
    paddingVertical: DS.space3,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space3,
    borderTopWidth: 1,
    borderTopColor: DS.borderSubtle,
  },
  pageBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  pageBtnText: { fontSize: 13, fontWeight: "700", color: DS.actionPrimary },
  pageDisabled: { opacity: 0.3 },
  pageInfo: { fontSize: 13, color: DS.textMuted, fontWeight: "600" },

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
  rowLabelMuted: { color: DS.textMuted },
  rowMeta: { fontSize: 13, color: DS.textMuted },
  otherPayer: {
    fontSize: 12,
    fontWeight: "600",
    color: DS.actionPrimary,
    fontStyle: "italic",
    marginTop: 2,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
    flexWrap: "wrap",
  },
  amount: {
    fontSize: 16,
    fontWeight: "800",
    color: DS.textStrong,
    fontVariant: ["tabular-nums"],
  },
  amountPositive: { color: DS.successText },
  amountFailed: { color: DS.textMuted, textDecorationLine: "line-through" },
  amountMuted: { opacity: 0.5 },

  errorTitle: { fontSize: 15, fontWeight: "700", color: DS.dangerText },
  errorBody: { fontSize: 13, color: DS.textMuted, marginTop: 4 },
  retry: {
    fontSize: 15,
    fontWeight: "700",
    color: DS.actionPrimary,
    marginTop: DS.space3,
  },
  empty: { fontSize: 15, color: DS.textMuted, textAlign: "center" },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: DS.actionPrimary,
    borderRadius: 6,
  },
  downloadPressed: {
    opacity: 0.7,
  },
  downloadIcon: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  downloadText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  payCardButton: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#2E7D32",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  payCardText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  retryButton: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: DS.actionPrimary + "14",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: DS.actionPrimary,
  },
});