import { PreferencesContext } from '@/context/PreferencesContext';
import { useContext } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme() {
  const native = useNativeColorScheme();
  const prefs = useContext(PreferencesContext);

  if (!prefs) return (native ?? 'light') as 'light' | 'dark';
  return prefs.themeMode;
}
