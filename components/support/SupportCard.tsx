import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

type SupportCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  tone?: 'primary' | 'success' | 'warning';
};

export function SupportCard({ icon, title, description, onPress, tone = 'primary' }: SupportCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const accent =
    tone === 'success' ? theme.success : tone === 'warning' ? theme.warning : theme.primary;
  const accentMuted =
    tone === 'success' ? theme.successMuted : tone === 'warning' ? theme.warningMuted : theme.primaryMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow } as ViewStyle,
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.96, backgroundColor: theme.surfaceMuted },
      ]}
      android_ripple={{ color: theme.surfaceMuted }}
      accessibilityRole="button"
    >
      <View style={[styles.iconWrap, { backgroundColor: accentMuted, borderColor: theme.border }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>

      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
        <ThemedText style={[styles.desc, { color: theme.textSecondary }]}>{description}</ThemedText>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 3,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  desc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
});

