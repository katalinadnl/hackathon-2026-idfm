import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { DS } from '@/constants/theme';

type Props = { accountId: number; subscriptionId: number | null };

/**
 * Onglet 3 — RIB & modification.
 * Scaffold. Displays the masked IBAN from the Stripe seam
 * (getDefaultPaymentMethod). RIB collection happens at subscription
 * enrollment (handled elsewhere) and will be integrated later.
 */
export function RibTab({ subscriptionId }: Props) {
  if (subscriptionId === null) {
    return (
      <Card>
        <Text style={styles.hint}>
          Sélectionnez un pass précis pour afficher le RIB associé.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Icon name="info" size={28} color={DS.actionPrimary} />
      <Text style={styles.title}>RIB enregistré</Text>
      <Text style={styles.body}>
        Cet onglet affichera l’IBAN masqué enregistré sur Stripe (ex. FR76 ••••
        ••••  1234) et le point d’entrée « Modifier mon RIB ». La collecte du
        nouvel IBAN est gérée lors de l’inscription à l’abonnement et sera
        intégrée ensuite.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'flex-start', gap: DS.space2 },
  title: { fontSize: 18, fontWeight: '800', color: DS.textStrong },
  body: { fontSize: 14, color: DS.textBody, lineHeight: 20 },
  hint: { fontSize: 15, color: DS.textMuted, textAlign: 'center' },
});