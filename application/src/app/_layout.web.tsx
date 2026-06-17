import "@/setup/fonts";
import {
  DarkTheme,
  DefaultTheme,
  Link,
  Slot,
  ThemeProvider,
  usePathname,
  useRouter,
} from "expo-router";
import { Image } from "expo-image";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

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

function SkipLink() {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => {
        if (typeof document !== "undefined") {
          const el = document.getElementById("main-content");
          if (el) el.focus();
        }
      }}
      accessibilityRole="link"
      accessibilityLabel="Aller au contenu principal"
      style={[styles.skipLink, focused && styles.skipLinkVisible]}
    >
      <Text style={styles.skipLinkText}>Aller au contenu principal</Text>
    </Pressable>
  );
}

function AuthGate() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={DS.actionPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SkipLink />
      <SiteHeader />
      <View style={styles.pageSlot} nativeID="main-content" role="main" {...({ tabIndex: -1 } as any)}>
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
        aria-current={isActive ? 'page' : undefined}
        accessibilityLabel={children}
      >
        <Text style={[styles.navLinkText, isActive && styles.navLinkTextActive]}>
          {children}
        </Text>
        {isActive && <View style={styles.navLinkIndicator} />}
      </Pressable>
    </Link>
  );
}

function UserChip() {
  const { user, logout } = useAuth();
  const firstName = user?.firstName || user?.email?.split("@")[0] || "?";
  const initial = firstName[0].toUpperCase();

  return (
    <View style={styles.userChip}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>{initial}</Text>
      </View>
      <Text style={styles.userName} numberOfLines={1}>
        {firstName}
      </Text>
      <View style={styles.chipSep} />
      <Pressable
        onPress={logout}
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
        style={({ pressed }) => [styles.logoutIconBtn, pressed && styles.logoutIconBtnPressed]}
      >
        <Icon name="log-out" size={16} color={DS.textMuted} />
      </Pressable>
    </View>
  );
}

function AuthButtons() {
  const router = useRouter();

  return (
    <View style={styles.authButtons}>
      <Pressable
        onPress={() => router.push("/login")}
        accessibilityRole="button"
        accessibilityLabel="Se connecter"
        style={({ pressed }) => [styles.btnOutline, pressed && styles.btnPressed]}
      >
        <Text style={styles.btnOutlineText}>Se connecter</Text>
      </Pressable>
    </View>
  );
}

const DESKTOP_BP = 768;

function MobileNavItem({ href, children, onPress }: { href: string; children: string; onPress: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href as any} asChild>
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        aria-current={isActive ? 'page' : undefined}
        style={({ pressed }) => [
          styles.mobileNavItem,
          isActive && styles.mobileNavItemActive,
          pressed && styles.btnPressed,
        ]}
      >
        <Text style={[styles.mobileNavItemText, isActive && styles.mobileNavItemTextActive]}>
          {children}
        </Text>
      </Pressable>
    </Link>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { token, user, logout } = useAuth();
  const router = useRouter();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;

  return (
    <View style={styles.mobileMenuOverlay}>
      <Pressable style={styles.mobileMenuBackdrop} onPress={onClose} />
      <View style={styles.mobileMenuPanel}>
        <MobileNavItem href="/" onPress={onClose}>Accueil</MobileNavItem>
        <MobileNavItem href="/visitors" onPress={onClose}>Visiteurs</MobileNavItem>
        {token && <MobileNavItem href="/billing" onPress={onClose}>Facturation</MobileNavItem>}
        {token && <MobileNavItem href="/dashboard" onPress={onClose}>Mon espace</MobileNavItem>}

        <View style={styles.mobileMenuDivider} />

        {token ? (
          <View style={styles.mobileMenuFooter}>
            <View style={styles.mobileMenuUser}>
              <Icon name="person" size={18} color={DS.actionPrimary} />
              <Text style={styles.mobileMenuUserName} numberOfLines={1}>{name}</Text>
            </View>
            <Pressable
              onPress={() => { onClose(); logout(); }}
              accessibilityRole="button"
              accessibilityLabel="Se déconnecter"
              style={({ pressed }) => [styles.mobileLogoutBtn, pressed && styles.btnPressed]}
            >
              <Icon name="log-out" size={16} color={DS.danger} />
              <Text style={styles.mobileLogoutText}>Déconnexion</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => { onClose(); router.push("/login"); }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.mobileLoginBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnOutlineText}>Se connecter</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SiteHeader() {
  const { token } = useAuth();
  const { lang, setLang } = useI18n();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View style={styles.header} accessible={false}>
        <View style={styles.inner}>
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Comutitres — accueil"
              onPress={() => setMenuOpen(false)}
            >
              <Image
                source={require("@/assets/images/logo/comutitres_v_couleur.svg")}
                style={styles.logo}
                contentFit="contain"
                accessibilityLabel="Comutitres"
              />
            </Pressable>
          </Link>

          {isDesktop ? (
            <>
              <View style={styles.nav}>
                <NavLink href="/">Accueil</NavLink>
                <NavLink href="/visitors">Visiteurs</NavLink>
                {token && <NavLink href="/dashboard">Mon espace</NavLink>}
                {token && <NavLink href="/billing">Facturation</NavLink>}
              </View>

              <View style={styles.right}>
                <LanguageSwitcher value={lang} onChange={setLang as any} />
                {token ? <UserChip /> : <AuthButtons />}
              </View>
            </>
          ) : (
            <View style={styles.mobileRight}>
              <LanguageSwitcher value={lang} onChange={setLang as any} />
              <Pressable
                onPress={() => setMenuOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                style={({ pressed }) => [styles.hamburger, pressed && styles.btnPressed]}
              >
                <Icon name={menuOpen ? "close" : "menu"} size={24} color={DS.textStrong} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {!isDesktop && menuOpen && (
        <MobileMenu onClose={() => setMenuOpen(false)} />
      )}
    </>
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
    outlineWidth: 0,
  },
  skipLink: {
    position: "absolute" as any,
    top: -100,
    left: DS.space4,
    zIndex: 200,
    backgroundColor: DS.actionPrimary,
    borderRadius: DS.radiusSm,
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space2,
  },
  skipLinkVisible: {
    top: DS.space2,
  },
  skipLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: DS.white,
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
    position: "relative" as any,
    paddingHorizontal: DS.space3,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
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
    position: "absolute" as any,
    bottom: 0,
    left: DS.space3,
    right: DS.space3,
    height: 2,
    borderRadius: 1,
    backgroundColor: DS.actionPrimary,
  },
  right: {
    gap: DS.space3,
    marginLeft: "auto" as any,
    flexDirection: "row",
    alignItems: "center",
  },
  userChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    backgroundColor: DS.surfacePage,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    borderRadius: DS.radiusPill,
    paddingLeft: DS.space1,
    paddingRight: DS.space1,
    height: 36,
  },
  userAvatar: {
    width: 26,
    height: 26,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: DS.white,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
    maxWidth: 120,
  },
  chipSep: {
    width: 1,
    height: 18,
    backgroundColor: DS.borderSubtle,
  },
  logoutIconBtn: {
    width: 28,
    height: 28,
    borderRadius: DS.radiusPill,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIconBtnPressed: {
    backgroundColor: DS.dangerTint,
  },
  mobileRight: {
    marginLeft: "auto" as any,
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  hamburger: {
    padding: DS.space2,
    borderRadius: DS.radiusSm,
  },
  mobileMenuOverlay: {
    position: "absolute" as any,
    top: 72,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  mobileMenuBackdrop: {
    position: "absolute" as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: 9999,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  mobileMenuPanel: {
    backgroundColor: DS.surfaceCard,
    paddingVertical: DS.space2,
    paddingHorizontal: DS.space2,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
    shadowColor: DS.anthracite,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  mobileNavItem: {
    paddingHorizontal: DS.space3,
    paddingVertical: DS.space3,
    borderRadius: DS.radiusSm,
  },
  mobileNavItemActive: {
    backgroundColor: DS.surfacePage,
  },
  mobileNavItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: DS.textStrong,
  },
  mobileNavItemTextActive: {
    color: DS.actionPrimary,
  },
  mobileMenuDivider: {
    height: 1,
    backgroundColor: DS.borderSubtle,
    marginVertical: DS.space2,
    marginHorizontal: DS.space1,
  },
  mobileMenuFooter: {
    paddingHorizontal: DS.space3,
    paddingBottom: DS.space2,
    gap: DS.space3,
  },
  mobileMenuUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  mobileMenuUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
    flex: 1,
  },
  mobileLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    paddingVertical: DS.space2,
  },
  mobileLogoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.danger,
  },
  mobileLoginBtn: {
    paddingHorizontal: DS.space3,
    paddingVertical: DS.space3,
    borderRadius: DS.radiusSm,
    borderWidth: 1.5,
    borderColor: DS.actionPrimary,
    alignItems: "center",
    marginHorizontal: DS.space1,
    marginBottom: DS.space1,
  },
  authButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  btnOutline: {
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space2,
    borderRadius: DS.radiusSm,
    borderWidth: 1.5,
    borderColor: DS.actionPrimary,
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: "700",
    color: DS.actionPrimary,
  },
  btnPrimary: {
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space2,
    borderRadius: DS.radiusSm,
    backgroundColor: DS.actionPrimary,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: DS.white,
  },
  btnPressed: {
    opacity: 0.8,
  },
});
