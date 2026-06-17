import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { AccountInfo } from "@/types/subscription";
import { SectionTitle } from "../ui/SectionTitle";
function accountName(info: AccountInfo) {
  return info.beneficiary
    ? `${info.beneficiary.firstName} ${info.beneficiary.lastName}`
    : info.accountNumber;
}

type AccountsSectionProps = {
  isOldEnough: boolean;
  account: { email: string } | null;
  referrer: AccountInfo | null;
  payer: AccountInfo | null;
  onLinkAccount: () => void;
};

export function AccountsSection({
  isOldEnough,
  account,
  referrer,
  payer,
  onLinkAccount,
}: AccountsSectionProps) {
  return (
    <>
      <SectionTitle>Comptes associés</SectionTitle>
      <View style={s.accountGrid}>
        <Card style={s.accountCard}>
          <View style={s.accountCardHeader}>
            <Icon name="person" size={16} color={DS.actionPrimary} />
            <Text style={s.accountCardTitle}>Compte</Text>
          </View>
          {isOldEnough ? (
            account ? (
              <Text style={s.accountCardValue}>{account.email}</Text>
            ) : (
              <>
                <Text style={s.accountCardSub}>Aucun compte associé</Text>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onPress={onLinkAccount}
                  accessibilityLabel="Associer à un compte"
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
            </>
          ) : (
            <Badge tone="neutral">Titulaire</Badge>
          )}
        </Card>

        <Card style={s.accountCard}>
          <View style={s.accountCardHeader}>
            <Icon name="person" size={16} color={DS.actionPrimary} />
            <Text style={s.accountCardTitle}>Payeur</Text>
          </View>
          {payer ? (
            <>
              <Text style={s.accountCardValue}>{accountName(payer)}</Text>
              <Text style={s.accountCardSub}>{payer.email}</Text>
            </>
          ) : (
            <Badge tone="neutral">Titulaire</Badge>
          )}
        </Card>
      </View>
    </>
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
