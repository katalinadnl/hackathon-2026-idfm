import { StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";

const HISTORY = [
  {
    id: "H1",
    date: "15 juin 2026",
    type: "Validation",
    desc: "Métro ligne 1 — Châtelet",
    time: "08:04",
  },
  {
    id: "H2",
    date: "15 juin 2026",
    type: "Validation",
    desc: "RER A — Gare de Lyon",
    time: "08:27",
  },
  {
    id: "H3",
    date: "14 juin 2026",
    type: "Validation",
    desc: "Métro ligne 14 — Saint-Lazare",
    time: "18:12",
  },
  {
    id: "H4",
    date: "14 juin 2026",
    type: "Validation",
    desc: "Métro ligne 6 — Montparnasse",
    time: "18:41",
  },
  {
    id: "H5",
    date: "13 juin 2026",
    type: "Recharge",
    desc: "Navigo Easy — +10 tickets",
    time: "12:05",
  },
];

function HistoryRow({ entry }: { entry: (typeof HISTORY)[0] }) {
  const isRecharge = entry.type === "Recharge";
  return (
    <View style={styles.historyRow}>
      <View
        style={[styles.historyIcon, isRecharge && styles.historyIconRecharge]}
      >
        <Icon
          name={isRecharge ? "creditcard" : "arrow-right"}
          size={16}
          color={isRecharge ? DS.success : DS.actionPrimary}
        />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyDesc}>{entry.desc}</Text>
        <Text style={styles.historyMeta}>
          {entry.type} · {entry.date}
        </Text>
      </View>
      <Text style={styles.historyTime}>{entry.time}</Text>
    </View>
  );
}
export default function HistoryView() {
  return (
    <View style={styles.sectionContent}>
      <Text style={styles.viewTitle}>Historique</Text>
      <Text style={styles.viewSubtitle}>
        Vos dernières validations et recharges sur les 30 derniers jours.
      </Text>

      <View style={styles.card}>
        {HISTORY.map((entry, i) => (
          <View key={entry.id}>
            <HistoryRow entry={entry} />
            {i < HISTORY.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: DS.surfacePage,
  },
  pageContent: {
    flexGrow: 1,
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space6,
    paddingBottom: DS.space9,
  },

  layout: {
    flexDirection: "column",
    gap: DS.space4,
  },
  layoutDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DS.space6,
  },

  sidebar: {
    width: 228,
    flexShrink: 0,
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    padding: DS.space3,
    gap: 2,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: DS.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: DS.space3,
    paddingTop: DS.space2,
    paddingBottom: DS.space3,
  },

  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    paddingHorizontal: DS.space3,
    paddingVertical: 11,
    borderRadius: DS.radiusSm,
  },
  navItemActive: {
    backgroundColor: DS.surfaceSelected,
  },
  navItemPressed: {
    backgroundColor: DS.grey200,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: DS.textStrong,
    flex: 1,
  },
  navLabelActive: {
    color: DS.actionPrimary,
    fontWeight: "600",
  },

  horizNav: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
  },
  horizNavContent: {
    paddingHorizontal: DS.space2,
    paddingVertical: DS.space2,
    gap: DS.space1,
    flexDirection: "row",
  },
  navItemHoriz: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: DS.space3,
    paddingVertical: DS.space2,
    gap: DS.space1,
    minWidth: 80,
  },
  navItemActiveHoriz: {
    backgroundColor: DS.surfaceSelected,
    borderRadius: DS.radiusSm,
  },
  navLabelHoriz: {
    fontSize: 12,
  },

  main: {
    flex: 1,
    gap: DS.space5,
  },
  mainDesktop: {
    gap: DS.space6,
  },

  greeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space4,
  },
  avatarBubble: {
    width: 52,
    height: 52,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: DS.white,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: "800",
    color: DS.textStrong,
    lineHeight: 32,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: DS.textMuted,
    marginTop: 2,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    backgroundColor: DS.warningTint,
    borderRadius: DS.radiusSm,
    padding: DS.space3,
  },
  errorText: {
    fontSize: 14,
    color: DS.warningText,
    flex: 1,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    padding: DS.space5,
  },
  loadingText: {
    fontSize: 14,
    color: DS.textMuted,
  },

  emptyText: {
    fontSize: 14,
    color: DS.textMuted,
    padding: DS.space5,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: DS.space2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: DS.textStrong,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: "600",
    color: DS.textLink,
  },

  sectionContent: {
    gap: DS.space4,
  },

  card: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    overflow: "hidden",
  },

  divider: {
    height: 1,
    backgroundColor: DS.borderSubtle,
    marginHorizontal: DS.space5,
  },

  // Active pass card (dark blue)
  passCard: {
    backgroundColor: "#1242A7",
    borderRadius: DS.radiusMd,
    padding: DS.space5,
    gap: DS.space2,
  },
  passCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: DS.space3,
    marginBottom: DS.space2,
  },
  passCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  passCardType: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  passCardBtn: {
    backgroundColor: DS.white,
    borderColor: DS.white,
  },
  passZones: {
    fontSize: 28,
    fontWeight: "800",
    color: DS.white,
    lineHeight: 34,
  },
  passValidity: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  passCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space4,
    marginTop: DS.space2,
    paddingTop: DS.space3,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    flexWrap: "wrap",
  },
  passPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: DS.white,
  },
  roleRow: {
    flexDirection: "row",
    gap: DS.space2,
    flexWrap: "wrap",
  },
  roleChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space2,
    paddingVertical: 2,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Pass row (white card)
  passRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: DS.space4,
  },
  passRowLeft: {
    flex: 1,
    gap: 4,
  },
  passRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    flexWrap: "wrap",
  },
  passRowType: {
    fontSize: 13,
    fontWeight: "700",
    color: DS.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  passRowZones: {
    fontSize: 17,
    fontWeight: "700",
    color: DS.textStrong,
  },
  passRowValidity: {
    fontSize: 13,
    color: DS.textMuted,
  },
  roleRowSmall: {
    flexDirection: "row",
    gap: DS.space2,
    marginTop: 2,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: DS.actionPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  passRowRight: {
    alignItems: "flex-end",
  },
  passRowPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: DS.textStrong,
  },

  // Payment table row
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space4,
    gap: DS.space3,
    flexWrap: "wrap",
  },
  tableCell: {
    fontSize: 14,
    color: DS.textBody,
  },
  tableCellId: {
    fontWeight: "600",
    color: DS.textMuted,
    width: 100,
  },
  tableCellDesc: {
    flex: 1,
    color: DS.textStrong,
  },
  tableCellDate: {
    color: DS.textMuted,
    width: 110,
  },
  tableCellAmount: {
    fontWeight: "700",
    color: DS.textStrong,
    width: 72,
    textAlign: "right",
  },

  // History rows
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space4,
    gap: DS.space3,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.infoTint,
    alignItems: "center",
    justifyContent: "center",
  },
  historyIconRecharge: {
    backgroundColor: DS.successTint,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyDesc: {
    fontSize: 15,
    fontWeight: "600",
    color: DS.textStrong,
  },
  historyMeta: {
    fontSize: 13,
    color: DS.textMuted,
  },
  historyTime: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textMuted,
  },

  viewTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: DS.textStrong,
  },
  viewSubtitle: {
    fontSize: 15,
    color: DS.textMuted,
    marginTop: -DS.space2,
  },
  billingNote: {
    fontSize: 13,
    color: DS.textMuted,
    fontStyle: "italic",
  },
});
