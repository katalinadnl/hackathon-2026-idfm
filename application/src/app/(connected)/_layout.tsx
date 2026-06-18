import { Href, Slot, usePathname, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { pageInner, usePageLayout } from "@/hooks/use-page-layout";
import { DS } from "@/constants/theme";
type Section =
  | "dashboard"
  | "subscriptions"
  | "billing"
  | "history"
  | "bank-info"
  | "profile";

const NAV_ITEMS: { id: Section; icon: string; label: string; href: Href }[] = [
  {
    id: "dashboard",
    icon: "star",
    label: "Tableau de bord",
    href: "/(connected)/dashboard",
  },
  {
    id: "subscriptions",
    icon: "ticket",
    label: "Vos abonnements",
    href: "/(connected)/subscriptions",
  },
  {
    id: "billing",
    icon: "receipt",
    label: "Facturations",
    href: "/(connected)/billing",
  },
  {
    id: "bank-info",
    icon: "receipt",
    label: "Banque",
    href: "/(connected)/bank-infos",
  },
  {
    id: "history",
    icon: "clock",
    label: "Historique",
    href: "/(connected)/history",
  },
  {
    id: "profile",
    icon: "profil",
    label: "Mon profil",
    href: "/(connected)/profile",
  },
] as const;

function SidebarItem({
  icon,
  label,
  active,
  onPress,
  horizontal,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
  horizontal?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        active && styles.navItemActive,
        pressed && !active && styles.navItemPressed,
        horizontal && styles.navItemHoriz,
        active && horizontal && styles.navItemActiveHoriz,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Icon
        name={icon}
        size={20}
        color={active ? DS.actionPrimary : DS.textMuted}
      />
      <Text
        style={[
          styles.navLabel,
          active && styles.navLabelActive,
          horizontal && styles.navLabelHoriz,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
const getPath = (href: Href): string =>
  typeof href === "string" ? href : href.pathname;

const normalize = (p: string) => p.replace("/(connected)", "");

export default function Connected() {
  const { isDesktop } = usePageLayout();
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (href: Href) => {
    const path = getPath(href);
    return pathname.startsWith(normalize(path));
  };
  return (
    <>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
      >
        <View
          style={[styles.layout, isDesktop && styles.layoutDesktop, pageInner]}
        >
          {/* ── Sidebar ──────────────────────────────────────────────── */}
          {isDesktop ? (
            <View style={styles.sidebar}>
              <Text style={styles.sidebarTitle}>Mon espace</Text>
              {NAV_ITEMS.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  onPress={() => router.push(item.href)}
                />
              ))}
            </View>
          ) : (
            <ScrollView
              id="test"
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizNav}
              contentContainerStyle={styles.horizNavContent}
            >
              {NAV_ITEMS.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.href)}
                  onPress={() => router.push(item.href)}
                  horizontal
                />
              ))}
            </ScrollView>
          )}
          <View style={[styles.main, isDesktop && styles.mainDesktop]}>
            <Slot />
          </View>
        </View>
      </ScrollView>
    </>
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
    flexGrow: 0,
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
