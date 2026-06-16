import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { DS } from '@/constants/theme';

type Props = { accountId: number; subscriptionId: number | null };

/**
 * Onglet 2 — Mandat SEPA.
 * Scaffold. The mandate data + PDF download come from the Stripe seam
 * (api/src/billing/stripe/stripe.provider.ts → getMandate) once the Stripe
 * account is connected. Built next.
 */
export function MandateTab({ subscriptionId }: Props) {
  if (subscriptionId === null) {
    return (
      <Card>
        <Text style={styles.hint}>
          Sélectionnez un pass précis pour afficher son mandat SEPA.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Icon name="info" size={28} color={DS.actionPrimary} />
      <Text style={styles.title}>Mandat SEPA</Text>
      <Text style={styles.body}>
        Cet onglet affichera le mandat SEPA actif (RUM, créancier, date de
        signature) et permettra de le télécharger en PDF. Il sera branché sur
        Stripe à l’étape suivante.
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