import { Platform, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";

import { DS } from "@/constants/theme";

type GradientPassCardProps = {
  /** Bloc du haut (icône, type, badge, bouton...) — rendu avant le contenu */
  header: ReactNode;
  /** Contenu central (nom du bénéficiaire, validité, etc.) */
  content: ReactNode;
  /** Bloc du bas, séparé du contenu par une ligne */
  footer: ReactNode;
};

/**
 * Wrapper visuel pour les cartes "pass actif" : porte le fond dégradé bleu
 * et la séparation entre le contenu central et le footer. Le header reste
 * géré par l'appelant (ActivePassCard), ce composant ne s'occupe que du
 * fond et de la structure content/footer.
 */
export function GradientPassCard({
  header,
  content,
  footer,
}: GradientPassCardProps) {
  const gradientStyle =
    Platform.OS === "web"
      ? ({
          backgroundImage:
            "linear-gradient(135deg, #1972D2 0%, #1242A7 50%, #0B1F5E 100%)",
        } as any)
      : {};

  return (
    <View style={[styles.card, gradientStyle]}>
      {header}
      <View style={styles.content}>{content}</View>
      <View style={styles.footer}>{footer}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1242A7",
    borderRadius: DS.radiusMd,
    padding: DS.space5,
    gap: DS.space2,
  },
  content: {
    gap: DS.space2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space4,
    marginTop: DS.space2,
    paddingTop: DS.space3,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    flexWrap: "wrap",
  },
});
