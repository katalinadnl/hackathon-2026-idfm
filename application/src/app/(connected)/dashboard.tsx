import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { DS } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { useFetch } from "@/hooks/useFetch";
import {
  STATUS_LABEL,
  STATUS_TONE,
} from "@/components/subscription/SubscriptionHeader";
import { useTariffs } from "@/hooks/useTariffs";
import { Tariff, TariffReduction } from "@/lib/api/tariffs";
import { ApiSubscription, SubscriptionRole } from "@/hooks/use-subscriptions";
import { GradientPassCard } from "@/components/ui/GradientPassCard";

function NewSubscriptionCta({
  onSelect,
}: {
  onSelect: (target: "self" | "other") => void;
}) {
  return (
    <View style={styles.sectionContent}>
      <SectionHeader title="Nouvel abonnement" />
      <View style={styles.newSubGrid}>
        <Card style={styles.newSubCard}>
          <View style={styles.newSubIcon}>
            <Icon name="person" size={22} color={DS.actionPrimary} />
          </View>
          <Text style={styles.newSubTitle}>Pour moi</Text>
          <Text style={styles.newSubDesc}>
            Souscrivez un nouveau pass Navigo à votre nom.
          </Text>
          <Button
            variant="primary"
            size="sm"
            trailingIcon="arrow-right"
            onPress={() => onSelect("self")}
          >
            Commencer
          </Button>
        </Card>

        <Card style={styles.newSubCard}>
          <View style={styles.newSubIcon}>
            <Icon name="user-plus" size={22} color={DS.actionPrimary} />
          </View>
          <Text style={styles.newSubTitle}>Pour une autre personne</Text>
          <Text style={styles.newSubDesc}>
            Abonnez un proche — enfant, parent ou conjoint — en tant que
            référent ou payeur.
          </Text>
          <Button
            variant="secondary"
            size="sm"
            trailingIcon="arrow-right"
            onPress={() => onSelect("other")}
          >
            Commencer
          </Button>
        </Card>
      </View>
    </View>
  );
}

function formatReductionBenefit(r: TariffReduction): string {
  if (r.isFree && r.reductionPercent) {
    return `gratuit ou jusqu'à -${r.reductionPercent} %`;
  }
  if (r.isFree) return "gratuit";
  if (r.reductionPercent) return `-${r.reductionPercent} %`;
  return "réduction";
}

function TariffCard({
  tariff,
  onSelect,
}: {
  tariff: Tariff;
  onSelect: () => void;
}) {
  return (
    <Card style={styles.tariffCard}>
      <View style={styles.tariffCardBody}>
        <Text style={styles.tariffName}>{tariff.name}</Text>
        {!!tariff.description && (
          <Text style={styles.tariffDesc}>{tariff.description}</Text>
        )}
        <Text style={styles.tariffPrice}>
          {tariff.priceLabel}
          <Text style={styles.tariffPricePeriod}>
            {" "}
            / {tariff.period ?? "an"}
          </Text>
        </Text>
        {tariff.sellingArguments.slice(0, 3).map((arg) => (
          <Text key={arg} style={styles.tariffArg}>
            • {arg}
          </Text>
        ))}
      </View>
      <Button
        variant="secondary"
        size="sm"
        trailingIcon="arrow-right"
        onPress={onSelect}
      >
        Choisir cette formule
      </Button>
    </Card>
  );
}

function ReductionCard({
  reduction,
  baseProductName,
  onSelect,
}: {
  reduction: TariffReduction;
  baseProductName: string;
  onSelect: () => void;
}) {
  return (
    <Card style={styles.tariffCard}>
      <View style={styles.tariffCardBody}>
        <Text style={styles.tariffName}>{reduction.name}</Text>
        <Text style={styles.tariffReductionBase}>
          S&apos;applique sur {baseProductName}
        </Text>
        {!!reduction.description && (
          <Text style={styles.tariffDesc}>{reduction.description}</Text>
        )}
        <Text style={styles.tariffPrice}>
          {formatReductionBenefit(reduction)}
        </Text>
        {!!reduction.indication && (
          <Text style={styles.tariffArg}>• {reduction.indication}</Text>
        )}
      </View>
      <Button
        variant="secondary"
        size="sm"
        trailingIcon="arrow-right"
        onPress={onSelect}
      >
        Choisir cette formule
      </Button>
    </Card>
  );
}

function TariffsDiscovery({
  onSelect,
}: {
  onSelect: (target: "self" | "other") => void;
}) {
  const { tariffs, loading, error } = useTariffs();

  if (loading || error || tariffs.length === 0) return null;

  const reductionCards = tariffs.flatMap((tariff) =>
    (tariff.reductions ?? []).map((reduction) => ({
      reduction,
      baseProductName: tariff.name,
    })),
  );

  return (
    <View style={styles.sectionContent}>
      <SectionHeader title="Découvrez nos abonnements" />
      <View style={styles.tariffGrid}>
        {tariffs.map((tariff) => (
          <TariffCard
            key={tariff.id}
            tariff={tariff}
            onSelect={() => onSelect("self")}
          />
        ))}
      </View>

      {reductionCards.length > 0 && (
        <>
          <SectionHeader title="Réductions et tarifs solidaires" />
          <View style={styles.tariffGrid}>
            {reductionCards.map(({ reduction, baseProductName }) => (
              <ReductionCard
                key={reduction.id}
                reduction={reduction}
                baseProductName={baseProductName}
                onSelect={() => onSelect("self")}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}

function isExpiringSoon(endDate: string): boolean {
  const days =
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 30;
}

const ROLE_LABELS: Record<SubscriptionRole, string> = {
  titulaire: "Titulaire",
  payeur: "Payeur",
  gestionnaire: "Gestionnaire",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function AdvisorWidget() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/advisor")}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le Conseiller IA Mobilité"
      style={({ pressed }) => [
        styles.advisorWidget,
        pressed && styles.advisorWidgetPressed,
      ]}
    >
      <View style={styles.advisorWidgetLeft}>
        <View style={styles.advisorWidgetIcon}>
          <Icon name="star" size={20} color={DS.white} />
        </View>
        <View style={styles.advisorWidgetText}>
          <Text style={styles.advisorWidgetTitle}>Conseiller IA Mobilité</Text>
          <Text style={styles.advisorWidgetSub}>
            Renouvellement, pass perdu, justificatifs… posez vos questions.
          </Text>
        </View>
      </View>
      <Icon name="arrow-right" size={18} color={DS.actionPrimary} />
    </Pressable>
  );
}
function ActivePassCard({ sub }: { sub: ApiSubscription }) {
  const router = useRouter();
  const expiring = isExpiringSoon(sub.endDate);

  return (
    <GradientPassCard
      header={
        <View style={styles.passCardTop}>
          <View style={styles.passCardMeta}>
            <Icon name="ticket" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.passCardType}>{sub.subscriptionType}</Text>
            <Badge tone={STATUS_TONE[sub.status]} dot>
              {STATUS_LABEL[sub.status]}
            </Badge>
          </View>
          <Button
            variant="secondary"
            size="sm"
            trailingIcon="arrow-right"
            style={styles.passCardBtn}
            onPress={() => router.push(`/subscriptions/${sub.id}`)}
          >
            Gérer
          </Button>
        </View>
      }
      content={
        <>
          <Text style={styles.passZones}>
            {sub.beneficiary.firstName} {sub.beneficiary.lastName}
          </Text>
          <Text style={styles.passValidity}>
            Valable jusqu&apos;au {formatDate(sub.endDate)}
            {expiring ? " · Renouvellement disponible" : ""}
          </Text>
        </>
      }
      footer={
        <>
          {sub.latestPayment && (
            <Text style={styles.passPrice}>
              {formatAmount(sub.latestPayment.amount)}/mois
            </Text>
          )}
          <View style={styles.roleRow}>
            {sub.roles.map((r) => (
              <View key={r} style={styles.roleChip}>
                <Text style={styles.roleChipText}>{ROLE_LABELS[r]}</Text>
              </View>
            ))}
          </View>
        </>
      }
    />
  );
}

export function PassRow({ sub }: { sub: ApiSubscription }) {
  const router = useRouter();
  const expiring = isExpiringSoon(sub.endDate);
  return (
    <Card
      style={styles.passRow}
      onPress={() => router.push(`/subscriptions/${sub.id}`)}
      interactive
      accessibilityLabel={`Voir le détail de ${sub.subscriptionType}`}
    >
      <View style={styles.passRowLeft}>
        <View style={styles.passRowHeader}>
          <Text style={styles.passRowType}>{sub.subscriptionType}</Text>
          <Badge tone={STATUS_TONE[sub.status]} dot>
            {STATUS_LABEL[sub.status]}
          </Badge>
          {expiring && <Badge tone="warning">Renouveler</Badge>}
        </View>
        <Text style={styles.passRowZones}>
          {sub.beneficiary.firstName} {sub.beneficiary.lastName}
        </Text>
        <Text style={styles.passRowValidity}>
          Jusqu&apos;au {formatDate(sub.endDate)}
        </Text>
        <View style={styles.roleRowSmall}>
          {sub.roles.map((r) => (
            <Text key={r} style={styles.roleLabel}>
              {ROLE_LABELS[r]}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.passRowRight}>
        {sub.latestPayment && (
          <Text style={styles.passRowPrice}>
            {formatAmount(sub.latestPayment.amount)}
          </Text>
        )}
        <Icon name="arrow-right" size={18} color={DS.textMuted} />
      </View>
    </Card>
  );
}

function PaymentRow({ sub }: { sub: ApiSubscription }) {
  if (!sub.latestPayment) return null;
  const p = sub.latestPayment;
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableCellId]}>
        {sub.reference}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellDesc]}>
        {sub.subscriptionType}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellDate]}>
        {formatDate(p.paidAt)}
      </Text>
      <Text style={[styles.tableCell, styles.tableCellAmount]}>
        {formatAmount(p.amount)}
      </Text>
      <Badge tone={p.status === "succeeded" ? "success" : "warning"}>
        {p.status === "succeeded" ? "Payée" : "Échec"}
      </Badge>
    </View>
  );
}

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

export function LoadingPlaceholder() {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={DS.actionPrimary} />
      <Text style={styles.loadingText}>Chargement…</Text>
    </View>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const router = useRouter();

  const {
    data: subscriptions,
    loading,
    error,
  } = useFetch<ApiSubscription[]>(user ? `/subscriptions` : null);
  const goToNewSubscription = (target: "self" | "other") =>
    router.push({
      pathname: "/subscriptions/new",
      params: { for: target },
    } as any);
  if (!user || !subscriptions) return null;
  const active =
    subscriptions.find((s) => s.status === "active") ?? subscriptions[0];
  const withPayments = subscriptions.filter((s) => s.latestPayment);
  const accountName = user?.firstName ?? user?.email ?? "";
  const showEmptyState = !loading && subscriptions.length === 0;

  if (showEmptyState)
    return (
      <>
        <NewSubscriptionCta onSelect={goToNewSubscription} />
        <TariffsDiscovery onSelect={goToNewSubscription} />
      </>
    );
  return (
    <>
      <View style={styles.greeting}>
        <View style={styles.avatarBubble}>
          <Text style={styles.avatarText}>
            {accountName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.greetingText}>Bonjour, {accountName}</Text>
          <Text style={styles.greetingSubtitle}>
            Voici votre tableau de bord.
          </Text>
        </View>
      </View>
      <AdvisorWidget />

      {error && (
        <View style={styles.errorBanner}>
          <Icon name="warning" size={16} color={DS.warning} />
          <Text style={styles.errorText}>
            Impossible de charger les données. Vérifiez que l&apos;API est
            démarrée.
          </Text>
        </View>
      )}
      <View style={styles.sectionContent}>
        {loading ? (
          <LoadingPlaceholder />
        ) : active ? (
          <ActivePassCard sub={active} />
        ) : null}

        <SectionHeader
          title="Vos abonnements"
          action="Tout voir"
          onAction={() => router.push("/subscriptions")}
        />
        <View>
          {loading ? (
            <LoadingPlaceholder />
          ) : subscriptions.length === 0 ? (
            <Text style={styles.emptyText}>Aucun abonnement trouvé.</Text>
          ) : (
            subscriptions.map((s, i) => (
              <View key={s.id}>
                <PassRow sub={s} />
                {i < subscriptions.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))
          )}
        </View>

        <SectionHeader
          title="Dernières facturations"
          action="Tout voir"
          onAction={() => router.push("/billing")}
        />
        <View style={styles.card}>
          {loading ? (
            <LoadingPlaceholder />
          ) : withPayments.length === 0 ? (
            <Text style={styles.emptyText}>Aucune facturation.</Text>
          ) : (
            withPayments.slice(0, 2).map((s, i) => (
              <View key={s.id}>
                <PaymentRow sub={s} />
                {i < Math.min(withPayments.length, 2) - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
    marginVertical: DS.space3,
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

  advisorWidget: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    backgroundColor: DS.surfaceTint,
    borderWidth: 1,
    borderColor: DS.borderBrand,
    borderRadius: DS.radiusLg,
    padding: DS.space4,
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "background-color 150ms ease",
        } as any)
      : {}),
  },
  advisorWidgetPressed: {
    backgroundColor: DS.blueSoft,
  },
  advisorWidgetLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  advisorWidgetIcon: {
    width: 40,
    height: 40,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  advisorWidgetText: {
    flex: 1,
    gap: DS.space1,
  },
  advisorWidgetTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: DS.textStrong,
  },
  advisorWidgetSub: {
    fontSize: 13,
    color: DS.textMuted,
    lineHeight: 18,
  },

  newSubGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.space4,
  },
  newSubCard: {
    flex: 1,
    minWidth: 240,
    gap: DS.space3,
  },
  newSubIcon: {
    width: 44,
    height: 44,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.surfaceSelected,
    alignItems: "center",
    justifyContent: "center",
  },
  newSubTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: DS.textStrong,
  },
  newSubDesc: {
    fontSize: 14,
    color: DS.textMuted,
    lineHeight: 20,
  },

  tariffGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.space4,
  },
  tariffCard: {
    flex: 1,
    minWidth: 220,
    gap: DS.space3,
  },
  tariffCardBody: {
    flex: 1,
    gap: DS.space2,
  },
  tariffName: {
    fontSize: 16,
    fontWeight: "700",
    color: DS.textStrong,
  },
  tariffDesc: {
    fontSize: 13,
    color: DS.textMuted,
    lineHeight: 18,
  },
  tariffPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: DS.actionPrimary,
    marginTop: DS.space1,
  },
  tariffPricePeriod: {
    fontSize: 13,
    fontWeight: "400",
    color: DS.textMuted,
  },
  tariffArg: {
    fontSize: 13,
    color: DS.textBody,
  },
  tariffReductionBase: {
    fontSize: 12,
    fontWeight: "600",
    color: DS.actionPrimary,
  },
});
