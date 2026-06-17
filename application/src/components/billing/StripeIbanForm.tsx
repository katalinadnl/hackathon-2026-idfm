import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { DS } from '@/constants/theme';

type Props = {
  clientSecret: string;
  billingName: string;
  billingEmail: string;
  onSuccess: (setupIntentId: string) => void;
  onCancel: () => void;
};

export function StripeIbanForm({ onCancel }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>
        La saisie sécurisée de l’IBAN est disponible sur la version web. Sur
        mobile, elle passera par le SDK natif Stripe.
      </Text>
      <Button variant="tertiary" onPress={onCancel}>
        Fermer
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: DS.space3 },
  text: { fontSize: 14, color: DS.textBody, lineHeight: 20 },
});
