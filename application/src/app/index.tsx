import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisruptionBanner } from "@/components/ui/DisruptionBanner";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { JourneyCard } from "@/components/ui/JourneyCard";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LineBadge } from "@/components/ui/LineBadge";
import { BottomTabInset, DS, MaxContentWidth } from "@/constants/theme";
import { useI18n } from "@/contexts/i18n";
import { pageInner, usePageLayout } from "@/hooks/use-page-layout";

// Static data
const POPULAR_DESTINATIONS = [
  { name: "Tour Eiffel", mode: "rer" as const, line: "C", mins: "18 min" },
  { name: "La Défense", mode: "rer" as const, line: "A", mins: "24 min" },
  { name: "Aéroport CDG", mode: "rer" as const, line: "B", mins: "38 min" },
  { name: "Versailles", mode: "rer" as const, line: "C", mins: "41 min" },
];

const TRAFFIC_STATUS = [
  { mode: "metro" as const, line: 1, status: "normal" as const },
  { mode: "metro" as const, line: 14, status: "normal" as const },
  {
    mode: "rer" as const,
    line: "A",
    status: "major" as const,
    message: "Interrompu Châtelet ↔ Nation jusqu'à 18h.",
  },
  {
    mode: "rer" as const,
    line: "B",
    status: "minor" as const,
    message: "Temps d'attente prolongés.",
  },
  { mode: "metro" as const, line: 4, status: "normal" as const },
  {
    mode: "metro" as const,
    line: 6,
    status: "minor" as const,
    message: "Trafic ralenti, travaux.",
  },
];

const JOURNEY_RESULTS = [
  {
    depart: "08:04",
    arrive: "08:27",
    duration: "23 min",
    recommended: true,
    accessible: true,
    legs: [
      { walk: 4 },
      { mode: "metro", line: 1 },
      { mode: "rer", line: "A" },
      { walk: 3 },
    ],
  },
  {
    depart: "08:09",
    arrive: "08:38",
    duration: "29 min",
    legs: [
      { walk: 2 },
      { mode: "metro", line: 14 },
      { mode: "metro", line: 6 },
      { walk: 5 },
    ],
  },
  {
    depart: "08:12",
    arrive: "08:44",
    duration: "32 min",
    accessible: true,
    legs: [
      { walk: 6 },
      { mode: "bus", line: "91" },
      { mode: "metro", line: 4 },
      { walk: 2 },
    ],
  },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle} role="heading" aria-level={2}>
      {children}
    </Text>
  );
}

export default function HomeScreen() {
  const { lang, setLang, t } = useI18n();
  const { isDesktop, hPad } = usePageLayout();

  const [from, setFrom] = useState("Gare de Lyon");
  const [to, setTo] = useState("La Défense");
  const [pmr, setPmr] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "Accueil – Comutitres";
    }
  }, []);

  const handleSearch = () => setSearched(true);
  const handleSwap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  const sectionPad = {
    paddingHorizontal: hPad,
    paddingVertical: isDesktop ? DS.space8 : DS.space6,
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: BottomTabInset + DS.space8 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <SafeAreaView edges={Platform.OS === "web" ? [] : ["top"]}>
        {/* ─── Mobile header (hidden on web — web nav handles it) ── */}
        {Platform.OS !== "web" && (
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/logo/comutitres_v_couleur.svg")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Comutitres"
            />
            <LanguageSwitcher value={lang} onChange={setLang as any} />
          </View>
        )}

        {/* ─── Hero / Planner ──────────────────────────────────── */}
        <View style={styles.hero}>
          <View
            style={[styles.heroInner, isDesktop && styles.heroInnerDesktop]}
          >
            <View style={isDesktop ? styles.heroTextDesktop : undefined}>
              <Text
                style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}
                role="heading"
                aria-level={1}
              >
                {t("hero_title")}
              </Text>
              <Text
                style={[styles.heroSub, isDesktop && styles.heroSubDesktop]}
              >
                {t("hero_sub")}
              </Text>
            </View>

            <Card
              style={[
                styles.plannerCard,
                isDesktop && styles.plannerCardDesktop,
              ]}
            >
              {/* Desktop: inputs side by side; mobile: stacked */}
              {isDesktop ? (
                <View style={styles.routeRowDesktop}>
                  <View style={styles.routeInputDesktop}>
                    <Input
                      label={t("from_label")}
                      leadingIcon="map-pin"
                      placeholder={t("from_placeholder")}
                      value={from}
                      onChangeText={setFrom}
                    />
                  </View>
                  <Pressable
                    onPress={handleSwap}
                    style={({ pressed }) => [
                      styles.swapBtn,
                      pressed && styles.swapBtnPressed,
                    ]}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={t("swap_label")}
                  >
                    <Icon
                      name="arrow-up-down"
                      size={22}
                      color={DS.actionPrimary}
                    />
                  </Pressable>
                  <View style={styles.routeInputDesktop}>
                    <Input
                      label={t("to_label")}
                      leadingIcon="map-pin"
                      placeholder={t("to_placeholder")}
                      value={to}
                      onChangeText={setTo}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.routeRow}>
                  <View style={styles.routeInputs}>
                    <Input
                      label={t("from_label")}
                      leadingIcon="map-pin"
                      placeholder={t("from_placeholder")}
                      value={from}
                      onChangeText={setFrom}
                    />
                    <Input
                      label={t("to_label")}
                      leadingIcon="map-pin"
                      placeholder={t("to_placeholder")}
                      value={to}
                      onChangeText={setTo}
                    />
                  </View>
                  <Pressable
                    onPress={handleSwap}
                    style={({ pressed }) => [
                      styles.swapBtn,
                      pressed && styles.swapBtnPressed,
                    ]}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={t("swap_label")}
                  >
                    <Icon
                      name="swap-vertical"
                      size={22}
                      color={DS.actionPrimary}
                    />
                  </Pressable>
                </View>
              )}

              {/* PMR switch + search */}
              <View
                style={[
                  styles.plannerFooter,
                  isDesktop && styles.plannerFooterDesktop,
                ]}
              >
                <View style={styles.pmrRow}>
                  <Switch
                    value={pmr}
                    onValueChange={setPmr}
                    trackColor={{
                      false: DS.borderDefault,
                      true: DS.actionPrimary,
                    }}
                    thumbColor={DS.white}
                    accessibilityLabel={t("accessible_label")}
                  />
                  <Text style={styles.pmrLabel}>{t("accessible_label")}</Text>
                </View>
                <Button
                  size="lg"
                  leadingIcon="search"
                  onPress={handleSearch}
                  accessibilityLabel={t("search_label")}
                >
                  {t("search_label")}
                </Button>
              </View>
            </Card>
          </View>
        </View>

        {/* ─── Content wrapper (max-width centred on desktop) ──── */}
        <View style={isDesktop ? pageInner : undefined}>
          {/* ─── Results (after search) ─────────────────────────── */}
          {searched && (
            <View
              style={[styles.section, sectionPad]}
              accessibilityLiveRegion="polite"
            >
              <SectionTitle>{t("results_title")}</SectionTitle>
              <View style={[styles.list, isDesktop && styles.listDesktop]}>
                {JOURNEY_RESULTS.map((r, i) => (
                  <JourneyCard key={i} {...(r as any)} />
                ))}
              </View>
            </View>
          )}

          {/* ─── Traffic status ─────────────────────────────────── */}
          <View style={[styles.section, sectionPad]}>
            <View style={styles.sectionHeader}>
              <SectionTitle>{t("traffic_title")}</SectionTitle>
              <Pressable
                accessible
                accessibilityRole="button"
                accessibilityLabel={t("see_all_lines")}
              >
                <Text style={styles.linkText}>{t("see_all_lines")} →</Text>
              </Pressable>
            </View>
            <View style={[styles.grid, isDesktop && styles.gridTwo]}>
              {TRAFFIC_STATUS.map((s, i) => (
                <DisruptionBanner
                  key={i}
                  mode={s.mode}
                  line={s.line}
                  status={s.status}
                  message={(s as any).message}
                  style={isDesktop ? styles.gridItem : undefined}
                />
              ))}
            </View>
          </View>

          {/* ─── Popular destinations ───────────────────────────── */}
          <View style={[styles.section, sectionPad]}>
            <SectionTitle>{t("popular_title")}</SectionTitle>
            <View style={[styles.grid, isDesktop && styles.gridFour]}>
              {POPULAR_DESTINATIONS.map((p, i) => (
                <Card
                  key={i}
                  interactive
                  accessibilityLabel={`${p.name}. ${p.mins} ${t("from_your_position")} via ${p.mode} ${p.line}`}
                  style={[styles.destCard, isDesktop && styles.gridItem]}
                >
                  <View style={styles.destCardRow}>
                    <LineBadge mode={p.mode} line={p.line} />
                    <Icon name="star" size={20} color={DS.blueInteraction} />
                  </View>
                  <Text style={styles.destName}>{p.name}</Text>
                  <Text style={styles.destMeta}>
                    {p.mins} · {t("from_your_position")}
                  </Text>
                </Card>
              ))}
            </View>
          </View>
        </View>

        {/* ─── Footer ─────────────────────────────────────────── */}
        <View style={styles.footer} role="contentinfo">
          <View
            style={[styles.footerInner, isDesktop && styles.footerInnerDesktop]}
          >
            <View>
              <Text style={styles.footerBrand}>Comutitres</Text>
              <Text style={styles.footerDesc}>{t("footer_desc")}</Text>
            </View>
            <View
              style={[
                styles.footerLinks,
                isDesktop && styles.footerLinksDesktop,
              ]}
            >
              {[
                [
                  t("footer_itineraires"),
                  t("footer_plans"),
                  t("footer_horaires"),
                  t("footer_accessibilite"),
                ],
                [
                  t("footer_navigo"),
                  t("footer_ticket_simple"),
                  t("footer_tarifs_reduits"),
                  t("footer_remboursement"),
                ],
                [
                  t("footer_contact"),
                  t("footer_objets"),
                  t("footer_faq"),
                  t("accessibility_statement"),
                ],
              ].map((col, ci) => (
                <View key={ci} style={styles.footerCol}>
                  {col.map((item, ii) => (
                    <View key={ii} style={styles.footerLink}>
                      <Text style={styles.footerLinkText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.footerCopy}>{t("footer_copyright")}</Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: DS.surfacePage,
  },
  content: {
    flexGrow: 1,
  },
  // Mobile header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space4,
    backgroundColor: DS.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  logo: {
    height: 36,
    width: 88,
  },
  // Hero
  hero: {
    backgroundColor: DS.blueSoft,
    paddingVertical: DS.space8,
  },
  heroInner: {
    paddingHorizontal: DS.space5,
    gap: DS.space4,
  },
  heroInnerDesktop: {
    maxWidth: MaxContentWidth,
    marginHorizontal: "auto" as any,
    paddingHorizontal: DS.space8,
    width: "100%",
  },
  heroTextDesktop: {
    maxWidth: 560,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: DS.textStrong,
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: DS.space2,
  },
  heroTitleDesktop: {
    fontSize: 52,
    lineHeight: 58,
  },
  heroSub: {
    fontSize: 16,
    color: DS.textBody,
    lineHeight: 24,
    marginBottom: DS.space2,
  },
  heroSubDesktop: {
    fontSize: 18,
    lineHeight: 28,
  },
  plannerCard: {
    gap: DS.space4,
  },
  plannerCardDesktop: {
    padding: DS.space6,
  },
  // Mobile route inputs
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: DS.space3,
  },
  routeInputs: {
    flex: 1,
    gap: DS.space3,
  },
  // Desktop route inputs
  routeRowDesktop: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: DS.space3,
  },
  routeInputDesktop: {
    flex: 1,
  },
  swapBtn: {
    width: DS.targetMin,
    height: DS.targetMin,
    borderRadius: DS.radiusSm,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    backgroundColor: DS.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  swapBtnPressed: {
    backgroundColor: DS.bluePale,
    borderColor: DS.actionPrimary,
  },
  plannerFooter: {
    gap: DS.space4,
  },
  plannerFooterDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pmrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  pmrLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: DS.textStrong,
    flex: 1,
  },
  // Sections
  section: {
    gap: DS.space4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: DS.textStrong,
    lineHeight: 28,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "600",
    color: DS.actionPrimary,
  },
  list: {
    gap: DS.space3,
  },
  listDesktop: {
    maxWidth: 760,
  },
  // Grids
  grid: {
    gap: DS.space3,
  },
  gridTwo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.space3,
  },
  gridFour: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.space3,
  },
  gridItem: {
    flex: 1,
    minWidth: 260,
  },
  // Destination cards
  destCard: {
    gap: DS.space3,
  },
  destCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  destName: {
    fontSize: 17,
    fontWeight: "700",
    color: DS.textStrong,
  },
  destMeta: {
    fontSize: 14,
    color: DS.textMuted,
  },
  // Footer
  footer: {
    backgroundColor: DS.surfaceInverse,
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space8,
    gap: DS.space5,
  },
  footerInner: {
    gap: DS.space5,
  },
  footerInnerDesktop: {
    flexDirection: "row",
    gap: DS.space9,
    alignItems: "flex-start",
  },
  footerBrand: {
    fontSize: 20,
    fontWeight: "800",
    color: DS.textInverse,
    marginBottom: DS.space2,
  },
  footerDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
    maxWidth: 280,
  },
  footerLinks: {
    gap: DS.space5,
  },
  footerLinksDesktop: {
    flexDirection: "row",
    flex: 1,
    gap: DS.space6,
  },
  footerCol: {
    gap: DS.space3,
    flex: 1,
  },
  footerLink: {
    minHeight: DS.targetMin,
    justifyContent: "center",
  },
  footerLinkText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 20,
  },
  footerCopy: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.16)",
    paddingTop: DS.space5,
  },
});
