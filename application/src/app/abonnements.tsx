import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { pageInner, usePageLayout } from "@/hooks/use-page-layout";
import { DS, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { useFetch } from "@/hooks/useFetch";
import type { Tariff, TariffReduction } from "@/lib/api/tariffs";

function AudienceBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function ReductionRow({ r }: { r: TariffReduction }) {
  const label = r.isFree
    ? "Gratuité"
    : r.reductionPercent
      ? `−${r.reductionPercent} %`
      : "Réduction";

  return (
    <View style={styles.reductionRow}>
      <View style={styles.reductionBadge}>
        <Text style={styles.reductionBadgeText}>{label}</Text>
      </View>
      <View style={styles.reductionInfo}>
        <Text style={styles.reductionName}>{r.name}</Text>
        {r.indication && (
          <Text style={styles.reductionIndication}>{r.indication}</Text>
        )}
      </View>
    </View>
  );
}

function TariffCard({ tariff }: { tariff: Tariff }) {
  const router = useRouter();
  const { token } = useAuth();

  const audiences = getAudiences(tariff.name);
  const hasReductions = tariff.reductions.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {tariff.imageUrl && (
          <Image
            source={{ uri: tariff.imageUrl }}
            style={styles.cardImage}
            contentFit="contain"
          />
        )}
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{tariff.name}</Text>
          {tariff.description && (
            <Text style={styles.cardDescription}>{tariff.description}</Text>
          )}
          <View style={styles.audienceRow}>
            {audiences.map((a) => (
              <AudienceBadge key={a.label} label={a.label} color={a.color} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceValue}>{tariff.priceLabel}</Text>
          {tariff.period && (
            <Text style={styles.pricePeriod}>{tariff.period}</Text>
          )}
          {tariff.indication && (
            <Text style={styles.priceIndication}>{tariff.indication}</Text>
          )}
        </View>

        {tariff.sellingArguments.length > 0 && (
          <View style={styles.argsList}>
            {tariff.sellingArguments.map((arg, i) => (
              <View key={i} style={styles.argRow}>
                <Icon name="check" size={16} color={DS.success} />
                <Text style={styles.argText}>{arg}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {hasReductions && (
        <View style={styles.reductionsSection}>
          <Text style={styles.reductionsTitle}>Réductions disponibles</Text>
          {tariff.reductions.map((r) => (
            <ReductionRow key={r.id} r={r} />
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        {tariff.subscriptionTag && (
          <View style={styles.tagRow}>
            <Icon name="globe" size={14} color={DS.actionPrimary} />
            <Text style={styles.tagText}>{tariff.subscriptionTag}</Text>
          </View>
        )}
        <Pressable
          onPress={() =>
            router.push(
              token ? "/(connected)/subscriptions/new" : "/login",
            )
          }
          style={({ pressed }) => [
            styles.subscribeBtn,
            pressed && styles.subscribeBtnPressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.subscribeBtnText}>Souscrire</Text>
          <Icon name="arrow-right" size={16} color={DS.white} />
        </Pressable>
      </View>
    </View>
  );
}

function getAudiences(name: string): { label: string; color: string }[] {
  const lower = name.toLowerCase();
  if (lower.includes("junior"))
    return [{ label: "Moins de 11 ans", color: "#E8F5E9" }];
  if (lower.includes("scolaire"))
    return [{ label: "Primaire / Secondaire / Apprentis", color: "#FFF3E0" }];
  if (lower.includes("scol'r") || lower.includes("scolr"))
    return [{ label: "Scolaires grande couronne", color: "#FFF3E0" }];
  if (lower.includes("étudiant") || lower.includes("etudiant"))
    return [{ label: "Étudiants (jusqu'à 26 ans)", color: "#E3F2FD" }];
  if (lower.includes("annuel"))
    return [
      { label: "Actifs", color: "#E3F2FD" },
      { label: "Seniors", color: "#F3E5F5" },
      { label: "Tous publics", color: "#F5F5F5" },
    ];
  return [{ label: "Tous publics", color: "#F5F5F5" }];
}

export default function AbonnementsPage() {
  const { data: tariffs, loading, error } = useFetch<Tariff[]>("/tariffs");
  const { token } = useAuth();
  const router = useRouter();

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
    >
      <View style={[styles.inner, pageInner]}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Nos abonnements</Text>
          <Text style={styles.heroSubtitle}>
            Découvrez l'ensemble des forfaits Navigo disponibles en
            Île-de-France. Voyagez en illimité sur tout le réseau : métro, RER,
            bus, tramway et train.
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DS.actionPrimary} />
            <Text style={styles.loadingText}>
              Chargement des abonnements…
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-triangle" size={20} color={DS.dangerText} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {tariffs && (
          <View style={styles.grid}>
            {tariffs.map((t) => (
              <TariffCard key={t.id} tariff={t} />
            ))}
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: DS.surfacePage,
  },
  pageContent: {
    flexGrow: 1,
    paddingBottom: DS.space9,
  },
  inner: {
    maxWidth: MaxContentWidth,
    marginHorizontal: "auto" as any,
    width: "100%",
    paddingHorizontal: DS.space5,
  },

  hero: {
    paddingVertical: DS.space7,
    gap: DS.space2,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: DS.textStrong,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: DS.textMuted,
    lineHeight: 24,
    maxWidth: 640,
  },

  loadingContainer: {
    alignItems: "center",
    gap: DS.space3,
    paddingVertical: DS.space8,
  },
  loadingText: {
    fontSize: 14,
    color: DS.textMuted,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    backgroundColor: DS.dangerTint,
    borderRadius: DS.radiusSm,
    padding: DS.space4,
  },
  errorText: {
    fontSize: 14,
    color: DS.dangerText,
    flex: 1,
  },

  grid: {
    gap: DS.space5,
  },

  card: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    gap: DS.space4,
    padding: DS.space5,
    backgroundColor: DS.surfaceTint,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  cardImage: {
    width: 80,
    height: 100,
    borderRadius: DS.radiusSm,
  },
  cardHeaderText: {
    flex: 1,
    gap: DS.space2,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: DS.textStrong,
  },
  cardDescription: {
    fontSize: 14,
    color: DS.textMuted,
    lineHeight: 20,
  },
  audienceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.space2,
    marginTop: DS.space1,
  },
  badge: {
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space3,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: DS.textStrong,
  },

  cardBody: {
    padding: DS.space5,
    gap: DS.space4,
  },
  priceBlock: {
    gap: 2,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: DS.actionPrimary,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textMuted,
  },
  priceIndication: {
    fontSize: 13,
    color: DS.success,
    fontWeight: "600",
    marginTop: DS.space1,
  },

  argsList: {
    gap: DS.space2,
  },
  argRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DS.space2,
  },
  argText: {
    fontSize: 14,
    color: DS.textBody,
    flex: 1,
    lineHeight: 20,
  },

  reductionsSection: {
    borderTopWidth: 1,
    borderTopColor: DS.borderSubtle,
    padding: DS.space5,
    gap: DS.space3,
  },
  reductionsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: DS.textStrong,
  },
  reductionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  reductionBadge: {
    backgroundColor: DS.infoTint,
    borderRadius: DS.radiusSm,
    paddingHorizontal: DS.space2,
    paddingVertical: 3,
    minWidth: 64,
    alignItems: "center",
  },
  reductionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: DS.infoText,
  },
  reductionInfo: {
    flex: 1,
    gap: 1,
  },
  reductionName: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
  },
  reductionIndication: {
    fontSize: 12,
    color: DS.textMuted,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: DS.borderSubtle,
    padding: DS.space5,
    gap: DS.space3,
    flexWrap: "wrap",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: DS.actionPrimary,
  },
  subscribeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    backgroundColor: DS.actionPrimary,
    borderRadius: DS.radiusSm,
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space2,
  },
  subscribeBtnPressed: {
    opacity: 0.85,
  },
  subscribeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: DS.white,
  },

});
