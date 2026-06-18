import { StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";

type EventType =
  | "subscription_renewed"
  | "subscription_changed"
  | "subscription_cancelled"
  | "payment_method_added"
  | "payment_method_updated"
  | "profile_updated"
  | "account_created";

const EVENT_CONFIG: Record<
  EventType,
  { icon: string; iconBg: string; iconColor: string; label: string }
> = {
  subscription_renewed: {
    icon: "checkmark",
    iconBg: DS.successTint,
    iconColor: DS.success,
    label: "Abonnement renouvelé",
  },
  subscription_changed: {
    icon: "arrow-right",
    iconBg: DS.infoTint,
    iconColor: DS.actionPrimary,
    label: "Abonnement modifié",
  },
  subscription_cancelled: {
    icon: "x",
    iconBg: DS.dangerTint,
    iconColor: DS.danger,
    label: "Abonnement résilié",
  },
  payment_method_added: {
    icon: "creditcard",
    iconBg: DS.infoTint,
    iconColor: DS.actionPrimary,
    label: "Moyen de paiement ajouté",
  },
  payment_method_updated: {
    icon: "creditcard",
    iconBg: DS.warningTint,
    iconColor: DS.warning,
    label: "Moyen de paiement mis à jour",
  },
  profile_updated: {
    icon: "person",
    iconBg: DS.grey200,
    iconColor: DS.textMuted,
    label: "Profil mis à jour",
  },
  account_created: {
    icon: "star",
    iconBg: DS.successTint,
    iconColor: DS.success,
    label: "Compte créé",
  },
};

const HISTORY: {
  id: string;
  type: EventType;
  date: string;
  detail: string;
}[] = [
  {
    id: "E1",
    type: "subscription_renewed",
    date: "10 juin 2026",
    detail: "Navigo Mensuel — Zones 1-2, 84,10 €",
  },
  {
    id: "E2",
    type: "payment_method_updated",
    date: "10 juin 2026",
    detail: "Visa •••• 4242 définie comme carte principale",
  },
  {
    id: "E3",
    type: "subscription_changed",
    date: "3 mai 2026",
    detail: "Navigo Annuel → Navigo Mensuel",
  },
  {
    id: "E4",
    type: "payment_method_added",
    date: "3 mai 2026",
    detail: "Mastercard •••• 1337 ajoutée",
  },
  {
    id: "E5",
    type: "subscription_renewed",
    date: "5 avr. 2026",
    detail: "Navigo Annuel — Zones 1-5, 950,40 €",
  },
  {
    id: "E6",
    type: "profile_updated",
    date: "18 janv. 2026",
    detail: "Adresse e-mail modifiée",
  },
  {
    id: "E7",
    type: "account_created",
    date: "12 janv. 2026",
    detail: "Bienvenue sur IDF Mobilités",
  },
];

function groupByMonth(
  events: typeof HISTORY
): { month: string; events: typeof HISTORY }[] {
  const groups: { month: string; events: typeof HISTORY }[] = [];
  let current: (typeof groups)[0] | null = null;

  for (const event of events) {
    const month = event.date.replace(/^\d+ /, "");
    if (!current || current.month !== month) {
      current = { month, events: [] };
      groups.push(current);
    }
    current.events.push(event);
  }

  return groups;
}

function EventRow({ event }: { event: (typeof HISTORY)[0] }) {
  const config = EVENT_CONFIG[event.type];
  const a11yLabel = `${config.label} — ${event.detail}, le ${event.date}`;

  return (
    // accessible={true} merges the subtree into one focus stop for VoiceOver/TalkBack.
    // The explicit accessibilityLabel overrides child text concatenation.
    <View
      accessible={true}
      accessibilityLabel={a11yLabel}
      style={styles.eventRow}
    >
      {/* Decorative icon — hidden from the a11y tree */}
      <View
        style={[styles.eventIcon, { backgroundColor: config.iconBg }]}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      >
        <Icon name={config.icon} size={16} color={config.iconColor} />
      </View>

      {/* Visual text — already covered by the parent accessibilityLabel */}
      <View style={styles.eventInfo} accessibilityElementsHidden={true}>
        <Text style={styles.eventLabel}>{config.label}</Text>
        <Text style={styles.eventDetail}>{event.detail}</Text>
      </View>

      <Text
        style={styles.eventDate}
        accessibilityElementsHidden={true}
      >
        {event.date.split(" ")[0]}
      </Text>
    </View>
  );
}

export default function HistoryView() {
  const groups = groupByMonth(HISTORY);

  return (
    <View style={styles.sectionContent}>
      <Text
        style={styles.viewTitle}
        accessibilityRole="header"
      >
        Historique
      </Text>
      <Text style={styles.viewSubtitle}>
        Les actions effectuées sur votre compte.
      </Text>

      {groups.map((group) => (
        <View key={group.month} style={styles.group}>
          {/* Month acts as a section heading for screen readers */}
          <Text
            style={styles.monthLabel}
            accessibilityRole="header"
          >
            {group.month}
          </Text>

          <View
            style={styles.card}
            accessibilityRole="list"
          >
            {group.events.map((event, i) => (
              <View key={event.id}>
                <EventRow event={event} />
                {i < group.events.length - 1 && (
                  // Pure visual separator — hidden from the a11y tree
                  <View
                    style={styles.divider}
                    accessibilityElementsHidden={true}
                    importantForAccessibility="no-hide-descendants"
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    gap: DS.space4,
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

  group: {
    gap: DS.space2,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: DS.space1,
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

  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space4,
    gap: DS.space3,
    minHeight: DS.targetMin,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: DS.radiusPill,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: DS.textStrong,
  },
  eventDetail: {
    fontSize: 13,
    color: DS.textMuted,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: "600",
    color: DS.textMuted,
    minWidth: 24,
    textAlign: "right",
  },
});