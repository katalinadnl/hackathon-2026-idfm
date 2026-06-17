import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { DS } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";

const DESKTOP_BP = 768;
type Mode = "login" | "register";

export function AuthScreen() {
  const { login, register, loginWithFranceConnect } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;

  const [mode, setMode] = useState<Mode>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  const switchMode = () => {
    setError(null);
    setMode(isLogin ? "register" : "login");
  };

  const handleSubmit = async () => {
    if (busy) return;
    setError(null);

    if (!email.trim() || !password) {
      setError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }
    if (!isLogin && password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setBusy(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  const handleFranceConnect = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await loginWithFranceConnect();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Connexion France Connect impossible.",
      );
    } finally {
      setBusy(false);
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
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
          <Image
            source={require("@/assets/images/logo/comutitres_v_couleur.svg")}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Comutitres"
          />

          <Text style={styles.title} accessibilityRole="header">
            {isLogin ? "Connexion à votre compte" : "Créer votre compte"}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? "Accédez à vos titres, abonnements et trajets enregistrés."
              : "Quelques informations suffisent pour commencer."}
          </Text>

          <Card style={styles.card}>
            {!isLogin && (
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Input
                    label="Prénom"
                    leadingIcon="person"
                    placeholder="Jean"
                    autoCapitalize="words"
                    textContentType="givenName"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={styles.nameField}>
                  <Input
                    label="Nom"
                    leadingIcon="person"
                    placeholder="Dupont"
                    autoCapitalize="words"
                    textContentType="familyName"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
            )}

            <Input
              label="Email"
              leadingIcon="mail"
              placeholder="vous@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Mot de passe"
              leadingIcon="lock"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              textContentType={isLogin ? "password" : "newPassword"}
              value={password}
              onChangeText={setPassword}
              error={error ?? undefined}
            />

            <Button
              size="lg"
              fullWidth
              leadingIcon={isLogin ? "log-in" : "check"}
              onPress={handleSubmit}
              disabled={busy}
            >
              {isLogin ? "Se connecter" : "Créer mon compte"}
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={handleFranceConnect}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="S'identifier avec France Connect"
              style={({ pressed }) => [
                styles.fcButton,
                pressed && styles.fcButtonPressed,
                busy && styles.fcButtonDisabled,
              ]}
            >
              <Icon name="shield" size={22} color={DS.white} />
              <View>
                <Text style={styles.fcButtonKicker}>S'identifier avec</Text>
                <Text style={styles.fcButtonBrand}>FranceConnect</Text>
              </View>
            </Pressable>
            <Text style={styles.fcHelp}>
              FranceConnect est la solution proposée par l’État pour sécuriser
              et simplifier la connexion à vos services en ligne.
            </Text>
          </Card>

          <Pressable
            onPress={switchMode}
            disabled={busy}
            accessibilityRole="button"
            style={styles.switchRow}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Pas encore de compte ? "
                : "Vous avez déjà un compte ? "}
              <Text style={styles.switchLink}>
                {isLogin ? "Créer un compte" : "Se connecter"}
              </Text>
            </Text>
          </Pressable>

          {busy && (
            <View style={styles.busyRow}>
              <ActivityIndicator color={DS.actionPrimary} />
            </View>
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
  },
  innerDesktop: { maxWidth: 460 },
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
  nameRow: { flexDirection: "row", gap: DS.space3 },
  nameField: { flex: 1 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: DS.borderSubtle },
  dividerText: { fontSize: 13, color: DS.textMuted, fontWeight: "600" },
  fcButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    backgroundColor: "#000091", // FranceConnect brand blue
    borderRadius: DS.radiusSm,
    paddingVertical: DS.space3,
    paddingHorizontal: DS.space4,
    minHeight: 52,
  },
  fcButtonPressed: { opacity: 0.85 },
  fcButtonDisabled: { opacity: 0.5 },
  fcButtonKicker: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  fcButtonBrand: { color: DS.white, fontSize: 18, fontWeight: "800" },
  fcHelp: { fontSize: 12, color: DS.textMuted, lineHeight: 18 },
  switchRow: {
    minHeight: DS.targetMin,
    justifyContent: "center",
    alignItems: "center",
  },
  switchText: { fontSize: 15, color: DS.textBody },
  switchLink: { color: DS.actionPrimary, fontWeight: "700" },
  busyRow: { alignItems: "center", paddingVertical: DS.space2 },
});
