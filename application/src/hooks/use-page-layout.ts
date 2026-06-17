import { useWindowDimensions, type ViewStyle } from 'react-native';

import { DS, MaxContentWidth } from '@/constants/theme';

/** Largeur à partir de laquelle on bascule en mise en page desktop. */
export const DESKTOP_BP = 768;

/**
 * Centre le contenu d'une page sur les grands écrans tout en laissant le fond
 * s'étendre sur toute la largeur. À appliquer sur le conteneur interne, pas sur
 * l'élément qui porte la couleur de fond.
 */
export const pageInner: ViewStyle = {
  width: '100%',
  maxWidth: MaxContentWidth,
  marginHorizontal: 'auto',
};

/**
 * Source unique de vérité pour le padding des pages (mobile-first) et le
 * centrage du contenu. À utiliser dans toutes les pages pour rester cohérent.
 */
export function usePageLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;

  return {
    isDesktop,
    /** Padding horizontal de page : réduit en mobile, élargi en desktop. */
    hPad: isDesktop ? DS.space8 : DS.space5,
    pageInner,
  };
}
