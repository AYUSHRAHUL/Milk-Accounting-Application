import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type AppLanguage = 'en' | 'hi' | 'or' | 'te';

type PreferencesState = {
  themeMode: ThemeMode;
  language: AppLanguage;
  isHydrated: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setLanguage: (lang: AppLanguage) => Promise<void>;
};

const STORAGE_KEY = 'milkAccounting:preferences:v1';

export const PreferencesContext = createContext<PreferencesState | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (!raw) {
          setIsHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<Pick<PreferencesState, 'themeMode' | 'language'>>;
        if (parsed.themeMode === 'light' || parsed.themeMode === 'dark') {
          setThemeModeState(parsed.themeMode);
        }
        if (parsed.language === 'en' || parsed.language === 'hi' || parsed.language === 'or' || parsed.language === 'te') {
          setLanguageState(parsed.language);
        }
      } catch {
        // ignore hydration errors (defaults are fine)
      } finally {
        if (mounted) setIsHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: { themeMode: ThemeMode; language: AppLanguage }) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore persistence errors (app can still function)
    }
  }, []);

  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      setThemeModeState(mode);
      await persist({ themeMode: mode, language });
    },
    [language, persist],
  );

  const setLanguage = useCallback(
    async (lang: AppLanguage) => {
      setLanguageState(lang);
      await persist({ themeMode, language: lang });
    },
    [persist, themeMode],
  );

  const value = useMemo<PreferencesState>(
    () => ({
      themeMode,
      language,
      isHydrated,
      setThemeMode,
      setLanguage,
    }),
    [isHydrated, language, setLanguage, setThemeMode, themeMode],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

