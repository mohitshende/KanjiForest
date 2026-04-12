import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { useDatabase } from '@/hooks/useDatabase';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProgressStore } from '@/stores/useProgressStore';
import { useStreakStore } from '@/stores/useStreakStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'NotoSansJP-Regular': require('../assets/fonts/NotoSansJP-Regular.ttf'),
    'NotoSansJP-Bold': require('../assets/fonts/NotoSansJP-Bold.ttf'),
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  const { isReady: dbReady } = useDatabase();
  const [storesReady, setStoresReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (dbReady) {
      Promise.all([
        useSettingsStore.getState().loadSettings(),
        useProgressStore.getState().loadProgress(),
        useStreakStore.getState().loadStreak(),
        useNotificationStore.getState().loadNotifications(),
      ]).then(() => setStoresReady(true));
    }
  }, [dbReady]);

  useEffect(() => {
    if (loaded && dbReady && storesReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbReady, storesReady]);

  if (!loaded || !dbReady || !storesReady) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  useEffect(() => {
    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [onboardingComplete, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="kanji/[id]" />
      <Stack.Screen name="vocab/[id]" />
      <Stack.Screen name="games" />
      <Stack.Screen name="lists" />
      <Stack.Screen
        name="onboarding/index"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="furigana" />
      <Stack.Screen name="compare" />
      <Stack.Screen name="radicals/[id]" />
    </Stack>
  );
}
