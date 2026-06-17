import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { authApi } from "@/lib/api/auth";

const DESKTOP_BP = 768;

type Mode = "login" | "register" | "otp" | "forgot" | "forgot-sent" | "reset" | "reset-done";

function getResetTokenFromUrl(): string | null {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("reset-token");
  }
  return null;
}

export function AuthScreen() {
  const { login, verifyOtp, forgotPassword, register, loginWithFranceConnect } =
    useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;

  const [mode, setMode] = useState<Mode>("login");

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Register-only fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // OTP
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const otpInputRef = useRef<TextInput>(null);

  // Reset password
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Détection du token de reset dans l'URL après montage (client uniquement)
  useEffect(() => {
    const token = getResetTokenFromUrl();
    if (token) {
      setResetToken(token);
      setMode("reset");
    }
  }, []);

  const go = (next: Mode) => {
    setError(null);
    setMode(next);
  };

  // ── Login ─────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    if (busy) return;
    setError(null);
    if (!email.trim() || !password) {
      setError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }
    setBusy(true);
    try {
      const { requires2FA } = await login(email, password);
      if (requires2FA) {
        setOtpEmail(email.trim().toLowerCase());
        setOtpCode("");
        go("otp");
        setTimeout(() => otpInputRef.current?.focus(), 300);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────

  const handleRegister = async () => {
    if (busy) return;
    setError(null);
    if (!email.trim() || !password) {
      setError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setBusy(true);
    try {
      await register({
        email,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  // ── OTP ───────────────────────────────────────────────────────────────────

  const handleVerifyOtp = async () => {
    if (busy) return;
    setError(null);
    if (otpCode.length !== 6) {
      setError("Le code doit contenir 6 chiffres.");
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(otpEmail, otpCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code invalide ou expiré.");
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await login(otpEmail, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de renvoyer le code.");
    } finally {
      setBusy(false);
    }
  };

  // ── Forgot password ───────────────────────────────────────────────────────

  const handleForgotPassword = async () => {
    if (busy) return;
    setError(null);
    if (!email.trim()) {
      setError("Veuillez renseigner votre email.");
      return;
    }
    setBusy(true);
    try {
      await forgotPassword(email);
      go("forgot-sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  // ── Reset password ────────────────────────────────────────────────────────

  const handleResetPassword = async () => {
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
    if (!resetToken) {
      setError("Lien de réinitialisation invalide.");
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword({ token: resetToken, newPassword });
      go("reset-done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lien invalide ou expiré.");
    } finally {
      setBusy(false);
    }
  };

  // ── France Connect ────────────────────────────────────────────────────────

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

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderHeader = (title: string, subtitle: string) => (
    <>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </>
  );

  const renderBackToLogin = (label = "Retour à la connexion") => (
    <Pressable
      onPress={() => go("login")}
      accessibilityRole="button"
      style={styles.switchRow}
    >
      <Text style={styles.switchText}>
        <Text style={styles.switchLink}>← {label}</Text>
      </Text>
    </Pressable>
  );

  // ── OTP screen ────────────────────────────────────────────────────────────

  if (mode === "otp") {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={Platform.OS === "web" ? [] : ["top"]} style={styles.safe}>
          <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
            <Logo />
            {renderHeader(
              "Vérification en deux étapes",
              `Un code à 6 chiffres a été envoyé à ${otpEmail}. Saisissez-le ci-dessous.`,
            )}

            <Card style={styles.card}>
              <View style={styles.otpWrapper}>
                <Text style={styles.label}>Code de vérification</Text>
                <TextInput
                  ref={otpInputRef}
                  style={styles.otpInput}
                  value={otpCode}
                  onChangeText={(v) => setOtpCode(v.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="• • • • • •"
                  placeholderTextColor={DS.textMuted}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <Button
                size="lg"
                fullWidth
                leadingIcon="shield"
                onPress={handleVerifyOtp}
                disabled={busy || otpCode.length !== 6}
              >
                Valider le code
              </Button>

              <Pressable onPress={handleResendOtp} disabled={busy} style={styles.resendRow}>
                <Text style={styles.resendText}>
                  Vous n&apos;avez pas reçu le code ?{" "}
                  <Text style={styles.switchLink}>Renvoyer</Text>
                </Text>
              </Pressable>
            </Card>

            {renderBackToLogin()}
            {busy && <BusyRow />}
          </View>
        </SafeAreaView>
      </ScrollView>
    );
  }

  // ── Forgot password screen ────────────────────────────────────────────────

  if (mode === "forgot") {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={Platform.OS === "web" ? [] : ["top"]} style={styles.safe}>
          <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
            <Logo />
            {renderHeader(
              "Mot de passe oublié",
              "Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.",
            )}

            <Card style={styles.card}>
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
                error={error ?? undefined}
              />

              <Button
                size="lg"
                fullWidth
                leadingIcon="send"
                onPress={handleForgotPassword}
                disabled={busy}
              >
                Envoyer le lien
              </Button>
            </Card>

            {renderBackToLogin()}
            {busy && <BusyRow />}
          </View>
        </SafeAreaView>
      </ScrollView>
    );
  }

  // ── Forgot sent confirmation ───────────────────────────────────────────────

  if (mode === "forgot-sent") {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={Platform.OS === "web" ? [] : ["top"]} style={styles.safe}>
          <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
            <Logo />

            <Card style={[styles.card, styles.successCard]}>
              <Icon name="mail" size={36} color={DS.actionPrimary} />
              <Text style={styles.successTitle}>Email envoyé !</Text>
              <Text style={styles.successBody}>
                Si un compte existe avec cette adresse, vous recevrez un lien de
                réinitialisation dans quelques instants. Pensez à vérifier vos
                spams.
              </Text>
            </Card>

            {renderBackToLogin()}
          </View>
        </SafeAreaView>
      </ScrollView>
    );
  }

  // ── Reset password screen ────────────────────────────────────────────────

  if (mode === "reset") {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={Platform.OS === "web" ? [] : ["top"]} style={styles.safe}>
          <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
            <Logo />
            {renderHeader("Nouveau mot de passe", "Choisissez un nouveau mot de passe pour votre compte.")}
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
              <Button size="lg" fullWidth leadingIcon="check" onPress={handleResetPassword} disabled={busy}>
                Réinitialiser le mot de passe
              </Button>
            </Card>
            {renderBackToLogin()}
            {busy && <BusyRow />}
          </View>
        </SafeAreaView>
      </ScrollView>
    );
  }

  if (mode === "reset-done") {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SafeAreaView edges={Platform.OS === "web" ? [] : ["top"]} style={styles.safe}>
          <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
            <Logo />
            <Card style={[styles.card, styles.successCard]}>
              <Icon name="check-circle" size={36} color={DS.actionPrimary} />
              <Text style={styles.successTitle}>Mot de passe modifié !</Text>
              <Text style={styles.successBody}>
                Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.
              </Text>
              <Button size="lg" fullWidth leadingIcon="log-in" onPress={() => go("login")}>
                Se connecter
              </Button>
            </Card>
          </View>
        </SafeAreaView>
      </ScrollView>
    );
  }

  // ── Login / Register screen ───────────────────────────────────────────────

  const isLogin = mode === "login";

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
          <Logo />

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

            <View>
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
              {isLogin && (
                <Pressable
                  onPress={() => {
                    setError(null);
                    go("forgot");
                  }}
                  accessibilityRole="button"
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                </Pressable>
              )}
            </View>

            <Button
              size="lg"
              fullWidth
              leadingIcon={isLogin ? "log-in" : "check"}
              onPress={isLogin ? handleLogin : handleRegister}
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
                <Text style={styles.fcButtonKicker}>
                  S&apos;identifier avec
                </Text>
                <Text style={styles.fcButtonBrand}>FranceConnect</Text>
              </View>
            </Pressable>
            <Text style={styles.fcHelp}>
              FranceConnect est la solution proposée par l'État pour sécuriser
              et simplifier la connexion à vos services en ligne.
            </Text>
          </Card>

          <Pressable
            onPress={() => {
              setError(null);
              setMode(isLogin ? "register" : "login");
            }}
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

          {busy && <BusyRow />}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

// ── Small shared components ──────────────────────────────────────────────────

function Logo() {
  return (
    <Image
      source={require("@/assets/images/logo/comutitres_v_couleur.svg")}
      style={styles.logo}
      contentFit="contain"
      accessibilityLabel="Comutitres"
    />
  );
}

function BusyRow() {
  return (
    <View style={styles.busyRow}>
      <ActivityIndicator color={DS.actionPrimary} />
    </View>
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
  forgotLink: { alignSelf: "flex-end", marginTop: DS.space1 },
  forgotText: { fontSize: 13, color: DS.actionPrimary, fontWeight: "600" },
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
    backgroundColor: "#000091",
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
  // OTP
  otpWrapper: { gap: DS.space2 },
  label: { fontSize: 14, fontWeight: "600", color: DS.textStrong },
  otpInput: {
    height: 64,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    borderRadius: DS.radiusSm,
    paddingHorizontal: DS.space4,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 16,
    color: DS.textStrong,
    textAlign: "center",
    backgroundColor: DS.surfaceCard,
  },
  errorText: { fontSize: 13, color: DS.danger, lineHeight: 18 },
  resendRow: { alignItems: "center" },
  resendText: { fontSize: 13, color: DS.textMuted },
  // Success states
  successCard: { alignItems: "center", gap: DS.space4, paddingVertical: DS.space6 },
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
