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

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { DS, MaxContentWidth } from '@/constants/theme';

const DESKTOP_BP = 768;

// ─── Types & static data ───────────────────────────────────────────────────────

type Section = 'dashboard' | 'subscriptions' | 'billing' | 'history';

const NAV_ITEMS: { id: Section; icon: string; label: string }[] = [
  { id: 'dashboard',     icon: 'star',    label: 'Tableau de bord' },
  { id: 'subscriptions', icon: 'ticket',  label: 'Vos abonnements' },
  { id: 'billing',       icon: 'receipt', label: 'Facturations'    },
  { id: 'history',       icon: 'clock',   label: 'Historique'      },
];

const PASSES = [
  {
    id: '1',
    type: 'NAVIGO MENSUEL',
    zones: 'Zones 1–5',
    status: 'Actif',
    validity: 'Valable jusqu\'au 30 juin 2026',
    renewal: 'renouvellement auto activé',
    price: '86,40 €/mois',
    card: '•••• •••• •••• 4821',
  },
  {
    id: '2',
    type: 'NAVIGO EASY',
    zones: 'Tickets individuels',
    status: 'Actif',
    validity: 'Valable jusqu\'au 31 déc. 2026',
    renewal: null,
    price: 'Solde : 3,20 €',
    card: null,
  },
];

const INVOICES = [
  { id: 'F2026-042', date: '01 juin 2026',   amount: '86,40 €', desc: 'Navigo Mensuel – Zones 1-5', status: 'Payée' },
  { id: 'F2026-031', date: '01 mai 2026',    amount: '86,40 €', desc: 'Navigo Mensuel – Zones 1-5', status: 'Payée' },
  { id: 'F2026-020', date: '01 avr. 2026',   amount: '86,40 €', desc: 'Navigo Mensuel – Zones 1-5', status: 'Payée' },
  { id: 'F2026-009', date: '01 mars 2026',   amount: '86,40 €', desc: 'Navigo Mensuel – Zones 1-5', status: 'Payée' },
];

const HISTORY = [
  { id: 'H1', date: '15 juin 2026', type: 'Validation', desc: 'Métro ligne 1 — Châtelet',       time: '08:04' },
  { id: 'H2', date: '15 juin 2026', type: 'Validation', desc: 'RER A — Gare de Lyon',            time: '08:27' },
  { id: 'H3', date: '14 juin 2026', type: 'Validation', desc: 'Métro ligne 14 — Saint-Lazare',   time: '18:12' },
  { id: 'H4', date: '14 juin 2026', type: 'Validation', desc: 'Métro ligne 6 — Montparnasse',    time: '18:41' },
  { id: 'H5', date: '13 juin 2026', type: 'Recharge',   desc: 'Navigo Easy — +10 tickets',       time: '12:05' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

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

// Main active pass card with gradient background
function ActivePassCard({ pass }: { pass: typeof PASSES[0] }) {
  const gradientStyle = Platform.OS === 'web'
    ? ({ backgroundImage: 'linear-gradient(135deg, #1972D2 0%, #1242A7 50%, #0B1F5E 100%)' } as any)
    : {};

  return (
    <View style={[styles.passCard, gradientStyle]}>
      <View style={styles.passCardTop}>
        <View style={styles.passCardMeta}>
          <Icon name="ticket" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={styles.passCardType}>{pass.type}</Text>
          <Badge tone="success" dot>{pass.status}</Badge>
        </View>
        <Button
          variant="secondary"
          size="sm"
          trailingIcon="arrow-right"
          style={styles.passCardBtn}
        >
          Gérer mon Navigo
        </Button>
      </View>

      <Text style={styles.passZones}>{pass.zones}</Text>
      <Text style={styles.passValidity}>
        {pass.validity} · {pass.renewal}
      </Text>

      <View style={styles.passCardFooter}>
        <Text style={styles.passPrice}>{pass.price}</Text>
        {pass.card && (
          <Text style={styles.passCard_}>CB {pass.card}</Text>
        )}
      </View>
    </View>
  );
}

// Secondary pass card (simpler, white card)
function PassRow({ pass }: { pass: typeof PASSES[0] }) {
  return (
    <View style={styles.passRow}>
      <View style={styles.passRowLeft}>
        <View style={styles.passRowHeader}>
          <Text style={styles.passRowType}>{pass.type}</Text>
          <Badge tone={pass.status === 'Actif' ? 'success' : 'neutral'} dot>
            {pass.status}
          </Badge>
        </View>
        <Text style={styles.passRowZones}>{pass.zones}</Text>
        <Text style={styles.passRowValidity}>{pass.validity}</Text>
      </View>
      <View style={styles.passRowRight}>
        <Text style={styles.passRowPrice}>{pass.price}</Text>
      </View>
    </View>
  );
}

function InvoiceRow({ invoice }: { invoice: typeof INVOICES[0] }) {
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableCellId]}>{invoice.id}</Text>
      <Text style={[styles.tableCell, styles.tableCellDesc]}>{invoice.desc}</Text>
      <Text style={[styles.tableCell, styles.tableCellDate]}>{invoice.date}</Text>
      <Text style={[styles.tableCell, styles.tableCellAmount]}>{invoice.amount}</Text>
      <Badge tone="success">{invoice.status}</Badge>
    </View>
  );
}

function HistoryRow({ entry }: { entry: typeof HISTORY[0] }) {
  const isRecharge = entry.type === 'Recharge';
  return (
    <View style={styles.historyRow}>
      <View style={[styles.historyIcon, isRecharge && styles.historyIconRecharge]}>
        <Icon
          name={isRecharge ? 'creditcard' : 'arrow-right'}
          size={16}
          color={isRecharge ? DS.success : DS.actionPrimary}
        />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyDesc}>{entry.desc}</Text>
        <Text style={styles.historyMeta}>{entry.type} · {entry.date}</Text>
      </View>
      <Text style={styles.historyTime}>{entry.time}</Text>
    </View>
  );
}

// Section header
function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={action}
          style={({ pressed }) => pressed && { opacity: 0.7 }}
        >
          <Text style={styles.sectionAction}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Section content renderers ──────────────────────────────────────────────

function DashboardHome() {
  return (
    <View style={styles.sectionContent}>
      <ActivePassCard pass={PASSES[0]} />

      <SectionHeader title="Vos abonnements" action="Tout voir" />
      <View style={styles.card}>
        {PASSES.map((p, i) => (
          <View key={p.id}>
            <PassRow pass={p} />
            {i < PASSES.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <SectionHeader title="Dernières facturations" action="Tout voir" />
      <View style={styles.card}>
        {INVOICES.slice(0, 2).map((inv, i) => (
          <View key={inv.id}>
            <InvoiceRow invoice={inv} />
            {i < 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );
}

function SubscriptionsView() {
  return (
    <View style={styles.sectionContent}>
      <Text style={styles.viewTitle}>Vos abonnements</Text>
      <Text style={styles.viewSubtitle}>
        Gérez vos titres de transport actifs et renouvelés automatiquement.
      </Text>

      <View style={styles.card}>
        {PASSES.map((p, i) => (
          <View key={p.id}>
            <PassRow pass={p} />
            {i < PASSES.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <Button variant="secondary" size="md" leadingIcon="ticket">
        Ajouter un abonnement
      </Button>
    </View>
  );
}

function BillingView() {
  return (
    <View style={styles.sectionContent}>
      <Text style={styles.viewTitle}>Facturations</Text>
      <Text style={styles.viewSubtitle}>
        Retrouvez l'ensemble de vos factures et justificatifs.
      </Text>

      <View style={styles.card}>
        {INVOICES.map((inv, i) => (
          <View key={inv.id}>
            <InvoiceRow invoice={inv} />
            {i < INVOICES.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <Text style={styles.billingNote}>
        Les factures sont disponibles en téléchargement au format PDF.
      </Text>
    </View>
  );
}

function HistoryView() {
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

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
    >
      <View
        style={[
          styles.layout,
          isDesktop && styles.layoutDesktop,
          { maxWidth: MaxContentWidth, width: '100%', alignSelf: 'center' as any },
        ]}
      >
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        {isDesktop ? (
          <View style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>Mon espace</Text>
            {NAV_ITEMS.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeSection === item.id}
                onPress={() => setActiveSection(item.id)}
              />
            ))}
          </View>
        ) : (
          <ScrollView
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
                active={activeSection === item.id}
                onPress={() => setActiveSection(item.id)}
                horizontal
              />
            ))}
          </ScrollView>
        )}

        {/* ── Main content ─────────────────────────────────────────────── */}
        <View style={[styles.main, isDesktop && styles.mainDesktop]}>
          {/* Greeting */}
          <View style={styles.greeting}>
            <View style={styles.avatarBubble}>
              <Text style={styles.avatarText}>CL</Text>
            </View>
            <View>
              <Text style={styles.greetingText}>Bonjour, Camille</Text>
              <Text style={styles.greetingSubtitle}>Voici votre tableau de bord.</Text>
            </View>
          </View>

          {/* Dynamic section content */}
          {activeSection === 'dashboard'     && <DashboardHome />}
          {activeSection === 'subscriptions' && <SubscriptionsView />}
          {activeSection === 'billing'       && <BillingView />}
          {activeSection === 'history'       && <HistoryView />}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

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

  // Layout
  layout: {
    flexDirection: 'column',
    gap: DS.space4,
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.space6,
  },

  // Sidebar (desktop)
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
    fontWeight: '700',
    color: DS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: DS.space3,
    paddingTop: DS.space2,
    paddingBottom: DS.space3,
  },

  // Nav items (sidebar)
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
    color: DS.textStrong,
    flex: 1,
  },
  navLabelActive: {
    color: DS.actionPrimary,
    fontWeight: '600',
  },

  // Nav items (horizontal mobile)
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
    flexDirection: 'row',
  },
  navItemHoriz: {
    flexDirection: 'column',
    alignItems: 'center',
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

  // Main area
  main: {
    flex: 1,
    gap: DS.space5,
  },
  mainDesktop: {
    gap: DS.space6,
  },

  // Greeting
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space4,
  },
  avatarBubble: {
    width: 52,
    height: 52,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.actionPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: DS.white,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '800',
    color: DS.textStrong,
    lineHeight: 32,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: DS.textMuted,
    marginTop: 2,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: DS.space2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DS.textStrong,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.textLink,
  },

  // Section content wrapper
  sectionContent: {
    gap: DS.space4,
  },

  // White card container
  card: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    overflow: 'hidden',
  },

  divider: {
    height: 1,
    backgroundColor: DS.borderSubtle,
    marginHorizontal: DS.space5,
  },

  // Active pass card (dark blue)
  passCard: {
    backgroundColor: '#1242A7',
    borderRadius: DS.radiusMd,
    padding: DS.space5,
    gap: DS.space2,
  },
  passCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: DS.space3,
    marginBottom: DS.space2,
  },
  passCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
  },
  passCardType: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  passCardBtn: {
    backgroundColor: DS.white,
    borderColor: DS.white,
  },
  passZones: {
    fontSize: 32,
    fontWeight: '800',
    color: DS.white,
    lineHeight: 38,
  },
  passValidity: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  passCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space4,
    marginTop: DS.space2,
    paddingTop: DS.space3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  passPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.white,
  },
  passCard_: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },

  // Pass row (white card)
  passRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: DS.space5,
    gap: DS.space4,
  },
  passRowLeft: {
    flex: 1,
    gap: 4,
  },
  passRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
    flexWrap: 'wrap',
  },
  passRowType: {
    fontSize: 13,
    fontWeight: '700',
    color: DS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  passRowZones: {
    fontSize: 17,
    fontWeight: '700',
    color: DS.textStrong,
  },
  passRowValidity: {
    fontSize: 13,
    color: DS.textMuted,
  },
  passRowRight: {
    alignItems: 'flex-end',
  },
  passRowPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: DS.textStrong,
  },

  // Invoice table row
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space4,
    gap: DS.space3,
    flexWrap: 'wrap',
  },
  tableCell: {
    fontSize: 14,
    color: DS.textBody,
  },
  tableCellId: {
    fontWeight: '600',
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
    fontWeight: '700',
    color: DS.textStrong,
    width: 72,
    textAlign: 'right',
  },

  // History rows
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space4,
    gap: DS.space3,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.infoTint,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    color: DS.textStrong,
  },
  historyMeta: {
    fontSize: 13,
    color: DS.textMuted,
  },
  historyTime: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.textMuted,
  },

  // Section views (subscriptions, billing, history)
  viewTitle: {
    fontSize: 26,
    fontWeight: '800',
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
    fontStyle: 'italic',
  },
});