import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SectionTitle } from "@/components/ui/Section";
import { DS, MaxContentWidth } from "@/constants/theme";
import { useFetch } from "@/hooks/useFetch";
import { BankInfo } from "@/types/bankInfo";
import {
  deleteBankInfo,
  getBankInfosForAccount,
  getBankInfoUsage,
  updateBankInfo,
} from "@/lib/api/bank-info";
import { formatIbanDisplay, maskIbanDisplay } from "@/lib/bank-info-helpters";

type UsageInfo = { id: number; reference: string; subscriptionType: string };

export default function BankInfoDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: bankInfo,
    loading,
    error,
    reload,
  } = useFetch<BankInfo>(id ? `/bank-infos/${id}` : null);

  const [editing, setEditing] = useState(false);
  const [holderName, setHolderName] = useState("");
  const [label, setLabel] = useState("");
  const [bic, setBic] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Suppression ────────────────────────────────────────────────────────────
  const [deleteFlow, setDeleteFlow] = useState<
    | "idle"
    | "checking"
    | "confirm-simple"
    | "needs-replacement"
    | "needs-creation"
  >("idle");
  const [usage, setUsage] = useState<UsageInfo[]>([]);
  const [alternatives, setAlternatives] = useState<BankInfo[]>([]);
  const [selectedReplacementId, setSelectedReplacementId] = useState<
    number | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (bankInfo && !editing) {
      setHolderName(bankInfo.holderName);
      setLabel(bankInfo.label ?? "");
      setBic(bankInfo.bic ?? "");
    }
  }, [bankInfo, editing]);

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={DS.actionPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !bankInfo) {
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <View style={s.centered}>
          <Icon name="alert-triangle" size={32} color={DS.danger} />
          <Text style={s.errorText}>
            {error ?? "Moyen de paiement introuvable"}
          </Text>
          <Button variant="secondary" size="sm" onPress={reload}>
            Réessayer
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateBankInfo(bankInfo.id, {
        holderName: holderName.trim(),
        label: label.trim() || undefined,
        bic: bic.trim() || undefined,
      });
      setEditing(false);
      reload();
    } catch {
      setSaveError("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Avant d'autoriser la suppression : vérifie si l'IBAN est utilisé par des
   * abonnements. Si oui, cherche d'autres IBAN du même compte pour proposer
   * un remplacement ; sinon, redirige vers la création d'un nouvel IBAN.
   */
  const handleStartDelete = async () => {
    setDeleteFlow("checking");
    setDeleteError(null);
    try {
      const linkedSubscriptions = await getBankInfoUsage(bankInfo.id);
      setUsage(linkedSubscriptions);

      if (linkedSubscriptions.length === 0) {
        setDeleteFlow("confirm-simple");
        return;
      }

      const accountBankInfos = await getBankInfosForAccount(bankInfo.accountId);
      const others = accountBankInfos.filter((b) => b.id !== bankInfo.id);
      setAlternatives(others);

      setDeleteFlow(others.length > 0 ? "needs-replacement" : "needs-creation");
    } catch {
      setDeleteFlow("idle");
      setDeleteError("Impossible de vérifier l'utilisation de cet IBAN.");
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBankInfo(bankInfo.id, selectedReplacementId ?? undefined);
      router.back();
    } catch {
      setDeleteError("Impossible de supprimer ce moyen de paiement.");
    } finally {
      setDeleting(false);
    }
  };

  const handleGoToCreation = () => {
    setDeleteFlow("idle");
    router.push({
      pathname: "/bank-infos/new",
      params: { pendingDeleteId: String(bankInfo.id) },
    } as any);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <View style={s.wrapper}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SectionTitle>Moyen de paiement</SectionTitle>

          <Card style={s.card}>
            <View style={s.ibanRow}>
              <Icon name="creditcard" size={20} color={DS.actionPrimary} />
              <Text style={s.ibanText}>{formatIbanDisplay(bankInfo.iban)}</Text>
            </View>

            {editing ? (
              <View style={s.form}>
                <Input
                  label="Titulaire"
                  value={holderName}
                  onChangeText={setHolderName}
                />
                <Input
                  label="Libellé"
                  placeholder="Mon compte"
                  value={label}
                  onChangeText={setLabel}
                />
                <Input
                  label="BIC"
                  placeholder="BDFEFRPPXXX"
                  value={bic}
                  onChangeText={setBic}
                  autoCapitalize="characters"
                />

                {saveError && <Text style={s.error}>{saveError}</Text>}

                <View style={s.formActions}>
                  <Button
                    variant="tertiary"
                    onPress={() => setEditing(false)}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </View>
              </View>
            ) : (
              <View style={s.infoList}>
                <InfoLine label="Titulaire" value={bankInfo.holderName} />
                <InfoLine label="Libellé" value={bankInfo.label ?? "—"} />
                <InfoLine label="BIC" value={bankInfo.bic ?? "—"} />
                <InfoLine
                  label="Par défaut"
                  value={bankInfo.isDefault ? "Oui" : "Non"}
                />
              </View>
            )}
          </Card>

          {!editing && (
            <View style={s.actions}>
              <Button
                variant="secondary"
                fullWidth
                leadingIcon="edit"
                onPress={() => setEditing(true)}
              >
                Modifier
              </Button>
              <Button
                variant="danger"
                fullWidth
                leadingIcon="trash"
                onPress={handleStartDelete}
                disabled={deleteFlow === "checking"}
              >
                {deleteFlow === "checking" ? "Vérification…" : "Supprimer"}
              </Button>
              {deleteError && <Text style={s.error}>{deleteError}</Text>}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Cas simple : aucun abonnement lié */}
      <ConfirmModal
        visible={deleteFlow === "confirm-simple"}
        title="Supprimer ce moyen de paiement"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteFlow("idle")}
      />

      {/* Cas avec abonnements liés et alternatives disponibles */}
      <Modal
        visible={deleteFlow === "needs-replacement"}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteFlow("idle")}
      >
        <View style={s.overlay}>
          <Card style={s.replacementModal}>
            <View style={s.header}>
              <Icon name="alert-triangle" size={22} color={DS.dangerText} />
              <Text style={s.title}>Choisir un IBAN de remplacement</Text>
            </View>
            <Text style={s.body}>
              {usage.length === 1
                ? "Cet IBAN est utilisé par 1 abonnement."
                : `Cet IBAN est utilisé par ${usage.length} abonnements.`}{" "}
              Choisissez l&apos;IBAN qui le remplacera avant de pouvoir le
              supprimer.
            </Text>

            <View style={s.alternativesList}>
              {alternatives.map((alt) => (
                <Card
                  key={alt.id}
                  interactive
                  onPress={() => setSelectedReplacementId(alt.id)}
                  style={[
                    s.alternativeCard,
                    selectedReplacementId === alt.id &&
                      s.alternativeCardSelected,
                  ]}
                >
                  <View style={s.alternativeRow}>
                    <View style={s.alternativeText}>
                      <Text style={s.alternativeLabel}>
                        {alt.label ?? alt.holderName}
                      </Text>
                      <Text style={s.alternativeIban}>
                        {maskIbanDisplay(alt.iban)}
                      </Text>
                    </View>
                    {selectedReplacementId === alt.id && (
                      <Icon name="check" size={18} color={DS.actionPrimary} />
                    )}
                  </View>
                </Card>
              ))}
            </View>

            {deleteError && <Text style={s.error}>{deleteError}</Text>}

            <View style={s.formActions}>
              <Button
                variant="tertiary"
                onPress={() => setDeleteFlow("idle")}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onPress={handleConfirmDelete}
                disabled={!selectedReplacementId || deleting}
              >
                {deleting ? "Suppression…" : "Remplacer et supprimer"}
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Cas avec abonnements liés mais aucune alternative : il faut en créer un */}
      <ConfirmModal
        visible={deleteFlow === "needs-creation"}
        title="Aucun autre moyen de paiement"
        message={`Cet IBAN est utilisé par ${usage.length} abonnement${usage.length > 1 ? "s" : ""}. Vous devez ajouter un nouvel IBAN avant de pouvoir supprimer celui-ci.`}
        confirmLabel="Ajouter un IBAN"
        confirmVariant="primary"
        onConfirm={handleGoToCreation}
        onCancel={() => setDeleteFlow("idle")}
      />
    </SafeAreaView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoLine}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
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
  card: { gap: DS.space4 },
  ibanRow: { flexDirection: "row", alignItems: "center", gap: DS.space2 },
  ibanText: { fontSize: 15, fontWeight: "600", color: DS.textStrong },
  form: { gap: DS.space3 },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: DS.space3,
    marginTop: DS.space2,
  },
  error: { fontSize: 13, color: DS.dangerText },
  infoList: { gap: DS.space2 },
  infoLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: DS.space1,
  },
  infoLabel: { fontSize: 13, color: DS.textMuted },
  infoValue: { fontSize: 13, fontWeight: "600", color: DS.textStrong },
  actions: { gap: DS.space3 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: DS.space5,
  },
  replacementModal: { width: "100%", maxWidth: 460, gap: DS.space3 },
  header: { flexDirection: "row", alignItems: "center", gap: DS.space2 },
  title: { fontSize: 17, fontWeight: "700", color: DS.textStrong, flex: 1 },
  body: { fontSize: 14, color: DS.textBody, lineHeight: 20 },
  alternativesList: { gap: DS.space2, maxHeight: 240 },
  alternativeCard: { padding: DS.space3 },
  alternativeCardSelected: { borderColor: DS.actionPrimary, borderWidth: 1.5 },
  alternativeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alternativeText: { gap: 2 },
  alternativeLabel: { fontSize: 14, fontWeight: "600", color: DS.textStrong },
  alternativeIban: { fontSize: 12, color: DS.textMuted },
});
