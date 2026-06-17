import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DS } from "@/constants/theme";
import { useMandate } from "@/hooks/useBilling";
import { formatDate } from "@/lib/format";
import {
  mandateDocumentUrl,
  MandateStatus,
  SepaMandate,
} from "@/lib/api/billing";

type Props = {
  accountId: number;
  subscriptionId: number | null;

  onGoToRib?: () => void;
};

const STATUS_META: Record<
  MandateStatus,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  active: { label: "Actif", tone: "success" },
  pending: { label: "En attente", tone: "warning" },
  revoked: { label: "Révoqué", tone: "danger" },
};

export function MandateTab({ accountId, subscriptionId, onGoToRib }: Props) {
  const { data, loading, error } = useMandate(accountId, subscriptionId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={DS.actionPrimary} />
      </View>
    );
  }

  if (error || !data?.active) {
    return (
      <Card>
        <Text style={styles.hint}>
          {error ?? "Aucun mandat SEPA n’est associé à ce pass."}
        </Text>
      </Card>
    );
  }

  const m = data.active;
  const meta = STATUS_META[m.status];

  const handleDownload = async () => {
    if (subscriptionId != null) {
      Linking.openURL(await mandateDocumentUrl(subscriptionId));
    }
  };

  return (
    <View style={styles.wrapper}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mandat de prélèvement SEPA</Text>
            <Text style={styles.subtitle}>
              Prélèvement récurrent · {m.scheme}
            </Text>
          </View>
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
        </View>

        <View>
          <DetailRow label="Référence (RUM)" value={m.reference} />
          <DetailRow label="Créancier" value={m.creditorName} />
          <DetailRow label="ICS" value={m.creditorIcs} />
          <DetailRow label="Débiteur" value={m.debtorName} />
          <DetailRow label="IBAN" value={m.ibanMasked} mono />
          <DetailRow label="Pass Navigo" value={m.navigoNumber} />
          <DetailRow label="Signé le" value={formatDate(m.signedAt)} last />
        </View>

        <Button
          leadingIcon="link"
          onPress={handleDownload}
          accessibilityLabel="Télécharger le mandat SEPA au format PDF"
        >
          Télécharger le mandat (PDF)
        </Button>

        {onGoToRib && (
          <Button
            variant="tertiary"
            trailingIcon="arrow-right"
            onPress={onGoToRib}
            accessibilityHint="Ouvre l’onglet RIB pour changer de compte bancaire"
          >
            Changer de coordonnées bancaires
          </Button>
        )}
      </Card>

      {data.history.length > 0 && (
        <Card style={styles.historyCard}>
          <Text style={styles.historyTitle}>Mandats précédents</Text>
          {data.history.map((h, i) => (
            <HistoryRow
              key={h.reference}
              mandate={h}
              last={i === data.history.length - 1}
            />
          ))}
        </Card>
      )}

      {!data.connected && (
        <Text style={styles.note}>
          Données représentatives en attendant le branchement de Stripe (le RIB
          est transmis lors de l’inscription).
        </Text>
      )}
    </View>
  );
}

function DetailRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.mono]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function HistoryRow({
  mandate,
  last,
}: {
  mandate: SepaMandate;
  last: boolean;
}) {
  return (
    <View style={[styles.histRow, !last && styles.rowBorder]}>
      <View style={styles.histMain}>
        <Text style={[styles.rowValue, styles.mono]}>{mandate.ibanMasked}</Text>
        <Text style={styles.histMeta}>
          {mandate.reference}
          {mandate.revokedAt
            ? ` · révoqué le ${formatDate(mandate.revokedAt)}`
            : ""}
        </Text>
      </View>
      <Badge tone="danger">Révoqué</Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: DS.space3 },
  center: { paddingVertical: DS.space8, alignItems: "center" },
  card: { gap: DS.space4 },
  header: { flexDirection: "row", alignItems: "center", gap: DS.space3 },
  title: { fontSize: 18, fontWeight: "800", color: DS.textStrong },
  subtitle: { fontSize: 13, color: DS.textMuted, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DS.space4,
    paddingVertical: DS.space3,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: DS.borderSubtle },
  rowLabel: { fontSize: 14, color: DS.textMuted },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
    color: DS.textStrong,
    flexShrink: 1,
    textAlign: "right",
  },
  mono: { fontVariant: ["tabular-nums"], letterSpacing: 0.5 },
  historyCard: { gap: DS.space2 },
  historyTitle: { fontSize: 15, fontWeight: "800", color: DS.textStrong },
  histRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: DS.space3,
    paddingVertical: DS.space3,
  },
  histMain: { flex: 1, gap: 2 },
  histMeta: { fontSize: 12, color: DS.textMuted },
  hint: { fontSize: 15, color: DS.textMuted, textAlign: "center" },
  note: {
    fontSize: 12,
    color: DS.textMuted,
    fontStyle: "italic",
    paddingHorizontal: DS.space2,
  },
});
