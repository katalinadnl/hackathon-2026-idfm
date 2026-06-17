import "@/setup/fonts";
import {
  DarkTheme,
  DefaultTheme,
  Link,
  Slot,
  ThemeProvider,
  usePathname,
} from "expo-router";
import { Image } from "expo-image";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { AuthScreen } from "@/components/auth/AuthScreen";
import { Icon } from "@/components/ui/Icon";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { DS, MaxContentWidth } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/contexts/auth";
import { I18nProvider, useI18n } from "@/contexts/i18n";

SplashScreen.preventAutoHideAsync();

export default function WebLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = Font.useFonts({
    Raleway: require("@/assets/fonts/Raleway-Regular.ttf"),
    "Raleway-SemiBold": require("@/assets/fonts/Raleway-SemiBold.ttf"),
    "Raleway-Bold": require("@/assets/fonts/Raleway-Bold.ttf"),
    "Raleway-ExtraBold": require("@/assets/fonts/Raleway-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <I18nProvider>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AuthGate />
        </ThemeProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

function AuthGate() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={DS.actionPrimary} />
      </View>
    );
  }

  if (!token) return <AuthScreen />;

  return (
    <View style={styles.root}>
      <SiteHeader />
      <View style={styles.pageSlot}>
        <Slot />
      </View>
    </View>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href as any} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.navLink,
          pressed && styles.navLinkPressed,
        ]}
        accessibilityRole="link"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={children}
      >
        <Text
          style={[styles.navLinkText, isActive && styles.navLinkTextActive]}
        >
          {children}
        </Text>
        {isActive && <View style={styles.navLinkIndicator} />}
      </Pressable>
    </Link>
  );
}

function AccountMenu() {
  const { user, logout } = useAuth();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;

  return (
    <View style={styles.account}>
      <View style={styles.accountInfo}>
        <Icon name="person" size={22} color={DS.actionPrimary} />
        <Text style={styles.accountName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Pressable
        onPress={logout}
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
        style={({ pressed }) => [
          styles.logoutBtn,
          pressed && styles.logoutBtnPressed,
        ]}
      >
        <Icon name="log-out" size={18} color={DS.danger} />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </Pressable>
    </View>
  );
}

function SiteHeader() {
  const { lang, setLang } = useI18n();

  return (
    <View style={styles.header} accessible={false}>
      <View style={styles.inner}>
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Comutitres — accueil"
          >
            <Image
              source={require("@/assets/images/logo/comutitres_v_couleur.svg")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="Comutitres"
            />
          </Pressable>
        </Link>

        <View style={styles.nav}>
          <NavLink href="/">Accueil</NavLink>
          <NavLink href="/visitors">Visiteurs</NavLink>
          <NavLink href="/uikit">UI Kit</NavLink>
          <NavLink href="/billing">Facturation</NavLink>
        </View>

        <View style={styles.right}>
          <NavLink href="/dashboard">Mon espace</NavLink>
          <LanguageSwitcher value={lang} onChange={setLang as any} />
          <AccountMenu />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DS.surfacePage,
  },
  root: {
    flex: 1,
    backgroundColor: DS.surfacePage,
  },
  pageSlot: {
    flex: 1,
  },
  header: {
    position: "sticky" as any,
    top: 0,
    zIndex: 40,
    width: "100%",
    backgroundColor: DS.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
    shadowColor: DS.anthracite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    height: 72,
    maxWidth: MaxContentWidth,
    marginHorizontal: "auto" as any,
    paddingHorizontal: DS.space5,
    gap: DS.space4,
    width: "100%",
  },
  logo: {
    height: 40,
    width: 100,
    marginRight: DS.space2,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space4,
    flex: 1,
  },
  navLink: {
    flexDirection: "column",
    paddingHorizontal: DS.space4,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: DS.space2,
  },
  navLinkPressed: {
    opacity: 0.75,
  },
  navLinkText: {
    fontSize: 15,
    fontWeight: "600",
    color: DS.textStrong,
  },
  navLinkTextActive: {
    color: DS.actionPrimary,
  },
  navLinkIndicator: {
    alignSelf: "stretch",
    height: 3,
    borderRadius: 2,
    backgroundColor: DS.actionPrimary,
  },
  right: {
    gap: DS.space1,
    marginLeft: "auto" as any,
    flexDirection: "row",
    alignItems: "center",
  },
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    maxWidth: 180,
  },
  accountName: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    paddingHorizontal: DS.space3,
    paddingVertical: DS.space2,
    borderRadius: DS.radiusSm,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
  },
  logoutBtnPressed: {
    backgroundColor: DS.dangerTint,
    borderColor: DS.danger,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.danger,
  },
});
