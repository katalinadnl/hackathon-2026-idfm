import { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisruptionBanner } from "@/components/ui/DisruptionBanner";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { JourneyCard } from "@/components/ui/JourneyCard";
import { LineBadge } from "@/components/ui/LineBadge";
import { BottomTabInset, DS } from "@/constants/theme";
import { pageInner, usePageLayout } from "@/hooks/use-page-layout";

// ─── helpers ──────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function SubLabel({ children }: { children: string }) {
  return <Text style={styles.subLabel}>{children}</Text>;
}

function Row({
  children,
  wrap = true,
}: {
  children: React.ReactNode;
  wrap?: boolean;
}) {
  return <View style={[styles.row, wrap && styles.rowWrap]}>{children}</View>;
}

function Chip({ label, code }: { label: string; code: string }) {
  return (
    <View style={styles.codeChip}>
      <Text style={styles.codeText}>{code}</Text>
      <Text style={styles.codeLabel}>{label}</Text>
    </View>
  );
}

// ─── Colour swatch ────────────────────────────────────────────────────────────

function Swatch({
  name,
  hex,
  dark = false,
}: {
  name: string;
  hex: string;
  dark?: boolean;
}) {
  return (
    <View
      style={styles.swatchWrap}
      accessible
      accessibilityLabel={`${name}: ${hex}`}
    >
      <View style={[styles.swatchColor, { backgroundColor: hex }]}>
        {dark && <Text style={styles.swatchHexDark}>{hex}</Text>}
        {!dark && <Text style={styles.swatchHex}>{hex}</Text>}
      </View>
      <Text style={styles.swatchName}>{name}</Text>
    </View>
  );
}

// ─── Typography specimen ──────────────────────────────────────────────────────

function TypeSpecimen({
  size,
  weight,
  label,
  sample = "Se déplacer, simplement.",
}: {
  size: number;
  weight: "400" | "600" | "700" | "800";
  label: string;
  sample?: string;
}) {
  return (
    <View style={styles.typeRow}>
      <Text style={styles.typeMeta}>{label}</Text>
      <Text
        style={{
          fontSize: size,
          fontWeight: weight,
          color: DS.textStrong,
          lineHeight: size * 1.25,
        }}
      >
        {sample}
      </Text>
    </View>
  );
}

// ─── Spacing specimen ─────────────────────────────────────────────────────────

function SpaceSwatch({ name, value }: { name: string; value: number }) {
  return (
    <View
      style={styles.spaceRow}
      accessible
      accessibilityLabel={`${name}: ${value}px`}
    >
      <Text style={styles.spaceMeta}>
        {name} — {value}px
      </Text>
      <View style={[styles.spaceBar, { width: value }]} />
    </View>
  );
}

// ─── Icon tile ────────────────────────────────────────────────────────────────

function IconTile({ name }: { name: string }) {
  return (
    <View style={styles.iconTile} accessible accessibilityLabel={name}>
      <Icon name={name} size={26} color={DS.actionPrimary} />
      <Text style={styles.iconName}>{name}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function UIKitScreen() {
  const { isDesktop } = usePageLayout();
  const [inputVal, setInputVal] = useState("");
  const [inputErr, setInputErr] = useState("");

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: BottomTabInset + DS.space8 },
      ]}
    >
      <SafeAreaView edges={Platform.OS === "web" ? [] : ["top"]}>
        {/* ── Page header ───────────────────────────────────────── */}
        <View
          style={[
            styles.hero,
            isDesktop && {
              paddingHorizontal: DS.space8,
              paddingVertical: DS.space8,
            },
          ]}
        >
          <View style={isDesktop ? pageInner : undefined}>
            <Badge tone="brand" style={{ marginBottom: DS.space3 }}>
              Design System
            </Badge>
            <Text
              style={[styles.heroTitle, isDesktop && { fontSize: 48 }]}
              accessibilityRole="header"
            >
              Comutitres UI Kit
            </Text>
            <Text style={styles.heroSub}>
              Tous les composants, tokens de couleur, typographie et primitives
              du design system Comutitres / IDF Mobilités.
            </Text>
          </View>
        </View>

        {/* ── Content ───────────────────────────────────────────── */}
        <View style={isDesktop ? pageInner : undefined}>
          {/* ────────────────── COULEURS ────────────────────────── */}
          <Section title="Couleurs">
            <SubLabel>Interaction</SubLabel>
            <Row>
              <Swatch name="blueInteraction" hex={DS.blueInteraction} />
              <Swatch name="blueFocus" hex={DS.blueFocus} dark />
              <Swatch name="blueSoft" hex={DS.blueSoft} />
              <Swatch name="bluePale" hex={DS.bluePale} />
            </Row>

            <SubLabel>Surfaces</SubLabel>
            <Row>
              <Swatch name="surfacePage" hex={DS.surfacePage} />
              <Swatch name="surfaceCard" hex={DS.surfaceCard} />
              <Swatch name="surfaceTint" hex={DS.surfaceTint} />
              <Swatch name="surfaceInverse" hex={DS.surfaceInverse} dark />
            </Row>

            <SubLabel>Textes</SubLabel>
            <Row>
              <Swatch name="textStrong" hex={DS.textStrong} dark />
              <Swatch name="textBody" hex={DS.textBody} dark />
              <Swatch name="textMuted" hex={DS.textMuted} dark />
              <Swatch name="textLink" hex={DS.textLink} dark />
              <Swatch name="textInverse" hex={DS.textInverse} />
            </Row>

            <SubLabel>Succès</SubLabel>
            <Row>
              <Swatch name="success" hex={DS.success} dark />
              <Swatch name="successTint" hex={DS.successTint} />
              <Swatch name="successText" hex={DS.successText} dark />
            </Row>

            <SubLabel>Avertissement</SubLabel>
            <Row>
              <Swatch name="warning" hex={DS.warning} />
              <Swatch name="warningTint" hex={DS.warningTint} />
              <Swatch name="warningText" hex={DS.warningText} dark />
            </Row>

            <SubLabel>Danger</SubLabel>
            <Row>
              <Swatch name="danger" hex={DS.danger} dark />
              <Swatch name="dangerTint" hex={DS.dangerTint} />
              <Swatch name="dangerText" hex={DS.dangerText} dark />
            </Row>

            <SubLabel>Gris</SubLabel>
            <Row>
              <Swatch name="grey900" hex={DS.grey900} dark />
              <Swatch name="grey700" hex={DS.grey700} dark />
              <Swatch name="grey300" hex={DS.grey300} />
              <Swatch name="grey200" hex={DS.grey200} />
              <Swatch name="grey100" hex={DS.grey100} />
            </Row>
          </Section>

          {/* ────────────────── TYPOGRAPHIE ─────────────────────── */}
          <Section title="Typographie">
            <TypeSpecimen size={52} weight="800" label="Display / 52 · 800" />
            <TypeSpecimen size={44} weight="800" label="Display / 44 · 800" />
            <TypeSpecimen size={32} weight="800" label="H1 / 32 · 800" />
            <TypeSpecimen size={28} weight="700" label="H2 / 28 · 700" />
            <TypeSpecimen size={22} weight="700" label="H3 / 22 · 700" />
            <TypeSpecimen size={18} weight="700" label="H4 / 18 · 700" />
            <TypeSpecimen
              size={17}
              weight="600"
              label="Body lg / 17 · 600"
              sample="Planifiez vos trajets en temps réel."
            />
            <TypeSpecimen
              size={16}
              weight="400"
              label="Body md / 16 · 400"
              sample="Planifiez vos trajets en temps réel."
            />
            <TypeSpecimen
              size={15}
              weight="400"
              label="Body sm / 15 · 400"
              sample="Planifiez vos trajets en temps réel."
            />
            <TypeSpecimen
              size={14}
              weight="400"
              label="Caption / 14 · 400"
              sample="Trafic normal sur l'ensemble du réseau."
            />
            <TypeSpecimen
              size={13}
              weight="600"
              label="Label / 13 · 600"
              sample="TRAFIC · RER A · 18 MIN"
            />
          </Section>

          {/* ────────────────── ESPACEMENT ──────────────────────── */}
          <Section title="Espacement">
            <SpaceSwatch name="space1" value={DS.space1} />
            <SpaceSwatch name="space2" value={DS.space2} />
            <SpaceSwatch name="space3" value={DS.space3} />
            <SpaceSwatch name="space4" value={DS.space4} />
            <SpaceSwatch name="space5" value={DS.space5} />
            <SpaceSwatch name="space6" value={DS.space6} />
            <SpaceSwatch name="space7" value={DS.space7} />
            <SpaceSwatch name="space8" value={DS.space8} />
            <SpaceSwatch name="space9" value={DS.space9} />
          </Section>

          {/* ────────────────── RAYONS ──────────────────────────── */}
          <Section title="Rayons de bordure">
            <Row>
              {(
                [
                  ["radiusXs", DS.radiusXs],
                  ["radiusSm", DS.radiusSm],
                  ["radiusMd", DS.radiusMd],
                  ["radiusLg", DS.radiusLg],
                  ["radiusXl", DS.radiusXl],
                  ["radiusPill", DS.radiusPill],
                ] as [string, number][]
              ).map(([name, val]) => (
                <View
                  key={name}
                  style={styles.radiusTile}
                  accessible
                  accessibilityLabel={`${name}: ${val}px`}
                >
                  <View style={[styles.radiusBox, { borderRadius: val }]} />
                  <Text style={styles.radiusLabel}>{name}</Text>
                  <Text style={styles.radiusMeta}>{val}px</Text>
                </View>
              ))}
            </Row>
          </Section>

          {/* ────────────────── ICÔNES ──────────────────────────── */}
          <Section title="Icônes">
            <Text style={styles.sectionDesc}>
              Composant {'<Icon name="…" size={24} color={…} />'}. Utilise
              expo-symbols — SF Symbols sur iOS, Material sur Android et Web.
            </Text>
            <Row>
              {[
                "search",
                "clock",
                "arrow-right",
                "arrow-left",
                "chevron-right",
                "chevron-down",
                "menu",
                "x",
                "globe",
                "map-pin",
                "accessibility",
                "arrow-up-down",
                "star",
                "check",
                "info",
                "alert-triangle",
                "ticket",
                "bus",
                "person",
                "link",
              ].map((n) => (
                <IconTile key={n} name={n} />
              ))}
            </Row>
          </Section>

          {/* ────────────────── BOUTONS ─────────────────────────── */}
          <Section title="Boutons">
            <SubLabel>Variantes (taille md)</SubLabel>
            <Row>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="danger">Danger</Button>
            </Row>

            <SubLabel>Tailles (variante primary)</SubLabel>
            <Row>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>

            <SubLabel>Avec icônes</SubLabel>
            <Row>
              <Button leadingIcon="search">Rechercher</Button>
              <Button variant="secondary" leadingIcon="map-pin">
                Localiser
              </Button>
              <Button variant="tertiary" trailingIcon="arrow-right">
                Voir tout
              </Button>
            </Row>

            <SubLabel>États</SubLabel>
            <Row>
              <Button disabled>Disabled primary</Button>
              <Button variant="secondary" disabled>
                Disabled secondary
              </Button>
            </Row>

            <SubLabel>Pleine largeur</SubLabel>
            <Button fullWidth>Bouton pleine largeur</Button>
          </Section>

          {/* ────────────────── BADGES ──────────────────────────── */}
          <Section title="Badges">
            <SubLabel>Tons disponibles</SubLabel>
            <Row>
              <Badge tone="neutral">Neutre</Badge>
              <Badge tone="info">Info</Badge>
              <Badge tone="success">Succès</Badge>
              <Badge tone="warning">Avertissement</Badge>
              <Badge tone="danger">Danger</Badge>
              <Badge tone="brand">Marque</Badge>
            </Row>

            <SubLabel>Avec point indicateur</SubLabel>
            <Row>
              <Badge tone="success" dot>
                En service
              </Badge>
              <Badge tone="warning" dot>
                Perturbé
              </Badge>
              <Badge tone="danger" dot>
                Interrompu
              </Badge>
            </Row>
          </Section>

          {/* ────────────────── INPUTS ──────────────────────────── */}
          <Section title="Champs de saisie">
            <SubLabel>État par défaut</SubLabel>
            <Input
              label="Départ"
              placeholder="Gare, station ou adresse"
              value={inputVal}
              onChangeText={setInputVal}
            />

            <SubLabel>Avec icône d&apos;en-tête</SubLabel>
            <Input
              label="Destination"
              leadingIcon="map-pin"
              placeholder="Gare, station ou adresse"
              value={inputVal}
              onChangeText={setInputVal}
            />

            <SubLabel>État d&apos;erreur</SubLabel>
            <Input
              label="Code postal"
              placeholder="75001"
              value={inputErr}
              onChangeText={setInputErr}
              error="Ce champ est obligatoire"
            />
          </Section>

          {/* ────────────────── CARTES ──────────────────────────── */}
          <Section title="Cartes">
            <SubLabel>Carte statique</SubLabel>
            <Card>
              <Text style={styles.cardDemoTitle}>Carte de contenu</Text>
              <Text style={styles.cardDemoBody}>
                Les cartes statiques structurent le contenu sans déclencher
                d&apos;action au clic.
              </Text>
            </Card>

            <SubLabel>Carte interactive</SubLabel>
            <Card interactive accessibilityLabel="Exemple de carte interactive">
              <Text style={styles.cardDemoTitle}>Carte interactive</Text>
              <Text style={styles.cardDemoBody}>
                La carte entière est une zone de clic. Utiliser pour les listes
                de destinations ou de lignes.
              </Text>
              <Icon name="arrow-right" size={20} color={DS.actionPrimary} />
            </Card>
          </Section>

          {/* ────────────────── BADGES DE LIGNES ────────────────── */}
          <Section title="Badges de lignes">
            <SubLabel>Métro</SubLabel>
            <Row>
              {(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as number[]
              ).map((n) => (
                <LineBadge key={n} mode="metro" line={n} size="md" />
              ))}
            </Row>

            <SubLabel>RER</SubLabel>
            <Row>
              {(["A", "B", "C", "D", "E"] as string[]).map((l) => (
                <LineBadge key={l} mode="rer" line={l} size="md" />
              ))}
            </Row>

            <SubLabel>Tram & Bus</SubLabel>
            <Row>
              <LineBadge mode="tram" line="T1" size="md" />
              <LineBadge mode="tram" line="T2" size="md" />
              <LineBadge mode="tram" line="T7" size="md" />
              <LineBadge mode="bus" line="91" size="md" />
              <LineBadge mode="bus" line="EX" size="md" />
            </Row>

            <SubLabel>Tailles</SubLabel>
            <Row>
              <LineBadge mode="metro" line={1} size="sm" />
              <LineBadge mode="metro" line={1} size="md" />
              <LineBadge mode="metro" line={1} size="lg" />
            </Row>

            <SubLabel>Modes (badges génériques)</SubLabel>
            <Row>
              <LineBadge mode="metro" line="M" size="md" />
              <LineBadge mode="rer" line="R" size="md" />
              <LineBadge mode="train" line="T" size="md" />
              <LineBadge mode="tram" line="T" size="md" />
              <LineBadge mode="bus" line="B" size="md" />
              <LineBadge mode="noctilien" line="N" size="md" />
              <LineBadge mode="walk" line="~" size="md" />
            </Row>
          </Section>

          {/* ────────────────── BANNIÈRES TRAFIC ────────────────── */}
          <Section title="Bannières de trafic">
            <SubLabel>Trafic normal</SubLabel>
            <DisruptionBanner mode="metro" line={1} status="normal" />

            <SubLabel>Trafic perturbé (mineur)</SubLabel>
            <DisruptionBanner
              mode="rer"
              line="B"
              status="minor"
              message="Temps d'attente prolongés sur l'ensemble de la ligne."
            />

            <SubLabel>Trafic interrompu (majeur)</SubLabel>
            <DisruptionBanner
              mode="rer"
              line="A"
              status="major"
              message="Interruption totale entre Châtelet et Nation jusqu'à 18h00."
            />

            <SubLabel>Sans badge de ligne</SubLabel>
            <DisruptionBanner
              status="minor"
              message="Grève nationale — service réduit sur l'ensemble du réseau."
            />
          </Section>

          {/* ────────────────── CARTE D'ITINÉRAIRE ──────────────── */}
          <Section title="Carte d'itinéraire">
            <SubLabel>Itinéraire recommandé (PMR)</SubLabel>
            <JourneyCard
              depart="08:04"
              arrive="08:27"
              duration="23 min"
              recommended
              accessible
              legs={[
                { walk: 4 },
                { mode: "metro", line: 1 },
                { mode: "rer", line: "A" },
                { walk: 3 },
              ]}
            />

            <SubLabel>Itinéraire standard</SubLabel>
            <JourneyCard
              depart="08:09"
              arrive="08:38"
              duration="29 min"
              legs={[
                { walk: 2 },
                { mode: "metro", line: 14 },
                { mode: "metro", line: 6 },
                { walk: 5 },
              ]}
            />

            <SubLabel>Bus + métro</SubLabel>
            <JourneyCard
              depart="08:12"
              arrive="08:44"
              duration="32 min"
              accessible
              legs={[
                { walk: 6 },
                { mode: "bus", line: "91" },
                { mode: "metro", line: 4 },
                { walk: 2 },
              ]}
            />
          </Section>

          {/* ────────────────── TOKENS RÉFÉRENCE ───────────────── */}
          <Section title="Tokens de référence rapide">
            <SubLabel>Couleurs d&apos;action</SubLabel>
            <Row>
              <Chip label="actionPrimary" code={DS.actionPrimary} />
              <Chip label="actionPrimaryHover" code={DS.actionPrimaryHover} />
              <Chip label="actionPrimaryActive" code={DS.actionPrimaryActive} />
            </Row>

            <SubLabel>Bordures</SubLabel>
            <Row>
              <Chip label="borderSubtle" code={DS.borderSubtle} />
              <Chip label="borderDefault" code={DS.borderDefault} />
              <Chip label="borderBrand" code={DS.borderBrand} />
            </Row>

            <SubLabel>Focus (accessibilité)</SubLabel>
            <Row>
              <Chip label="focusRing" code={DS.focusRing} />
              <Chip label="targetMin" code={`${DS.targetMin}px`} />
            </Row>
          </Section>
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
  hero: {
    backgroundColor: DS.surfaceInverse,
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space8,
    gap: DS.space3,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: DS.textInverse,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: DS.space2,
  },
  heroSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space6,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
    gap: DS.space4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: DS.textStrong,
    letterSpacing: -0.4,
  },
  sectionDesc: {
    fontSize: 13,
    color: DS.textMuted,
    lineHeight: 20,
    fontFamily: "monospace",
    backgroundColor: DS.grey200,
    padding: DS.space3,
    borderRadius: DS.radiusSm,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: DS.space2,
  },
  row: {
    flexDirection: "row",
    gap: DS.space3,
  },
  rowWrap: {
    flexWrap: "wrap",
  },
  // Colour swatches
  swatchWrap: {
    gap: DS.space1,
    minWidth: 80,
  },
  swatchColor: {
    width: 80,
    height: 52,
    borderRadius: DS.radiusSm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  swatchHex: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(0,0,0,0.5)",
    fontFamily: "monospace",
  },
  swatchHexDark: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    fontFamily: "monospace",
  },
  swatchName: {
    fontSize: 10,
    fontWeight: "600",
    color: DS.textMuted,
    fontFamily: "monospace",
  },
  // Typography
  typeRow: {
    gap: DS.space1,
    paddingBottom: DS.space3,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  typeMeta: {
    fontSize: 11,
    fontWeight: "600",
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "monospace",
  },
  // Spacing
  spaceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  spaceMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: DS.textMuted,
    fontFamily: "monospace",
    width: 160,
  },
  spaceBar: {
    height: 8,
    backgroundColor: DS.actionPrimary,
    borderRadius: DS.radiusPill,
  },
  // Radius
  radiusTile: {
    alignItems: "center",
    gap: DS.space1,
    minWidth: 72,
  },
  radiusBox: {
    width: 56,
    height: 56,
    backgroundColor: DS.blueSoft,
    borderWidth: 2,
    borderColor: DS.actionPrimary,
  },
  radiusLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: DS.textStrong,
    fontFamily: "monospace",
  },
  radiusMeta: {
    fontSize: 10,
    color: DS.textMuted,
  },
  // Icons
  iconTile: {
    alignItems: "center",
    gap: DS.space1,
    width: 72,
    padding: DS.space2,
  },
  iconName: {
    fontSize: 10,
    color: DS.textMuted,
    textAlign: "center",
    fontFamily: "monospace",
  },
  // Cards demo
  cardDemoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: DS.textStrong,
    marginBottom: DS.space1,
  },
  cardDemoBody: {
    fontSize: 14,
    color: DS.textMuted,
    lineHeight: 20,
  },
  // Code chips
  codeChip: {
    backgroundColor: DS.surfaceCard,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    borderRadius: DS.radiusSm,
    padding: DS.space3,
    gap: DS.space1,
    minWidth: 160,
  },
  codeText: {
    fontSize: 13,
    fontWeight: "700",
    color: DS.textStrong,
    fontFamily: "monospace",
  },
  codeLabel: {
    fontSize: 11,
    color: DS.textMuted,
    fontFamily: "monospace",
  },
});
