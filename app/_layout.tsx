import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Expo Router uses this to detect when it's safe to route
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isLandingPage = (segments as string[]).length === 0;

    if (!user && !inAuthGroup && !isLandingPage) {
      // Redirect to the landing page if not authenticated and trying to access protected routes
      router.replace('/');
    } else if (user && (inAuthGroup || isLandingPage)) {
      // Redirect to the dashboard if authenticated and on login or landing pages
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, isNavigationReady]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
