import { SymbolView } from "expo-symbols";
import { Platform, StyleProp, ViewStyle } from "react-native";

// Maps design-system icon names to platform-specific symbol names
const SYMBOL_MAP: Record<
  string,
  { ios: string; android: string; web: string }
> = {
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  clock: { ios: "clock", android: "schedule", web: "schedule" },
  "arrow-right": {
    ios: "arrow.right",
    android: "arrow_forward",
    web: "arrow_forward",
  },
  "arrow-left": { ios: "arrow.left", android: "arrow_back", web: "arrow_back" },
  "chevron-right": {
    ios: "chevron.right",
    android: "chevron_right",
    web: "chevron_right",
  },
  "chevron-down": {
    ios: "chevron.down",
    android: "expand_more",
    web: "expand_more",
  },
  menu: { ios: "line.3.horizontal", android: "menu", web: "menu" },
  x: { ios: "xmark", android: "close", web: "close" },
  close: { ios: "xmark", android: "close", web: "close" },
  globe: { ios: "globe", android: "language", web: "language" },
  "map-pin": { ios: "mappin", android: "location_on", web: "location_on" },
  accessibility: {
    ios: "figure.roll",
    android: "accessibility",
    web: "accessibility",
  },
  "arrow-up-down": {
    ios: "arrow.up.arrow.down",
    android: "swap_vert",
    web: "swap_vert",
  },
  "swap-vertical": {
    ios: "arrow.up.arrow.down",
    android: "swap_vert",
    web: "swap_vert",
  },
  star: { ios: "star", android: "star", web: "star" },
  check: { ios: "checkmark", android: "check", web: "check" },
  checkmark: { ios: "checkmark", android: "check", web: "check" },
  info: { ios: "info.circle", android: "info", web: "info" },
  "alert-triangle": {
    ios: "exclamationmark.triangle",
    android: "warning",
    web: "warning",
  },
  warning: {
    ios: "exclamationmark.triangle",
    android: "warning",
    web: "warning",
  },
  ticket: {
    ios: "ticket",
    android: "confirmation_number",
    web: "confirmation_number",
  },
  bus: { ios: "bus", android: "directions_bus", web: "directions_bus" },
  "location-pin": { ios: "mappin", android: "location_on", web: "location_on" },
  person: {
    ios: "person.circle",
    android: "account_circle",
    web: "account_circle",
  },
  "user-plus": {
    ios: "person.badge.plus",
    android: "person_add",
    web: "person_add",
  },
  camera: { ios: "camera", android: "photo_camera", web: "photo_camera" },
  upload: {
    ios: "arrow.up.doc",
    android: "upload_file",
    web: "upload_file",
  },
  refresh: {
    ios: "arrow.clockwise",
    android: "refresh",
    web: "refresh",
  },
  link: {
    ios: "arrow.up.right.square",
    android: "open_in_new",
    web: "open_in_new",
  },
  receipt: { ios: "doc.text", android: "receipt", web: "receipt" },
  creditcard: { ios: "creditcard", android: "credit_card", web: "credit_card" },

  "log-out": {
    ios: "rectangle.portrait.and.arrow.right",
    android: "logout",
    web: "logout",
  },
  "log-in": { ios: "arrow.right.to.line", android: "login", web: "login" },
  lock: { ios: "lock", android: "lock", web: "lock" },

  "chevron-left": {
    ios: "chevron.left",
    android: "chevron_left",
    web: "chevron_left",
  },
  home: { ios: "house", android: "home", web: "home" },
  post: { ios: "envelope", android: "mail", web: "mail" },
  mic: { ios: "mic", android: "mic", web: "mic" },
  "mic-off": { ios: "mic.slash", android: "mic_off", web: "mic_off" },
  volume: { ios: "speaker.wave.2", android: "volume_up", web: "volume_up" },
};

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 24, color, label, style }: IconProps) {
  const sym = SYMBOL_MAP[name] ?? { ios: name, android: name, web: name };
  const symbolName = Platform.OS === 'ios' ? sym.ios : Platform.OS === 'android' ? sym.android : sym.web;
  return (
    <SymbolView
      name={symbolName as any}
      size={size}
      tintColor={color}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? "yes" : "no-hide-descendants"}
      style={style}
    />
  );
}
