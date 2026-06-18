import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useNetworkStatus } from '@/hooks/use-network-status';
import { pageInner, usePageLayout } from '@/hooks/use-page-layout';

// ─── Static data ──────────────────────────────────────────────────────────────

const PASSES = {
  fr: [
    {
      id: 'visite', name: 'Paris Visite', price: '29,90 €', unit: '/ 3 jours',
      tag: 'Idéal visiteurs', recommended: true,
      desc: 'Voyages illimités 1, 2, 3 ou 5 jours avec réductions partenaires.',
      items: ['Trajets illimités', 'Zones 1–3 ou 1–5', 'Réductions musées'],
    },
    {
      id: 'easy', name: 'Navigo Easy', price: '2,50 €', unit: '/ trajet',
      tag: null, recommended: false,
      desc: 'À la demande. Chargez des tickets t+ sur une carte réutilisable.',
      items: ["Trajets à l'unité", 'Carte rechargeable', 'Bus, métro, tram'],
    },
    {
      id: 'day', name: 'Navigo Jour', price: '8,65 €', unit: '/ jour',
      tag: null, recommended: false,
      desc: 'Voyages illimités sur une journée selon les zones choisies.',
      items: ['Illimité 1 jour', 'Zones au choix', 'Parfait en excursion'],
    },
    {
      id: 'airport', name: 'Billet aéroport', price: '13,00 €', unit: '/ trajet',
      tag: null, recommended: false,
      desc: 'Trajet direct entre Paris et les aéroports CDG ou Orly.',
      items: ['CDG & Orly', 'RER / tram inclus', 'Achetez avant le vol'],
    },
  ],
  en: [
    {
      id: 'visite', name: 'Paris Visite', price: '€29.90', unit: '/ 3 days',
      tag: 'Best for visitors', recommended: true,
      desc: 'Unlimited travel for 1, 2, 3 or 5 days with partner discounts.',
      items: ['Unlimited rides', 'Zones 1–3 or 1–5', 'Museum discounts'],
    },
    {
      id: 'easy', name: 'Navigo Easy', price: '€2.50', unit: '/ trip',
      tag: null, recommended: false,
      desc: 'Pay as you go. Load single t+ tickets onto a reusable card.',
      items: ['Single rides', 'Reloadable card', 'Bus, metro, tram'],
    },
    {
      id: 'day', name: 'Navigo Day', price: '€8.65', unit: '/ day',
      tag: null, recommended: false,
      desc: 'Unlimited travel for a single calendar day across chosen zones.',
      items: ['Unlimited 1 day', 'Choose your zones', 'Great for day trips'],
    },
    {
      id: 'airport', name: 'Airport ticket', price: '€13.00', unit: '/ trip',
      tag: null, recommended: false,
      desc: 'Direct travel between Paris and CDG or Orly airports.',
      items: ['CDG & Orly', 'RER / tram included', 'Buy before you fly'],
    },
  ],
};

const PLACES = [
  { fr: 'Tour Eiffel',          en: 'Eiffel Tower',      mode: 'rer' as const,   line: 'C', stop: 'Champ de Mars',       mins: '18 min' },
  { fr: 'Musée du Louvre',      en: 'Louvre Museum',     mode: 'metro' as const, line: 1,   stop: 'Palais Royal',          mins: '12 min' },
  { fr: 'Sacré-Cœur',          en: 'Sacré-Cœur',        mode: 'metro' as const, line: 12,  stop: 'Abbesses',              mins: '21 min' },
  { fr: 'Château de Versailles',en: 'Versailles',         mode: 'rer' as const,   line: 'C', stop: 'Versailles Château',   mins: '41 min' },
  { fr: 'Disneyland Paris',     en: 'Disneyland Paris',  mode: 'rer' as const,   line: 'A', stop: 'Marne-la-Vallée',      mins: '47 min' },
  { fr: 'Notre-Dame',           en: 'Notre-Dame',        mode: 'rer' as const,   line: 'B', stop: 'Saint-Michel',          mins: '15 min' },
];

const AIRPORTS = {
  fr: [
    { name: 'Paris–Charles de Gaulle', mode: 'rer' as const,  line: 'B',  route: 'RER B vers Paris centre', mins: '~38 min', price: '11,80 €' },
    { name: 'Paris–Orly',              mode: 'tram' as const, line: 'T7', route: 'Orlyval + RER, ou Tram',  mins: '~35 min', price: '10,30 €' },
    { name: 'Beauvais',                mode: 'bus' as const,  line: 'EX', route: 'Car express Porte Maillot',mins: '~75 min', price: '16,90 €' },
  ],
  en: [
    { name: 'Paris–Charles de Gaulle', mode: 'rer' as const,  line: 'B',  route: 'RER B to central Paris',  mins: '~38 min', price: '€11.80' },
    { name: 'Paris–Orly',              mode: 'tram' as const, line: 'T7', route: 'Orlyval + RER, or Tram',  mins: '~35 min', price: '€10.30' },
    { name: 'Beauvais',                mode: 'bus' as const,  line: 'EX', route: 'Express to Porte Maillot', mins: '~75 min', price: '€16.90' },
  ],
};

const CONFIDENCE_FEATURES = {
  fr: [
    { icon: 'accessibility', title: 'Trajets accessibles',  desc: 'Filtrez les itinéraires PMR à chaque recherche.' },
    { icon: 'globe',         title: '6 langues',            desc: "Tout le site et l'appli, traduits." },
    { icon: 'ticket',        title: 'Sans contact',         desc: 'Téléphone ou carte bancaire — sans ticket papier.' },
    { icon: 'info',          title: 'Aide 24/7',            desc: 'Assistance et signalétique en anglais.' },
  ],
  en: [
    { icon: 'accessibility', title: 'Step-free routes',     desc: 'Filter journeys for reduced mobility on every search.' },
    { icon: 'globe',         title: '6 languages',          desc: 'The whole site and app, translated and ready.' },
    { icon: 'ticket',        title: 'Contactless',          desc: 'Tap your phone or bank card — no paper ticket needed.' },
    { icon: 'info',          title: '24/7 help',            desc: 'Live support and clear signage in English.' },
  ],
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle} role="heading" aria-level={2}>
      {children}
    </Text>
  );
}

function NetworkStatusBar({ lang }: { lang: string }) {
  const status = useNetworkStatus();
  if (!status) return null;

  const isNormal = status.status === 'normal';
  const message = lang === 'en' ? status.messageEn : status.message;
  const time = new Date(status.updatedAt).toLocaleTimeString(
    lang === 'en' ? 'en-GB' : 'fr-FR',
    { hour: '2-digit', minute: '2-digit' }
  );
  const label = lang === 'en' ? `Updated at ${time}` : `Mis à jour à ${time}`;

  return (
    <View
      style={[styles.statusBar, isNormal ? styles.statusBarNormal : styles.statusBarWarning]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${message}. ${label}`}
    >
      <View style={[styles.statusDot, isNormal ? styles.statusDotNormal : styles.statusDotWarning]} />
      <Text style={[styles.statusMessage, isNormal ? styles.statusMessageNormal : styles.statusMessageWarning]}>
        {message}
      </Text>
      <Text style={styles.statusTime}>{label}</Text>
    </View>
  );
}

function HowToTravel({ lang }: { lang: string }) {
  const steps =
    lang === 'en'
      ? [
          { num: '1', icon: 'ticket',     title: 'Buy your ticket',      desc: 'In this app, at any station machine, or tap your bank card or phone directly at the gate.' },
          { num: '2', icon: 'checkmark',  title: 'Tap at every boarding', desc: 'Hold your card, phone or ticket near the reader. A green beep means you\'re in.' },
          { num: '3', icon: 'map-pin',    title: 'Travel freely',         desc: 'Metro, RER, bus, tram, regional rail — the same ticket takes you everywhere.' },
        ]
      : [
          { num: '1', icon: 'ticket',     title: 'Achetez votre titre',   desc: "Dans l'appli, à une borne en station ou avec votre carte bancaire sans contact." },
          { num: '2', icon: 'checkmark',  title: 'Validez à chaque montée', desc: 'Posez carte ou téléphone sur le valideur — un bip vert confirme.' },
          { num: '3', icon: 'map-pin',    title: 'Voyagez librement',     desc: 'Métro, RER, bus, tram, train — le même titre vous emmène partout en Île-de-France.' },
        ];

  return (
    <View style={styles.howSteps}>
      {steps.map((s) => (
        <View key={s.num} style={styles.howStep} accessible accessibilityLabel={`Étape ${s.num}: ${s.title}. ${s.desc}`}>
          <View style={styles.howStepLeft}>
            <View style={styles.howNum}>
              <Text style={styles.howNumText}>{s.num}</Text>
            </View>
            <View style={styles.howLine} />
          </View>
          <View style={styles.howContent}>
            <View style={styles.howIconWrap}>
              <Icon name={s.icon} size={22} color={DS.actionPrimary} />
            </View>
            <Text style={styles.howStepTitle}>{s.title}</Text>
            <Text style={styles.howStepDesc}>{s.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqItem}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.faqQuestion, pressed && styles.faqQuestionPressed]}
        accessible
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={question}
        accessibilityHint={open ? 'Appuyez pour fermer la réponse' : 'Appuyez pour afficher la réponse'}
        hitSlop={8}
      >
        <Text style={styles.faqQuestionText}>{question}</Text>
        <Icon
          name={open ? 'chevron-down' : 'chevron-right'}
          size={20}
          color={DS.actionPrimary}
        />
      </Pressable>
      {open && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function VisitorsScreen() {
  const { lang, setLang, t } = useI18n();
  const { isDesktop, hPad } = usePageLayout();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedPass, setSelectedPass] = useState('visite');

  const passes = lang === 'en' ? PASSES.en : PASSES.fr;
  const airports = lang === 'en' ? AIRPORTS.en : AIRPORTS.fr;
  const features = lang === 'en' ? CONFIDENCE_FEATURES.en : CONFIDENCE_FEATURES.fr;
  const chips = [t('visitors_chips_cdg'), t('visitors_chips_orly'), t('visitors_chips_eiffel')];

  const faqItems = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
    { q: t('faq_q5'), a: t('faq_a5') },
  ];

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = lang === 'en' ? 'Visitors – Comutitres' : 'Visiteurs – Comutitres';
    }
  }, [lang]);

  const sectionPad = {
    paddingHorizontal: hPad,
    paddingVertical: isDesktop ? DS.space8 : DS.space7,
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + DS.space8 }]}
    >
      <SafeAreaView edges={Platform.OS === 'web' ? [] : ['top']}>

        {/* ─── Mobile header ───────────────────────────────────── */}
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

        {/* ─── Hero ────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={[styles.heroInner, isDesktop && styles.heroInnerDesktop]}>

            {/* Kicker pill */}
            <View style={styles.kicker} accessible accessibilityRole="text">
              <Icon name="map-pin" size={14} color={DS.actionPrimary} />
              <Text style={styles.kickerText}>{t('visitors_kicker')}</Text>
            </View>

            {/* Title */}
            <Text
              style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}
              role="heading"
              aria-level={1}
            >
              {t('visitors_title')}
            </Text>
            <Text style={[styles.heroSub, isDesktop && styles.heroSubDesktop]}>
              {t('visitors_sub')}
            </Text>

            {/* Stat pills */}
            <View style={styles.statRow} role="list">
              {[t('stat_languages'), t('stat_no_account'), t('stat_network')].map((s) => (
                <View key={s} style={styles.statPill} role="listitem">
                  <Icon name="check" size={14} color={DS.success} />
                  <Text style={styles.statText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Journey planner */}
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

        {/* ─── Network status (API) ─────────────────────────────── */}
        <NetworkStatusBar lang={lang} />

        {/* ─── How to travel (senior-friendly) ─────────────────── */}
        <View style={styles.howSection}>
          <View style={[styles.sectionInner, isDesktop && pageInner, sectionPad]}>
            <SectionTitle>{t('how_title')}</SectionTitle>
            <Text style={styles.sectionSub}>{t('how_sub')}</Text>
            <HowToTravel lang={lang} />
          </View>
        </View>

        {/* ─── Passes ──────────────────────────────────────────── */}
        <View style={[styles.sectionInner, isDesktop && pageInner, sectionPad]}>
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
                    `${p.name}. ${t('passes_from')} ${p.price} ${p.unit}. ${p.desc}.` +
                    (on ? ' Sélectionné.' : ' Appuyez pour sélectionner.')
                  }
                  style={[
                    styles.passCard,
                    on && styles.passCardSelected,
                    p.recommended && styles.passCardRecommended,
                    isDesktop && styles.gridItem,
                  ]}
                >
                  {p.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>
                        {lang === 'en' ? 'Recommended' : 'Recommandé'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.passTop}>
                    <View style={[styles.passIconWrap, on && styles.passIconWrapActive]}>
                      <Icon name="ticket" size={24} color={on ? DS.white : DS.actionPrimary} />
                    </View>
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
                  <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                    <Button
                      variant={on ? 'primary' : 'secondary'}
                      fullWidth
                      onPress={() => setSelectedPass(p.id)}
                    >
                      {t('passes_select')}
                    </Button>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>

        {/* ─── Top places ──────────────────────────────────────── */}
        <View style={styles.sectionTinted}>
          <View style={[styles.sectionInner, isDesktop && pageInner, sectionPad]}>
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
                      <Text style={styles.placeMeta}>{p.stop}</Text>
                    </View>
                    <View style={styles.placeDuration}>
                      <Icon name="clock" size={14} color={DS.textMuted} />
                      <Text style={styles.placeMins}>{p.mins}</Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        </View>

        {/* ─── Airports ────────────────────────────────────────── */}
        <View style={[styles.sectionInner, isDesktop && pageInner, sectionPad]}>
          <SectionTitle>{t('airports_title')}</SectionTitle>
          <View style={[isDesktop && styles.airportsGrid]}>
            {airports.map((a, i) => (
              <Card
                key={i}
                style={[styles.airportCard, isDesktop && styles.gridItem]}
                accessibilityLabel={`${a.name}. ${a.route}. Durée : ${a.mins}. Prix : ${a.price}`}
              >
                <View style={styles.airportHeader}>
                  <LineBadge mode={a.mode} line={a.line} />
                  <Text style={styles.airportName}>{a.name}</Text>
                </View>
                <Text style={styles.airportRoute}>{a.route}</Text>
                <View style={styles.airportMeta}>
                  <View style={styles.airportTime}>
                    <Icon name="clock" size={16} color={DS.textMuted} />
                    <Text style={styles.airportMetaText}>{a.mins}</Text>
                  </View>
                  <Text style={styles.airportPrice}>{a.price}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* ─── FAQ ─────────────────────────────────────────────── */}
        <View style={styles.sectionTinted}>
          <View style={[styles.sectionInner, isDesktop && pageInner, sectionPad]}>
            <SectionTitle>{t('faq_title')}</SectionTitle>
            <View style={styles.faqList}>
              {faqItems.map((item, i) => (
                <FaqItem key={i} question={item.q} answer={item.a} />
              ))}
            </View>
          </View>
        </View>

        {/* ─── Confidence ──────────────────────────────────────── */}
        <View style={[styles.sectionInner, isDesktop && pageInner, sectionPad]}>
          <SectionTitle>{t('confidence_title')}</SectionTitle>
          <View style={[styles.featureGrid, isDesktop && styles.featureGridDesktop]}>
            {features.map((f, i) => (
              <View
                key={i}
                style={[styles.feature, isDesktop && styles.featureDesktop]}
                accessible
                accessibilityLabel={`${f.title}: ${f.desc}`}
              >
                <View
                  style={styles.featureIcon}
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                >
                  <Icon name={f.icon} size={26} color={DS.actionPrimary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Footer ──────────────────────────────────────────── */}
        <View style={styles.footer} role="contentinfo">
          <Text style={styles.footerBrand}>Comutitres</Text>
          <Text style={styles.footerCopy}>© 2026 Comutitres · Île-de-France Mobilités</Text>
        </View>

      </SafeAreaView>
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

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
    paddingVertical: DS.space9,
  },
  heroInner: {
    paddingHorizontal: DS.space5,
    gap: DS.space5,
  },
  heroInnerDesktop: {
    maxWidth: MaxContentWidth,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: DS.space8,
    width: '100%',
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
    alignSelf: 'flex-start',
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space3,
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
    fontSize: 32,
    fontWeight: '800',
    color: DS.textStrong,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  heroTitleDesktop: {
    fontSize: 48,
    lineHeight: 56,
  },
  heroSub: {
    fontSize: 17,
    color: DS.textBody,
    lineHeight: 26,
  },
  heroSubDesktop: {
    fontSize: 19,
    lineHeight: 30,
    maxWidth: 560,
  },

  // Stat pills
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.space2,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space3,
    paddingVertical: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.textStrong,
  },

  // Planner card
  plannerCard: {
    gap: DS.space4,
  },
  plannerCardDesktop: {
    padding: DS.space6,
  },
  plannerLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: DS.textStrong,
  },
  plannerInputs: {
    gap: DS.space3,
  },
  plannerInputsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    minHeight: DS.targetMin,
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

  // Network status bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space3,
    flexWrap: 'wrap',
  },
  statusBarNormal: {
    backgroundColor: DS.successTint,
  },
  statusBarWarning: {
    backgroundColor: DS.warningTint,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: DS.radiusPill,
    flexShrink: 0,
  },
  statusDotNormal: {
    backgroundColor: DS.success,
  },
  statusDotWarning: {
    backgroundColor: DS.warning,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statusMessageNormal: {
    color: DS.successText,
  },
  statusMessageWarning: {
    color: DS.warningText,
  },
  statusTime: {
    fontSize: 12,
    color: DS.textMuted,
  },

  // How to travel
  howSection: {
    backgroundColor: DS.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  howSteps: {
    gap: DS.space6,
    marginTop: DS.space2,
  },
  howStep: {
    flexDirection: 'row',
    gap: DS.space4,
    alignItems: 'flex-start',
  },
  howStepLeft: {
    alignItems: 'center',
    flexShrink: 0,
  },
  howNum: {
    width: 48,
    height: 48,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.actionPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  howNumText: {
    fontSize: 22,
    fontWeight: '800',
    color: DS.white,
  },
  howLine: {
    width: 2,
    flex: 1,
    minHeight: 16,
    backgroundColor: DS.borderSubtle,
    marginTop: DS.space2,
  },
  howContent: {
    flex: 1,
    gap: DS.space2,
    paddingBottom: DS.space3,
  },
  howIconWrap: {
    width: 44,
    height: 44,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.infoTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howStepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DS.textStrong,
  },
  howStepDesc: {
    fontSize: 16,
    color: DS.textBody,
    lineHeight: 24,
  },

  // Sections
  sectionInner: {
    gap: DS.space5,
  },
  sectionTinted: {
    backgroundColor: DS.surfaceTint,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: DS.textStrong,
    lineHeight: 32,
  },
  sectionSub: {
    fontSize: 16,
    color: DS.textMuted,
    lineHeight: 24,
    marginTop: -DS.space3,
  },

  // Passes
  passesGrid: {
    gap: DS.space4,
  },
  passesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.space4,
  },
  gridItem: {
    flex: 1,
    minWidth: 240,
  },
  passCard: {
    gap: DS.space3,
    borderWidth: 1.5,
    borderColor: DS.borderSubtle,
    overflow: 'visible',
  },
  passCardSelected: {
    borderColor: DS.actionPrimary,
    shadowColor: DS.actionPrimary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  passCardRecommended: {
    borderColor: DS.actionPrimary,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: DS.actionPrimary,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space3,
    paddingVertical: 4,
    marginBottom: -DS.space1,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: DS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  passTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.space2,
  },
  passIconWrap: {
    width: 44,
    height: 44,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.infoTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passIconWrapActive: {
    backgroundColor: DS.actionPrimary,
  },
  passName: {
    fontSize: 19,
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
    fontSize: 26,
    fontWeight: '800',
    color: DS.textStrong,
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontSize: 13,
    color: DS.textMuted,
  },
  passDesc: {
    fontSize: 15,
    color: DS.textBody,
    lineHeight: 22,
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
    fontSize: 15,
    color: DS.textBody,
  },

  // Places
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.space3,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space4,
    paddingVertical: DS.space4,
    paddingHorizontal: DS.space4,
  },
  placeInfo: {
    flex: 1,
    gap: 3,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '700',
    color: DS.textStrong,
  },
  placeMeta: {
    fontSize: 14,
    color: DS.textMuted,
  },
  placeDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeMins: {
    fontSize: 14,
    fontWeight: '700',
    color: DS.textMuted,
  },

  // Airports
  airportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.space4,
  },
  airportCard: {
    gap: DS.space3,
  },
  airportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space3,
  },
  airportName: {
    fontSize: 17,
    fontWeight: '700',
    color: DS.textStrong,
    flex: 1,
    flexWrap: 'wrap',
  },
  airportRoute: {
    fontSize: 16,
    color: DS.textBody,
    lineHeight: 22,
  },
  airportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space5,
    marginTop: DS.space1,
  },
  airportTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
  },
  airportMetaText: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.textMuted,
  },
  airportPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: DS.textStrong,
  },

  // FAQ
  faqList: {
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.surfaceCard,
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space4,
    minHeight: DS.targetMin + 8,
    gap: DS.space3,
  },
  faqQuestionPressed: {
    backgroundColor: DS.surfaceTint,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: DS.textStrong,
    flex: 1,
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: DS.space5,
    paddingBottom: DS.space5,
    paddingTop: DS.space1,
  },
  faqAnswerText: {
    fontSize: 16,
    color: DS.textBody,
    lineHeight: 25,
  },

  // Confidence features
  featureGrid: {
    gap: DS.space6,
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
  featureDesktop: {
    flex: 1,
    minWidth: 200,
  },
  featureIcon: {
    width: 52,
    height: 52,
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
    fontSize: 17,
    fontWeight: '700',
    color: DS.textStrong,
  },
  featureDesc: {
    fontSize: 15,
    color: DS.textMuted,
    lineHeight: 22,
  },

  // Footer
  footer: {
    backgroundColor: DS.surfaceInverse,
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space7,
    gap: DS.space3,
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 20,
    fontWeight: '800',
    color: DS.textInverse,
  },
  footerCopy: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});