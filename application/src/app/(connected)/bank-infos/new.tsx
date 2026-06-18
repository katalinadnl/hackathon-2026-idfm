import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionTitle } from "@/components/ui/Section";
import { DS, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { createBankInfo, deleteBankInfo } from "@/lib/api/bank-info";

export default function NewBankInfoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { pendingDeleteId } = useLocalSearchParams<{
    pendingDeleteId?: string;
  }>();

  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [holderName, setHolderName] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = iban.trim().length >= 15 && holderName.trim().length > 0;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const newBankInfo = await createBankInfo({
        accountId: user.id,
        iban: iban.trim().replace(/\s+/g, ""),
        bic: bic.trim() || undefined,
        holderName: holderName.trim(),
        label: label.trim() || undefined,
      });

      // Si on vient du flux "supprimer un IBAN sans alternative disponible",
      // on relance maintenant la suppression avec ce nouvel IBAN en
      // remplacement, pour fermer la boucle sans repasser par l'utilisateur.
      if (pendingDeleteId) {
        try {
          await deleteBankInfo(Number(pendingDeleteId), newBankInfo.id);
        } catch {
          // Le nouvel IBAN est bien créé ; si la suppression de l'ancien
          // échoue ici, on laisse l'utilisateur la refaire manuellement
          // depuis la page détail plutôt que de masquer l'erreur.
          setError(
            "Le nouvel IBAN a été ajouté, mais la suppression de l'ancien a échoué. Réessayez depuis sa page de détail.",
          );
          setSubmitting(false);
          return;
        }
      }

      router.replace({
        pathname: "/bank-infos",
        params: { id: newBankInfo.id },
      });
    } catch {
      setError(
        "Impossible d'enregistrer ce moyen de paiement. Vérifiez l'IBAN saisi.",
      );
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.wrapper}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SectionTitle>Ajouter un moyen de paiement</SectionTitle>

          {pendingDeleteId && (
            <Card style={s.noticeCard}>
              <Text style={s.noticeText}>
                Une fois ce nouvel IBAN ajouté, il remplacera automatiquement
                celui que vous souhaitiez supprimer.
              </Text>
            </Card>
          )}

          <Card style={s.card}>
            <Input
              label="IBAN"
              placeholder="FR76 3000 1007 9412 3456 7890 185"
              value={iban}
              onChangeText={setIban}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Input
              label="BIC"
              placeholder="BDFEFRPPXXX"
              value={bic}
              onChangeText={setBic}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Input
              label="Titulaire du compte"
              placeholder="Prénom Nom"
              value={holderName}
              onChangeText={setHolderName}
            />
            <Input
              label="Libellé (optionnel)"
              placeholder="Mon compte"
              value={label}
              onChangeText={setLabel}
            />

            {error && <Text style={s.error}>{error}</Text>}
          </Card>

          <View style={s.actions}>
            <Button
              variant="tertiary"
              onPress={() => router.back()}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting
                ? pendingDeleteId
                  ? "Ajout et remplacement…"
                  : "Enregistrement…"
                : pendingDeleteId
                  ? "Ajouter et remplacer"
                  : "Ajouter"}
            </Button>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.surfacePage },
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
  noticeCard: { backgroundColor: DS.surfaceTint },
  noticeText: { fontSize: 13, color: DS.textBody, lineHeight: 19 },
  card: { gap: DS.space3 },
  error: { fontSize: 13, color: DS.dangerText },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: DS.space3,
  },
});
