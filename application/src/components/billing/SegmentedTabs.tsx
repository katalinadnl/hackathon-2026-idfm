import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DS } from '@/constants/theme';

export type SegmentKey = string;

type Segment = { key: SegmentKey; label: string };

type Props = {
  segments: Segment[];
  active: SegmentKey;
  onChange: (key: SegmentKey) => void;
};

/** Segmented control to switch between the 3 billing tabs. */
export function SegmentedTabs({ segments, active, onChange }: Props) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {segments.map((s) => {
        const selected = s.key === active;
        return (
          <Pressable
            key={s.key}
            onPress={() => onChange(s.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.tabSelected,
              pressed && styles.tabPressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: DS.grey200,
    borderRadius: DS.radiusMd,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    minHeight: DS.targetMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DS.radiusSm,
    paddingHorizontal: DS.space2,
  },
  tabSelected: {
    backgroundColor: DS.surfaceCard,
    shadowColor: DS.anthracite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabPressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.textMuted,
    textAlign: 'center',
  },
  labelSelected: {
    color: DS.actionPrimary,
  },
});