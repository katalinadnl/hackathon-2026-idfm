import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { DS } from '@/constants/theme';
import { Icon } from './Icon';
import { LineBadge } from './LineBadge';

const STATUS_CONFIG = {
  normal: {
    color: DS.success,
    tint: DS.successTint,
    text: DS.successText,
    icon: 'check',
    label: 'Trafic normal',
  },
  minor: {
    color: DS.warning,
    tint: DS.warningTint,
    text: DS.warningText,
    icon: 'alert-triangle',
    label: 'Trafic perturbé',
  },
  major: {
    color: DS.danger,
    tint: DS.dangerTint,
    text: DS.dangerText,
    icon: 'alert-triangle',
    label: 'Trafic interrompu',
  },
} as const;

type DisruptionStatus = keyof typeof STATUS_CONFIG;

type DisruptionBannerProps = {
  mode?: string;
  line?: string | number;
  status?: DisruptionStatus;
  message?: string;
  style?: StyleProp<ViewStyle>;
};

export function DisruptionBanner({
  mode = 'metro',
  line,
  status = 'normal',
  message,
  style,
}: DisruptionBannerProps) {
  const s = STATUS_CONFIG[status];
  const a11yRole = status === 'major' ? ('alert' as const) : ('none' as const);
  const a11yLabel =
    `${mode} ${line ?? ''}: ${s.label}${message ? '. ' + message : ''}`.trim();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: s.tint, borderLeftColor: s.color },
        style,
      ]}
      accessible
      accessibilityRole={a11yRole}
      accessibilityLabel={a11yLabel}
      accessibilityLiveRegion={status === 'major' ? 'assertive' : 'polite'}
    >
      {line != null && (
        <LineBadge mode={mode as any} line={line} size="md" />
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Icon name={s.icon} size={18} color={s.text} />
          <Text style={[styles.title, { color: s.text }]}>{s.label}</Text>
        </View>
        {message && (
          <Text style={[styles.message, { color: s.text }]}>{message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space3,
    padding: DS.space4,
    borderRadius: DS.radiusMd,
    borderLeftWidth: 4,
  },
  content: {
    flex: 1,
    gap: DS.space1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});