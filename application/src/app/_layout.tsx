import '@/setup/fonts';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { DS } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth';
import { I18nProvider } from '@/contexts/i18n';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: DS.surfacePage,
        }}
      >
        <ActivityIndicator size="large" color={DS.actionPrimary} />
      </View>
    );
  }

  return token ? <AppTabs /> : <AuthScreen />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = Font.useFonts({
    'Raleway': require('@/assets/fonts/Raleway-Regular.ttf'),
    'Raleway-SemiBold': require('@/assets/fonts/Raleway-SemiBold.ttf'),
    'Raleway-Bold': require('@/assets/fonts/Raleway-Bold.ttf'),
    'Raleway-ExtraBold': require('@/assets/fonts/Raleway-ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <I18nProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <AuthGate />
        </ThemeProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
