/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2563EB'; // Blue 600
const tintColorDark = '#60A5FA'; // Blue 400

export const Colors = {
  light: {
    text: '#0B1220',
    textSecondary: '#475569',
    background: '#F6F8FC',
    card: '#FFFFFF',
    primary: '#2563EB',
    secondary: '#0EA5E9',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
    tint: tintColorLight,
    icon: '#64748B',
    border: '#E2E8F0',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,

    // Extended tokens (used for polished UI)
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',
    shadow: 'rgba(22, 38, 74, 0.12)',
    overlay: 'rgba(2, 6, 23, 0.45)',
    borderMuted: 'rgba(15, 23, 42, 0.08)',
    // Muted backgrounds for badges, icon boxes
    primaryMuted: 'rgba(37, 99, 235, 0.10)',
    successMuted: 'rgba(22, 163, 74, 0.10)',
    warningMuted: 'rgba(245, 158, 11, 0.10)',
    errorMuted: 'rgba(220, 38, 38, 0.10)',
    secondaryMuted: 'rgba(14, 165, 233, 0.10)',
    accentMuted: 'rgba(155, 89, 182, 0.10)',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0B1220',
    card: '#111827',
    primary: '#60A5FA',
    secondary: '#38BDF8',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    tint: tintColorDark,
    icon: '#94A3B8',
    border: '#1F2937',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,

    surface: '#111827',
    surfaceMuted: '#0F172A',
    shadow: 'rgba(0, 0, 0, 0.35)',
    overlay: 'rgba(0, 0, 0, 0.55)',
    borderMuted: 'rgba(255, 255, 255, 0.08)',
    primaryMuted: 'rgba(96, 165, 250, 0.15)',
    successMuted: 'rgba(52, 211, 153, 0.15)',
    warningMuted: 'rgba(251, 191, 36, 0.15)',
    errorMuted: 'rgba(248, 113, 113, 0.15)',
    secondaryMuted: 'rgba(56, 189, 248, 0.15)',
    accentMuted: 'rgba(192, 132, 252, 0.15)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const;
