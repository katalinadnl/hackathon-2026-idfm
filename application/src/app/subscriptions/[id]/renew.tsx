import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { InfoRow } from "@/components/subscription/InfoRow";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { DS, MaxContentWidth } from "@/constants/theme";
import { useSubscription } from "@/hooks/useSubscription";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import {
  addMonths,
  formatDate,
  formatFrDate,
  parseFrDate,
} from "@/lib/subscription-helpers";
import { ApiError } from "@/services/api";

export default function RenewSubscriptionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: subscription, loading, error, reload } = useSubscription(id);

  const [startDate, setStartDate] = useState<string | null>(null);
  const defaultStartDate = useMemo(() => {
    if (!subscription) return "";
    const currentEnd = new Date(subscription.endDate);
    const tomorrow = new Date(currentEnd);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const base = tomorrow > new Date() ? tomorrow : new Date();
    return formatFrDate(base);
  }, [subscription]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const startDateValue = startDate ?? defaultStartDate;
  const parsedStart = parseFrDate(startDateValue);
  const newEndDate = parsedStart ? addMonths(parsedStart, 12) : null;

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={DS.actionPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !subscription) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <Icon name="alert-triangle" size={32} color={DS.danger} />
          <Text style={s.errorText}>{error ?? "Abonnement introuvable"}</Text>
          <Button variant="secondary" size="sm" onPress={reload}>
            Réessayer
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  async function confirmRenewal() {
    if (!parsedStart) {
      setSubmitError("Format de date attendu : JJ/MM/AAAA.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await subscriptionsApi.renew(subscription!.id, parsedStart.toISOString());
      router.replace(`/subscriptions/${subscription!.id}` as any);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Le renouvellement a échoué. Réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.wrapper}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Button
            variant="tertiary"
            size="sm"
            leadingIcon="arrow-left"
            onPress={() => router.back()}
            style={s.backBtn}
          >
            Retour
          </Button>

          <SectionTitle>Renouveler l&apos;abonnement</SectionTitle>
          <Text style={s.lead}>
            {subscription.subscriptionType} —{" "}
            {subscription.beneficiary.firstName}{" "}
            {subscription.beneficiary.lastName}
          </Text>

          <Card style={s.recapCard}>
            <InfoRow
              label="Fin actuelle"
              value={formatDate(subscription.endDate)}
            />
            <InfoRow
              label="Numéro de pass"
              value={subscription.navigoNumber}
              last
            />
          </Card>

          <View style={s.formField}>
            <Input
              label="Nouvelle date de début"
              placeholder="JJ/MM/AAAA"
              value={startDateValue}
              onChangeText={setStartDate}
              error={
                startDateValue && !parsedStart
                  ? "Format attendu : JJ/MM/AAAA."
                  : undefined
              }
            />
          </View>

          {newEndDate && (
            <Text style={s.noteText}>
              Nouvelle date de fin :{" "}
              <Text style={s.noteTextStrong}>
                {newEndDate.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>{" "}
              (12 mois à partir de la date de début). Le même numéro de pass
              est conservé.
            </Text>
          )}

          {submitError && (
            <View style={s.errorBanner}>
              <Icon name="alert-triangle" size={16} color={DS.danger} />
              <Text style={s.errorBannerText}>{submitError}</Text>
            </View>
          )}

          <View style={s.actionsRow}>
            <Button
              variant="secondary"
              leadingIcon="arrow-left"
              disabled={submitting}
              onPress={() => router.back()}
            >
              Annuler
            </Button>
            <Button
              trailingIcon="arrow-right"
              disabled={submitting || !parsedStart}
              onPress={confirmRenewal}
            >
              {submitting ? "Renouvellement…" : "Confirmer le renouvellement"}
            </Button>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.surfacePage },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: DS.space3,
    padding: DS.space5,
  },
  errorText: {
    fontSize: 14,
    color: DS.textMuted,
    textAlign: "center",
  },
  wrapper: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: DS.space5,
    paddingTop: DS.space4,
    paddingBottom: DS.space8,
    gap: DS.space4,
  },
  backBtn: { alignSelf: "flex-start" },
  lead: {
    fontSize: 14,
    color: DS.textMuted,
  },
  recapCard: { marginTop: DS.space2 },
  formField: { marginTop: DS.space2 },
  noteText: {
    fontSize: 13,
    color: DS.textMuted,
    lineHeight: 19,
  },
  noteTextStrong: {
    color: DS.textStrong,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DS.space2,
    backgroundColor: DS.dangerTint,
    borderWidth: 1,
    borderColor: DS.danger,
    borderRadius: DS.radiusMd,
    padding: DS.space3,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: DS.dangerText,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: DS.space3,
    marginTop: DS.space2,
  },
});
