import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/theme';
import { Badge } from './Badge';
import { Icon } from './Icon';
import { LineBadge } from './LineBadge';

type Leg =
  | { walk: number; mode?: never; line?: never }
  | { mode: string; line: string | number; walk?: never };

type JourneyCardProps = {
  depart: string;
  arrive: string;
  duration: string;
  legs?: Leg[];
  accessible?: boolean;
  recommended?: boolean;
  onPress?: () => void;
};

export function JourneyCard({
  depart,
  arrive,
  duration,
  legs = [],
  accessible = false,
  recommended = false,
  onPress,
}: JourneyCardProps) {
  const a11yLabel =
    `Itinéraire${recommended ? ' recommandé' : ''}. ` +
    `Départ ${depart}, arrivée ${arrive}, durée ${duration}.` +
    (accessible ? ' Itinéraire accessible PMR.' : '');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        recommended && styles.cardRecommended,
        pressed && styles.cardPressed,
      ]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      {/* Times row */}
      <View style={styles.timesRow}>
        <View style={styles.times}>
          <Text style={styles.time} accessibilityLabel={`Départ ${depart}`}>{depart}</Text>
          <Icon name="arrow-right" size={18} color={DS.textMuted} />
          <Text style={styles.time} accessibilityLabel={`Arrivée ${arrive}`}>{arrive}</Text>
        </View>
        <View style={styles.right}>
          {recommended && <Badge tone="brand">Recommandé</Badge>}
          <Text style={styles.duration}>{duration}</Text>
        </View>
      </View>

      {/* Legs */}
      {legs.length > 0 && (
        <View style={styles.legs} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {legs.map((leg, i) => (
            <View key={i} style={styles.legItem}>
              {i > 0 && <Icon name="chevron-right" size={16} color={DS.textMuted} />}
              {leg.walk != null ? (
                <View style={styles.walkLeg}>
                  <Icon name="accessibility" size={18} color={DS.textMuted} />
                  <Text style={styles.walkText}>{leg.walk} min</Text>
                </View>
              ) : (
                <LineBadge mode={leg.mode as any} line={leg.line!} size="sm" />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Accessibility flag */}
      {accessible && (
        <View style={styles.a11yRow}>
          <Icon name="accessibility" size={18} color={DS.successText} label="Accessible PMR" />
          <Text style={styles.a11yText}>Itinéraire accessible (PMR)</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusLg,
    borderWidth: 1.5,
    borderColor: DS.borderSubtle,
    padding: DS.space5,
    gap: DS.space3,
    shadowColor: DS.anthracite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRecommended: {
    borderColor: DS.actionPrimary,
  },
  cardPressed: {
    borderColor: DS.borderBrand,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DS.space3,
  },
  times: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
  },
  time: {
    fontWeight: '700',
    fontSize: 22,
    color: DS.textStrong,
    letterSpacing: -0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
  },
  duration: {
    fontSize: 17,
    fontWeight: '600',
    color: DS.textStrong,
  },
  legs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: DS.space1,
  },
  legItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space1,
  },
  walkLeg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walkText: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.textMuted,
  },
  a11yRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space2,
  },
  a11yText: {
    fontSize: 13,
    fontWeight: '600',
    color: DS.successText,
  },
});