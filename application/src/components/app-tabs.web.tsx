import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { DS, MaxContentWidth } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n';

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1 }}>
      <SiteHeader />
      <TabSlot style={{ flex: 1 }} />
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.navLink,
        isFocused && styles.navLinkActive,
        pressed && styles.navLinkPressed,
      ]}
      accessible
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
    >
      <Text style={[styles.navLinkText, isFocused && styles.navLinkTextActive]}>
        {children}
      </Text>
      {isFocused && <View style={styles.navLinkIndicator} />}
    </Pressable>
  );
}

function SiteHeader() {
  const { lang, setLang } = useI18n();

  return (
    <View style={styles.header} accessible={false}>
      <View style={styles.inner}>
        <Text style={styles.brand} accessibilityRole="header">
          Comutitres
        </Text>

        <TabList style={styles.nav}>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Accueil</TabButton>
          </TabTrigger>
          <TabTrigger name="visitors" href="/visitors" asChild>
            <TabButton>Visiteurs</TabButton>
          </TabTrigger>
        </TabList>

        <View style={styles.right}>
          <LanguageSwitcher value={lang} onChange={setLang as any} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'sticky' as any,
    top: 0,
    zIndex: 40,
    width: '100%',
    backgroundColor: DS.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
    shadowColor: DS.anthracite,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    maxWidth: MaxContentWidth,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: DS.space5,
    gap: DS.space4,
    width: '100%',
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: DS.actionPrimary,
    letterSpacing: -0.5,
    marginRight: DS.space2,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.space1,
    flex: 1,
  },
  navLink: {
    position: 'relative',
    paddingHorizontal: DS.space4,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLinkActive: {},
  navLinkPressed: {
    opacity: 0.75,
  },
  navLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: DS.textStrong,
  },
  navLinkTextActive: {
    color: DS.actionPrimary,
  },
  navLinkIndicator: {
    position: 'absolute',
    bottom: 0,
    left: DS.space4,
    right: DS.space4,
    height: 3,
    borderRadius: 2,
    backgroundColor: DS.actionPrimary,
  },
  right: {
    marginLeft: 'auto' as any,
  },
});
