import { Text } from 'react-native';

// Apply Raleway to every Text component on all platforms.
// On web: the font is available via the Google Fonts @import in global.css.
//         Text.defaultProps sets it as an inline style, which beats RNW's
//         injected CSS classes (those can't override inline style specificity).
// On native: the TTF files are loaded via Font.useFonts in _layout.tsx before
//            the app renders; defaultProps kicks in once fonts are ready.
const T = Text as any;
const prev = T.defaultProps?.style;
T.defaultProps = {
  ...(T.defaultProps ?? {}),
  style: [{ fontFamily: 'Raleway' }, prev].filter(Boolean),
};
