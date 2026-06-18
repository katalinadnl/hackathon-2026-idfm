import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { DS, MaxContentWidth } from "@/constants/theme";
import { useFetch } from "@/hooks/useFetch";
import { BankInfo } from "@/types/bankInfo";
import { maskIbanDisplay } from "@/lib/bank-info-helpters";

export default function BankInfosListPage() {
  const router = useRouter();

  const {
    data: bankInfos,
    loading,
    error,
    reload,
  } = useFetch<BankInfo[]>(`/bank-infos`);

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={DS.actionPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <Icon name="alert-triangle" size={32} color={DS.danger} />
          <Text style={s.errorText}>{error}</Text>
          <Button variant="secondary" size="sm" onPress={reload}>
            Réessayer
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const list = bankInfos ?? [];

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.wrapper}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Section
            title="Mes moyens de paiement"
            action={
              <Button
                variant="secondary"
                size="sm"
                leadingIcon="plus"
                onPress={() => router.push("/bank-infos/new" as any)}
              >
                Ajouter
              </Button>
            }
          >
            <>
              {list.length === 0 ? (
                <Card>
                  <Text style={s.emptyText}>
                    Aucun moyen de paiement enregistré pour le moment.
                  </Text>
                </Card>
              ) : (
                <View style={s.list}>
                  {list.map((bankInfo) => (
                    <Card
                      key={bankInfo.id}
                      interactive
                      onPress={() =>
                        router.push(`/bank-infos/${bankInfo.id}` as any)
                      }
                      style={s.bankCard}
                    >
                      <View style={s.bankCardHeader}>
                        <View style={s.bankCardIcon}>
                          <Icon
                            name="creditcard"
                            size={18}
                            color={DS.actionPrimary}
                          />
                        </View>
                        <View style={s.bankCardInfo}>
                          <Text style={s.bankCardLabel}>
                            {bankInfo.label ?? bankInfo.holderName}
                          </Text>
                          <Text style={s.bankCardIban}>
                            {maskIbanDisplay(bankInfo.iban)}
                          </Text>
                        </View>
                        {bankInfo.isDefault && (
                          <Badge tone="neutral">Par défaut</Badge>
                        )}
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </>
          </Section>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.surfacePage },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: DS.space3,
    padding: DS.space5,
  },
  errorText: { fontSize: 14, color: DS.textMuted, textAlign: "center" },
  wrapper: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  scrollContent: {
    paddingHorizontal: DS.space5,
    paddingTop: DS.space5,
    paddingBottom: DS.space8,
    gap: DS.space4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptyText: { fontSize: 14, color: DS.textMuted, textAlign: "center" },
  list: { gap: DS.space3 },
  bankCard: { padding: DS.space4 },
  bankCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  bankCardIcon: {
    width: 36,
    height: 36,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.surfacePage,
    alignItems: "center",
    justifyContent: "center",
  },
  bankCardInfo: { flex: 1, gap: 2 },
  bankCardLabel: { fontSize: 14, fontWeight: "600", color: DS.textStrong },
  bankCardIban: { fontSize: 13, color: DS.textMuted },
});
