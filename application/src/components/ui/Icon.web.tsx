import { StyleProp, ViewStyle } from 'react-native';

const SYMBOL_MAP: Record<string, string> = {
  search: 'search',
  clock: 'schedule',
  'arrow-right': 'arrow_forward',
  'arrow-left': 'arrow_back',
  'chevron-right': 'chevron_right',
  'chevron-down': 'expand_more',
  'chevron-left': 'chevron_left',
  menu: 'menu',
  x: 'close',
  close: 'close',
  globe: 'language',
  'map-pin': 'location_on',
  accessibility: 'accessibility',
  'arrow-up-down': 'swap_vert',
  'swap-vertical': 'swap_vert',
  star: 'star',
  check: 'check',
  checkmark: 'check',
  info: 'info',
  'alert-triangle': 'warning',
  warning: 'warning',
  ticket: 'confirmation_number',
  bus: 'directions_bus',
  'location-pin': 'location_on',
  person: 'account_circle',
  'user-plus': 'person_add',
  camera: 'photo_camera',
  upload: 'upload_file',
  refresh: 'refresh',
  link: 'open_in_new',
  receipt: 'receipt',
  creditcard: 'credit_card',
  'log-out': 'logout',
  'log-in': 'login',
  lock: 'lock',
  home: 'home',
  post: 'mail',
  mic: 'mic',
  'mic-off': 'mic_off',
  volume: 'volume_up',
  plus: 'add',
};

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 24, color, label }: IconProps) {
  const symbol = SYMBOL_MAP[name] ?? name;
  return (
    <span
      className="material-symbols-outlined"
      aria-label={label}
      aria-hidden={!label}
      style={{
        fontSize: size,
        color,
        userSelect: 'none',
        fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        lineHeight: 1,
      }}
    >
      {symbol}
    </span>
  );
}
