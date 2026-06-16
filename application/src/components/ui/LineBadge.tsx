import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { DS, Transit } from '@/constants/theme';

type TransitMode = 'metro' | 'rer' | 'tram' | 'bus' | 'train' | 'noctilien' | 'walk';

const SIZES = { sm: 24, md: 32, lg: 40 } as const;
const FONT_SIZES = { sm: 12, md: 16, lg: 20 } as const;

function resolveColor(mode: TransitMode, line: string | number) {
  if (mode === 'metro') {
    const key = Number(line) as keyof typeof Transit.metro;
    return Transit.metro[key] ?? Transit.modes.metro;
  }
  if (mode === 'rer') {
    const key = String(line).toUpperCase() as keyof typeof Transit.rer;
    return Transit.rer[key] ?? Transit.modes.rer;
  }
  return Transit.modes[mode] ?? Transit.modes.metro;
}

const MODE_LABELS: Record<string, string> = {
  metro: 'Métro',
  rer: 'RER',
  tram: 'Tramway',
  bus: 'Bus',
  train: 'Train',
  noctilien: 'Noctilien',
  walk: 'À pied',
};

type LineBadgeProps = {
  mode?: TransitMode;
  line: string | number;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

export function LineBadge({ mode = 'metro', line, size = 'md', style }: LineBadgeProps) {
  const dim = SIZES[size];
  const fontSize = FONT_SIZES[size];
  const { bg, text } = resolveColor(mode, line);
  const borderRadius = mode === 'metro' ? dim / 2 : mode === 'rer' ? DS.radiusSm : DS.radiusXs;
  const modeLabel = MODE_LABELS[mode] ?? mode;

  return (
    <View
      style={[
        styles.base,
        {
          width: dim,
          height: dim,
          borderRadius,
          backgroundColor: bg,
          minWidth: dim,
        },
        style,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${modeLabel} ${line}`}
    >
      <Text style={[styles.label, { color: text, fontSize }]}>
        {line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  label: {
    fontWeight: '700',
    lineHeight: undefined,
    letterSpacing: -0.3,
  },
});