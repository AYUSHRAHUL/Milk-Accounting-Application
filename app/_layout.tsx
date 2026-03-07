import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, useFonts } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LogBox } from 'react-native';

// Suppress known React Native Web deprecation warnings that clutter the console
LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  'props.pointerEvents is deprecated',
]);

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
      // Redirect to register if not authenticated and trying to access protected routes
      router.replace('/(auth)/register');
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
        <Stack.Screen
          name="milk-collection/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="milk-collection/history"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="suppliers/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="products/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="sales/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="reports/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="settlement" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <PreferencesProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PreferencesProvider>
  );
}
