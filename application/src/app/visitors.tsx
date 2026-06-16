import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DESKTOP_BP = 768;

import { Image } from 'expo-image';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { LineBadge } from '@/components/ui/LineBadge';
import { BottomTabInset, DS, MaxContentWidth } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n';

// Static data
const PASSES = {
  fr: [
    {
      id: 'easy', name: 'Navigo Easy', price: '2,50 €', unit: '/ trajet',
      tag: null, desc: 'À la demande. Chargez des tickets t+ sur une carte réutilisable.',
      items: ["Trajets à l'unité", 'Carte rechargeable', 'Bus, métro, tram'],
    },
    {
      id: 'visite', name: 'Paris Visite', price: '29,90 €', unit: '/ 3 jours',
      tag: 'Idéal visiteurs', desc: 'Voyages illimités 1, 2, 3 ou 5 jours avec réductions partenaires.',
      items: ['Trajets illimités', 'Zones 1–3 ou 1–5', 'Réductions visites'],
    },
    {
      id: 'day', name: 'Navigo Jour', price: '8,65 €', unit: '/ jour',
      tag: null, desc: 'Voyages illimités sur une journée selon les zones choisies.',
      items: ['Illimité 1 jour', 'Zones au choix', 'Parfait en excursion'],
    },
    {
      id: 'airport', name: 'Billet aéroport', price: '13,00 €', unit: '/ trajet',
      tag: null, desc: 'Trajet direct entre Paris et les aéroports CDG ou Orly.',
      items: ['CDG & Orly', 'RER / tram inclus', 'Achetez avant le vol'],
    },
  ],
  en: [
    {
      id: 'easy', name: 'Navigo Easy', price: '€2.50', unit: '/ trip',
      tag: null, desc: 'Pay as you go. Load single t+ tickets onto a reusable card.',
      items: ['Single rides', 'Reloadable card', 'Bus, metro, tram'],
    },
    {
      id: 'visite', name: 'Paris Visite', price: '€29.90', unit: '/ 3 days',
      tag: 'Best for visitors', desc: 'Unlimited travel for 1, 2, 3 or 5 days with partner discounts.',
      items: ['Unlimited rides', 'Zones 1–3 or 1–5', 'Attraction discounts'],
    },
    {
      id: 'day', name: 'Navigo Day', price: '€8.65', unit: '/ day',
      tag: null, desc: 'Unlimited travel for a single calendar day across chosen zones.',
      items: ['Unlimited 1 day', 'Choose your zones', 'Great for day trips'],
    },
    {
      id: 'airport', name: 'Airport ticket', price: '€13.00', unit: '/ trip',
      tag: null, desc: 'Direct travel between Paris and CDG or Orly airports.',
      items: ['CDG & Orly', 'RER / tram included', 'Buy before you fly'],
    },
  ],
};

const PLACES = [
  { fr: 'Tour Eiffel', en: 'Eiffel Tower', mode: 'rer' as const, line: 'C', stop: 'Champ de Mars', mins: '18 min' },
  { fr: 'Musée du Louvre', en: 'Louvre Museum', mode: 'metro' as const, line: 1, stop: 'Palais Royal', mins: '12 min' },
  { fr: 'Sacré-Cœur', en: 'Sacré-Cœur', mode: 'metro' as const, line: 12, stop: 'Abbesses', mins: '21 min' },
  { fr: 'Château de Versailles', en: 'Versailles', mode: 'rer' as const, line: 'C', stop: 'Versailles Château', mins: '41 min' },
  { fr: 'Disneyland Paris', en: 'Disneyland Paris', mode: 'rer' as const, line: 'A', stop: 'Marne-la-Vallée', mins: '47 min' },
  { fr: 'Notre-Dame', en: 'Notre-Dame', mode: 'rer' as const, line: 'B', stop: 'Saint-Michel', mins: '15 min' },
];

const AIRPORTS = {
  fr: [
    { name: 'Paris–Charles de Gaulle', mode: 'rer' as const, line: 'B', route: 'RER B vers Paris centre', mins: '~38 min', price: '11,80 €' },
    { name: 'Paris–Orly', mode: 'tram' as const, line: 'T7', route: 'Orlyval + RER, ou Tram', mins: '~35 min', price: '10,30 €' },
    { name: 'Beauvais', mode: 'bus' as const, line: 'EX', route: 'Car express vers Porte Maillot', mins: '~75 min', price: '16,90 €' },
  ],
  en: [
    { name: 'Paris–Charles de Gaulle', mode: 'rer' as const, line: 'B', route: 'RER B to central Paris', mins: '~38 min', price: '€11.80' },
    { name: 'Paris–Orly', mode: 'tram' as const, line: 'T7', route: 'Orlyval + RER, or Tram', mins: '~35 min', price: '€10.30' },
    { name: 'Beauvais', mode: 'bus' as const, line: 'EX', route: 'Express coach to Porte Maillot', mins: '~75 min', price: '€16.90' },
  ],
};

const CONFIDENCE_FEATURES = {
  fr: [
    { icon: 'accessibility', title: 'Trajets accessibles', desc: 'Filtrez les itinéraires PMR à chaque recherche.' },
    { icon: 'globe', title: '6 langues', desc: "Tout le site et l'appli, traduits." },
    { icon: 'ticket', title: 'Sans contact', desc: 'Téléphone ou carte bancaire — sans ticket papier.' },
    { icon: 'info', title: 'Aide 24/7', desc: 'Assistance et signalétique en anglais.' },
  ],
  en: [
    { icon: 'accessibility', title: 'Step-free routes', desc: 'Filter journeys for reduced mobility on every search.' },
    { icon: 'globe', title: '6 languages', desc: 'The whole site and app, translated and ready.' },
    { icon: 'ticket', title: 'Contactless', desc: 'Tap your phone or bank card — no paper ticket needed.' },
    { icon: 'info', title: '24/7 help', desc: 'Live support and clear signage in English.' },
  ],
};

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

export default function VisitorsScreen() {
  const { lang, setLang, t } = useI18n();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;

  const [from, setFrom] = useState('CDG Airport (T2)');
  const [to, setTo] = useState('');
  const [selectedPass, setSelectedPass] = useState('visite');

  const passes = lang === 'en' ? PASSES.en : PASSES.fr;
  const airports = lang === 'en' ? AIRPORTS.en : AIRPORTS.fr;
  const features = lang === 'en' ? CONFIDENCE_FEATURES.en : CONFIDENCE_FEATURES.fr;
  const chips = [t('visitors_chips_cdg'), t('visitors_chips_orly'), t('visitors_chips_eiffel')];

  const sectionPad = isDesktop
    ? { paddingHorizontal: DS.space8, paddingVertical: DS.space8 }
    : { paddingHorizontal: DS.space5, paddingVertical: DS.space6 };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + DS.space8 }]}
    >
      <SafeAreaView edges={Platform.OS === 'web' ? [] : ['top']}>
        {/* ─── Mobile header (hidden on web) ───────────────── */}
        {Platform.OS !== 'web' && (
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/logo/comutitres_v_couleur.svg')}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Comutitres"
            />
            <LanguageSwitcher value={lang} onChange={setLang as any} />
          </View>
        )}

        {/* ─── Hero ────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={[styles.heroInner, isDesktop && styles.heroInnerDesktop]}>
            <View style={styles.kicker} accessible accessibilityRole="text">
              <Icon name="map-pin" size={16} color={DS.actionPrimary} />
              <Text style={styles.kickerText}>{t('visitors_kicker')}</Text>
            </View>

            <Text
              style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}
              accessibilityRole="header"
            >
              {t('visitors_title')}
            </Text>
            <Text style={[styles.heroSub, isDesktop && styles.heroSubDesktop]}>
              {t('visitors_sub')}
            </Text>

            <Card style={[styles.plannerCard, isDesktop && styles.plannerCardDesktop]}>
              <Text style={styles.plannerLabel}>{t('visitors_where')}</Text>
              <View style={isDesktop ? styles.plannerInputsDesktop : styles.plannerInputs}>
                <Input
                  label={t('from_label')}
                  leadingIcon="map-pin"
                  placeholder={t('visitors_from_ph')}
                  value={from}
                  onChangeText={setFrom}
                  style={isDesktop ? { flex: 1 } as any : undefined}
                />
                <Input
                  label={t('to_label')}
                  leadingIcon="map-pin"
                  placeholder={t('visitors_to_ph')}
                  value={to}
                  onChangeText={setTo}
                  style={isDesktop ? { flex: 1 } as any : undefined}
                />
                <Button
                  size="lg"
                  leadingIcon="search"
                  fullWidth={!isDesktop}
                  accessibilityLabel={t('visitors_go')}
                >
                  {t('visitors_go')}
                </Button>
              </View>
              {/* Quick chips */}
              <View style={styles.chips}>
                <Text style={styles.chipsLabel}>{t('visitors_quick')}</Text>
                <View style={styles.chipRow}>
                  {chips.map((c, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setTo(c)}
                      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={c}
                    >
                      <Text style={styles.chipText}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Card>
          </View>
        </View>

        {/* ─── Passes ──────────────────────────────────────── */}
        <View style={[styles.section, sectionPad, isDesktop && styles.sectionCentered]}>
          <SectionTitle>{t('passes_title')}</SectionTitle>
          <Text style={styles.sectionSub}>{t('passes_sub')}</Text>
          <View style={[styles.passesGrid, isDesktop && styles.passesGridDesktop]}>
          {passes.map((p) => {
            const on = selectedPass === p.id;
            return (
              <Card
                key={p.id}
                interactive
                onPress={() => setSelectedPass(p.id)}
                accessibilityLabel={
                  `${p.name}. ${t('passes_from')} ${p.price} ${p.unit}. ${p.desc}. ` +
                  (on ? 'Sélectionné.' : 'Appuyez pour sélectionner.')
                }
                style={[styles.passCard, on && styles.passCardSelected, isDesktop && styles.gridItem]}
              >
                <View style={styles.passTop}>
                  <Icon name="ticket" size={26} color={DS.actionPrimary} />
                  {p.tag && <Badge tone="brand">{p.tag}</Badge>}
                </View>
                <Text style={styles.passName}>{p.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceFrom}>{t('passes_from')} </Text>
                  <Text style={styles.price}>{p.price}</Text>
                  <Text style={styles.priceUnit}> {p.unit}</Text>
                </View>
                <Text style={styles.passDesc}>{p.desc}</Text>
                <View style={styles.passItems}>
                  {p.items.map((item, ii) => (
                    <View key={ii} style={styles.passItem}>
                      <Icon name="check" size={16} color={DS.successText} label="" />
                      <Text style={styles.passItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  variant={on ? 'primary' : 'secondary'}
                  fullWidth
                  accessibilityLabel={`${t('passes_select')} ${p.name}`}
                  onPress={() => setSelectedPass(p.id)}
                >
                  {t('passes_select')}
                </Button>
              </Card>
            );
          })}
          </View>
        </View>

        {/* ─── Top places ──────────────────────────────────── */}
        <View style={styles.sectionTinted}>
          <View style={[styles.section, sectionPad, isDesktop && styles.sectionCentered]}>
            <SectionTitle>{t('places_title')}</SectionTitle>
            <View style={[isDesktop && styles.placesGrid]}>
            {PLACES.map((p, i) => {
              const name = lang === 'en' ? p.en : p.fr;
              return (
                <Card
                  key={i}
                  interactive
                  accessibilityLabel={`${name}. ${p.stop} · ${p.mins}`}
                  style={[styles.placeCard, isDesktop && styles.gridItem]}
                >
                  <LineBadge mode={p.mode} line={p.line} size="lg" />
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{name}</Text>
                    <Text style={styles.placeMeta}>{p.stop} · {p.mins}</Text>
                  </View>
                  <Icon name="arrow-right" size={20} color={DS.actionPrimary} />
                </Card>
              );
            })}
            </View>
          </View>
        </View>

        {/* ─── Airports ────────────────────────────────────── */}
        <View style={[styles.section, sectionPad, isDesktop && styles.sectionCentered]}>
          <SectionTitle>{t('airports_title')}</SectionTitle>
          <View style={[isDesktop && styles.airportsGrid]}>
          {airports.map((a, i) => (
            <Card key={i} style={[styles.airportCard, isDesktop && styles.gridItem]}>
              <View style={styles.airportHeader}>
                <LineBadge mode={a.mode} line={a.line} />
                <Text style={styles.airportName}>{a.name}</Text>
              </View>
              <Text style={styles.airportRoute}>{a.route}</Text>
              <View style={styles.airportMeta}>
                <View style={styles.airportTime}>
                  <Icon name="clock" size={18} color={DS.textMuted} />
                  <Text style={styles.airportMetaText}>{a.mins}</Text>
                </View>
                <Text style={styles.airportPrice}>{a.price}</Text>
              </View>
            </Card>
          ))}
          </View>
        </View>

        {/* ─── Confidence ──────────────────────────────────── */}
        <View style={[styles.section, sectionPad, isDesktop && styles.sectionCentered]}>
          <SectionTitle>{t('confidence_title')}</SectionTitle>
          <View style={[styles.featureGrid, isDesktop && styles.featureGridDesktop]}>
            {features.map((f, i) => (
              <View
                key={i}
                style={styles.feature}
                accessible
                accessibilityLabel={`${f.title}: ${f.desc}`}
              >
                <View
                  style={styles.featureIcon}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  <Icon name={f.icon} size={24} color={DS.actionPrimary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Footer ──────────────────────────────────────── */}
        <View style={styles.footer} accessible accessibilityRole="none">
          <Text style={styles.footerBrand}>Comutitres</Text>
          <Text style={styles.footerCopy}>© 2026 Comutitres · Île-de-France Mobilités</Text>
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginHorizontal: 'auto' as any,
    paddingHorizontal: DS.space8,
    width: '100%',
  },
  heroTitleDesktop: {
    fontSize: 44,
    lineHeight: 50,
  },
  heroSubDesktop: {
    fontSize: 18,
    lineHeight: 28,
  },
  plannerCardDesktop: {
    padding: DS.space6,
  },
  plannerInputsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DS.space3,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
    alignSelf: 'flex-start',
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space2,
  },
  kickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: DS.actionPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: DS.textStrong,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  heroSub: {
    fontSize: 16,
    color: DS.textBody,
    lineHeight: 24,
  },
  plannerCard: {
    gap: DS.space4,
  },
  plannerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.textStrong,
  },
  plannerInputs: {
    gap: DS.space3,
  },
  chips: {
    gap: DS.space2,
  },
  chipsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.space2,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space2,
    backgroundColor: DS.surfaceCard,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipPressed: {
    backgroundColor: DS.bluePale,
    borderColor: DS.actionPrimary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.textStrong,
  },
  // Sections
  section: {
    gap: DS.space4,
  },
  sectionCentered: {
    maxWidth: MaxContentWidth,
    width: '100%',
    marginHorizontal: 'auto' as any,
  },
  sectionTinted: {
    backgroundColor: DS.surfaceTint,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DS.textStrong,
    lineHeight: 28,
  },
  sectionSub: {
    fontSize: 15,
    color: DS.textMuted,
    lineHeight: 22,
    marginTop: -DS.space2,
  },
  passesGrid: {
    gap: DS.space3,
  },
  passesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    flex: 1,
    minWidth: 240,
  },
  // Passes
  passCard: {
    gap: DS.space3,
    borderWidth: 1.5,
    borderColor: DS.borderSubtle,
  },
  passCardSelected: {
    borderColor: DS.actionPrimary,
    shadowColor: DS.actionPrimary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  passTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: DS.space2,
  },
  passName: {
    fontSize: 18,
    fontWeight: '700',
    color: DS.textStrong,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceFrom: {
    fontSize: 13,
    color: DS.textMuted,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: DS.textStrong,
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontSize: 13,
    color: DS.textMuted,
  },
  passDesc: {
    fontSize: 14,
    color: DS.textBody,
    lineHeight: 20,
  },
  passItems: {
    gap: DS.space2,
  },
  passItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
  },
  passItemText: {
    fontSize: 14,
    color: DS.textBody,
  },
  // Places grid
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.space3,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space4,
    padding: DS.space4,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.textStrong,
  },
  placeMeta: {
    fontSize: 13,
    color: DS.textMuted,
    marginTop: 2,
  },
  // Airports grid
  airportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.space3,
  },
  // Airport cards
  airportCard: {
    gap: DS.space3,
  },
  airportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space3,
  },
  airportName: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.textStrong,
    flex: 1,
    flexWrap: 'wrap',
  },
  airportRoute: {
    fontSize: 15,
    color: DS.textBody,
    lineHeight: 20,
  },
  airportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space5,
  },
  airportTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
  },
  airportMetaText: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.textMuted,
  },
  airportPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: DS.textStrong,
    letterSpacing: -0.3,
  },
  // Confidence features
  featureGrid: {
    gap: DS.space5,
  },
  featureGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.space6,
  },
  feature: {
    flexDirection: 'row',
    gap: DS.space4,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: DS.space1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.textStrong,
  },
  featureDesc: {
    fontSize: 14,
    color: DS.textMuted,
    lineHeight: 20,
  },
  // Footer
  footer: {
    backgroundColor: DS.surfaceInverse,
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space6,
    gap: DS.space3,
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: DS.textInverse,
  },
  footerCopy: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
});