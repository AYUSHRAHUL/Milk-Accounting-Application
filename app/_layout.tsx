import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, useFonts } from '@expo-google-fonts/outfit';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LogBox, View, Platform, PermissionsAndroid } from 'react-native';
import { CustomSplashScreen } from '@/components/SplashScreen';

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
    
    // Request storage permission on Android at start
    if (Platform.OS === 'android') {
      (async () => {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          ]);
          console.log('Storage permissions status:', granted);
        } catch (err) {
          console.warn('Storage permission request failed', err);
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isLandingPage = (segments as string[]).length === 0;

    if (!user && !inAuthGroup && !isLandingPage) {
      // Redirect to login if not authenticated and trying to access protected routes
      router.replace('/(auth)/login');
    } else if (user && (inAuthGroup || isLandingPage)) {
      // Redirect based on role
      if (user.role === 'super-admin') {
        router.replace('/super-admin/dashboard');
      } else if (user.role === 'admin') {
        router.replace('/(tabs)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments, isNavigationReady]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="super-admin" options={{ headerShown: false }} />
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
          name="sales/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="reports/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="report-detailed"
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

  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashScreenComplete, setIsSplashScreenComplete] = useState(false);

  useEffect(() => {
    if (loaded || error) {
      // Once fonts are loaded, we can hide the native splash screen
      SplashScreen.hideAsync();
      setIsAppReady(true);
    }
  }, [loaded, error]);

  if (!isAppReady) {
    return null;
  }

  // Show our custom animated splash screen first
  if (!isSplashScreenComplete) {
    return (
      <View style={{ flex: 1 }}>
        <CustomSplashScreen onAnimationComplete={() => setIsSplashScreenComplete(true)} />
      </View>
    );
  }

  return (
    <PreferencesProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PreferencesProvider>
  );
}
