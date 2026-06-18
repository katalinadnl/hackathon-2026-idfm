import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { SectionTitle, Section } from "../ui/Section";
import { AccountInfo, SubscriptionResponse } from "@/types/subscription";
import { useState } from "react";
import { ConfirmModal } from "../ui/ConfirmModal";
import { unlinkReferrer } from "@/lib/api/subscriptions";
import { AssignReferrerModal } from "./AssignReferrerModal";
import { LinkAccountModal } from "./LinkAccountModal";

function accountName(info: AccountInfo) {
  return info.beneficiary
    ? `${info.beneficiary.firstName} ${info.beneficiary.lastName}`
    : info.accountNumber;
}

type AccountsSectionProps = {
  isOldEnough: boolean;
  accountBeneficiary: AccountInfo | null;
  referrer: AccountInfo | null;
  subscriptionId: SubscriptionResponse["id"];
  onReferrerChanged: () => void;
};

export function AccountsSection({
  isOldEnough,
  accountBeneficiary,
  referrer,
  subscriptionId,
  onReferrerChanged,
}: AccountsSectionProps) {
  const [unlinking, setUnlinking] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [linkAccountModalVisible, setLinkAccountModalVisible] = useState(false);
  const [unlinkVisible, setUnlinkVisible] = useState(false);
  const [orphanWarningVisible, setOrphanWarningVisible] = useState(false);

  // Si le bénéficiaire n'a pas de compte propre, dissocier le référant
  // rendrait l'abonnement inaccessible : ni le titulaire (pas de compte),
  // ni le référant (justement dissocié) ne pourraient plus le gérer.
  const wouldOrphanSubscription = !accountBeneficiary;

  const handlePressUnlink = () => {
    if (wouldOrphanSubscription) {
      setOrphanWarningVisible(true);
      return;
    }
    setUnlinkVisible(true);
  };

  // Corrigé : on n'appelle onReferrerChanged() qu'une fois la dissociation
  // confirmée côté serveur, plus en parallèle de l'appel async.
  const handleConfirmUnlink = async () => {
    setUnlinking(true);
    try {
      await unlinkReferrer(subscriptionId);
      setUnlinkVisible(false);
      onReferrerChanged();
    } catch {
      // On laisse la modale ouverte pour que l'utilisateur puisse réessayer ;
      // un message d'erreur inline serait préférable à terme.
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <Section title="Comptes associés">
      <View style={s.accountGrid}>
        <Card style={s.accountCard}>
          <View style={s.accountCardHeader}>
            <Icon name="person" size={16} color={DS.actionPrimary} />
            <Text style={s.accountCardTitle}>Compte</Text>
          </View>
          {isOldEnough ? (
            accountBeneficiary ? (
              <Text style={s.accountCardValue}>{accountBeneficiary.email}</Text>
            ) : (
              <>
                <Text style={s.accountCardSub}>Aucun compte associé</Text>
                <Button
                  variant="tertiary"
                  size="sm"
                  fullWidth
                  accessibilityLabel="Associer à un compte"
                  onPress={() => setLinkAccountModalVisible(true)}
                >
                  Associer un compte
                </Button>
              </>
            )
          ) : (
            <Text style={s.accountCardSub}>Disponible à partir de 16 ans</Text>
          )}
        </Card>

        <Card style={s.accountCard}>
          <View style={s.accountCardHeader}>
            <Icon name="person" size={16} color={DS.actionPrimary} />
            <Text style={s.accountCardTitle}>Référant</Text>
          </View>
          {referrer ? (
            <>
              <Text style={s.accountCardValue}>{accountName(referrer)}</Text>
              <Text style={s.accountCardSub}>{referrer.email}</Text>
              <Button
                size="sm"
                variant="tertiary"
                fullWidth
                onPress={handlePressUnlink}
                disabled={unlinking}
                accessibilityLabel="Dissocier le référant"
              >
                {unlinking ? "Dissociation…" : "Dissocier"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="tertiary"
              fullWidth
              onPress={() => setAssignModalVisible(true)}
              accessibilityLabel="Associer un référant"
            >
              Ajouter un référant
            </Button>
          )}
        </Card>
      </View>

      {/* Dissociation normale : un compte titulaire existe, rien ne bloque */}
      <ConfirmModal
        visible={unlinkVisible}
        title="Dissocier le référant"
        message="Le référant ne pourra plus gérer cet abonnement. Voulez-vous continuer ?"
        confirmLabel="Dissocier"
        confirmVariant="danger"
        loading={unlinking}
        onConfirm={handleConfirmUnlink}
        onCancel={() => setUnlinkVisible(false)}
      />

      {/* Dissociation bloquée : pas de compte titulaire, l'abonnement
          deviendrait inaccessible. Modale explicative, pas de confirmation
          possible — seule l'option de fermer est proposée. */}
      <ConfirmModal
        visible={orphanWarningVisible}
        title="Dissociation impossible"
        message="Ce bénéficiaire n'a pas de compte propre. Si vous dissociez le référant, plus personne ne pourra accéder à cet abonnement. Associez d'abord un compte au bénéficiaire avant de pouvoir dissocier le référant."
        confirmLabel="Associer un compte"
        confirmVariant="primary"
        onConfirm={() => {
          setOrphanWarningVisible(false);
          setLinkAccountModalVisible(true);
        }}
        onCancel={() => setOrphanWarningVisible(false)}
      />

      <AssignReferrerModal
        visible={assignModalVisible}
        subscriptionId={subscriptionId}
        onClose={() => setAssignModalVisible(false)}
        onSuccess={onReferrerChanged}
      />
      <LinkAccountModal
        visible={linkAccountModalVisible}
        subscriptionId={subscriptionId}
        onClose={() => setLinkAccountModalVisible(false)}
        onSuccess={onReferrerChanged}
      />
    </Section>
  );
}

const s = StyleSheet.create({
  accountGrid: { flexDirection: "row", flexWrap: "wrap", gap: DS.space3 },
  accountCard: { flex: 1, minWidth: 180, gap: DS.space2 },
  accountCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    marginBottom: DS.space1,
  },
  accountCardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: DS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  accountCardValue: { fontSize: 14, fontWeight: "600", color: DS.textStrong },
  accountCardSub: { fontSize: 12, color: DS.textMuted },
});
