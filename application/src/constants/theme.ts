import '@/global.css';

import { Platform } from 'react-native';

// Design system color tokens — Comutitres / IDF Mobilités
// Source: "Référentiel couleurs" brand sheet (WCAG 2.1 AA throughout)
export const DS = {
  // Brand blues
  blueIdf: '#64B5F6',
  blueInteraction: '#1972D2',
  blueFocus: '#0050AA',
  anthracite: '#25303B',
  bluePale: '#F5F9FF',
  blueSoft: '#DEEEFF',

  // Greys
  grey900: '#25303B',
  grey700: '#53606E',
  grey300: '#DDDDDD',
  grey200: '#F0F0F0',
  grey100: '#F9F9F9',
  white: '#FFFFFF',

  // Surfaces
  surfacePage: '#F9F9F9',
  surfaceCard: '#FFFFFF',
  surfaceTint: '#F5F9FF',
  surfaceSelected: '#DEEEFF',
  surfaceInverse: '#25303B',

  // Text (all pairs WCAG AA on their expected backgrounds)
  textStrong: '#25303B',
  textBody: '#2D3742',
  textMuted: '#53606E',
  textInverse: '#FFFFFF',
  textLink: '#1972D2',

  // Actions
  actionPrimary: '#1972D2',
  actionPrimaryHover: '#0050AA',
  actionPrimaryActive: '#003E84',
  actionPrimaryText: '#FFFFFF',

  // Borders
  borderSubtle: '#DDDDDD',
  borderDefault: '#C4CCD4',
  borderBrand: '#1972D2',

  // Focus (accessibility-critical — 3 px ring)
  focusRing: '#0050AA',

  // Feedback
  success: '#007D44',
  successTint: '#E3F4EA',
  successText: '#045C34',
  warning: '#F39224',
  warningTint: '#FEF1E0',
  warningText: '#8A4D00',
  danger: '#C52625',
  dangerTint: '#FBE7E7',
  dangerText: '#9E1F1E',
  infoTint: '#DEEEFF',
  infoText: '#0050AA',

  // Spacing (4px base grid)
  space1: 4,
  space2: 8,
  space3: 12,
  space4: 16,
  space5: 24,
  space6: 32,
  space7: 40,
  space8: 48,
  space9: 64,

  // Radii
  radiusXs: 4,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusPill: 999,

  // Target min (WCAG 2.5.5)
  targetMin: 44,
} as const;

// Transit line livery colors — official Île-de-France network
export const Transit = {
  metro: {
    1:  { bg: '#FFCE00', text: '#25303B' },
    2:  { bg: '#0064B0', text: '#FFFFFF' },
    3:  { bg: '#9F9825', text: '#FFFFFF' },
    4:  { bg: '#C04191', text: '#FFFFFF' },
    5:  { bg: '#F28E42', text: '#25303B' },
    6:  { bg: '#83C491', text: '#25303B' },
    7:  { bg: '#F3A4BA', text: '#25303B' },
    8:  { bg: '#CEADD2', text: '#25303B' },
    9:  { bg: '#D5C900', text: '#25303B' },
    10: { bg: '#E3B32A', text: '#25303B' },
    11: { bg: '#8D5E2A', text: '#FFFFFF' },
    12: { bg: '#00814F', text: '#FFFFFF' },
    13: { bg: '#98D4E2', text: '#25303B' },
    14: { bg: '#662483', text: '#FFFFFF' },
  },
  rer: {
    A: { bg: '#E2231A', text: '#FFFFFF' },
    B: { bg: '#5291CE', text: '#FFFFFF' },
    C: { bg: '#FFCE00', text: '#25303B' },
    D: { bg: '#00814F', text: '#FFFFFF' },
    E: { bg: '#A0006E', text: '#FFFFFF' },
  },
  modes: {
    metro:     { bg: '#003CA6', text: '#FFFFFF' },
    rer:       { bg: '#E2231A', text: '#FFFFFF' },
    train:     { bg: '#7DC242', text: '#25303B' },
    tram:      { bg: '#7F3F98', text: '#FFFFFF' },
    bus:       { bg: '#008B5B', text: '#FFFFFF' },
    noctilien: { bg: '#29235C', text: '#FFFFFF' },
    walk:      { bg: '#53606E', text: '#FFFFFF' },
  },
} as const;

// Legacy theme kept for backward-compat with existing themed components
export const Colors = {
  light: {
    text: DS.textStrong,
    background: DS.surfacePage,
    backgroundElement: DS.grey200,
    backgroundSelected: DS.surfaceSelected,
    textSecondary: DS.textMuted,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Raleway',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  android: {
    sans: 'Raleway',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  default: {
    sans: 'Raleway',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1200;