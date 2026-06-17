import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { DS } from "@/constants/theme";
import { authApi } from "@/lib/api/auth";

function getTokenFromUrl(): string | null {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("token");
  }
  return null;
}

export default function ResetPasswordScreen() {
  const [token] = useState<string | null>(getTokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (busy) return;
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!token) {
      setError("Lien de réinitialisation invalide.");
      return;
    }

    setBusy(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lien invalide ou expiré.");
    } finally {
      setBusy(false);
    }
  };

  const goToLogin = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <SafeAreaView
        edges={Platform.OS === "web" ? [] : ["top"]}
        style={styles.safe}
      >
        <View style={styles.inner}>
          <Image
            source={require("@/assets/images/logo/comutitres_v_couleur.svg")}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Comutitres"
          />

          {done ? (
            <Card style={styles.successCard}>
              <Icon name="check-circle" size={36} color={DS.actionPrimary} />
              <Text style={styles.successTitle}>Mot de passe modifié !</Text>
              <Text style={styles.successBody}>
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez
                maintenant vous connecter.
              </Text>
              <Button size="lg" fullWidth leadingIcon="log-in" onPress={goToLogin}>
                Se connecter
              </Button>
            </Card>
          ) : (
            <>
              <Text style={styles.title} accessibilityRole="header">
                Nouveau mot de passe
              </Text>
              <Text style={styles.subtitle}>
                Choisissez un nouveau mot de passe pour votre compte.
              </Text>

              <Card style={styles.card}>
                <Input
                  label="Nouveau mot de passe"
                  leadingIcon="lock"
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Input
                  label="Confirmer le mot de passe"
                  leadingIcon="lock"
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={error ?? undefined}
                />

                <Button
                  size="lg"
                  fullWidth
                  leadingIcon="check"
                  onPress={handleReset}
                  disabled={busy}
                >
                  Réinitialiser le mot de passe
                </Button>
              </Card>

              <Pressable
                onPress={goToLogin}
                accessibilityRole="button"
                style={styles.backRow}
              >
                <Text style={styles.backText}>
                  <Text style={styles.backLink}>← Retour à la connexion</Text>
                </Text>
              </Pressable>

              {busy && (
                <View style={styles.busyRow}>
                  <ActivityIndicator color={DS.actionPrimary} />
                </View>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: DS.surfacePage },
  content: { flexGrow: 1, justifyContent: "center" },
  safe: { flex: 1, justifyContent: "center" },
  inner: {
    paddingHorizontal: DS.space5,
    paddingVertical: DS.space7,
    gap: DS.space3,
    alignSelf: "center",
    width: "100%",
    maxWidth: 460,
  },
  logo: { height: 44, width: 120, marginBottom: DS.space2 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: DS.textStrong,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: DS.textMuted,
    lineHeight: 22,
    marginBottom: DS.space2,
  },
  card: { gap: DS.space4 },
  backRow: {
    minHeight: DS.targetMin,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: { fontSize: 15, color: DS.textBody },
  backLink: { color: DS.actionPrimary, fontWeight: "700" },
  busyRow: { alignItems: "center", paddingVertical: DS.space2 },
  successCard: {
    alignItems: "center",
    gap: DS.space4,
    paddingVertical: DS.space6,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: DS.textStrong,
    textAlign: "center",
  },
  successBody: {
    fontSize: 15,
    color: DS.textMuted,
    lineHeight: 22,
    textAlign: "center",
  },
});
