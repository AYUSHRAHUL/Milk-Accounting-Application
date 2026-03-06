import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function AboutScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="About Us" subtitle="App information & version" onBack={() => router.back()} />

      <Card variant="elevated" style={styles.card}>
        <ThemedText type="title" style={{ color: theme.text }}>
          Milk Accounting
        </ThemedText>
        <ThemedText style={{ color: theme.textSecondary, marginTop: 6, lineHeight: 22 }}>
          Milk Accounting helps dairy businesses record daily milk collection, manage suppliers, track production, and
          maintain sales records with clean reports and visuals.
        </ThemedText>

        <View style={{ height: Spacing.lg }} />

        <InfoRow label="Version" value={version} />
        <InfoRow label="Purpose" value="Daily accounting & reporting for milk operations" />
        <InfoRow label="Developer" value="Milk Accounting Team" />
      </Card>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
      <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '800' }}>{label}</ThemedText>
      <ThemedText style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  card: {
    padding: Spacing.xl,
  },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
    marginTop: Spacing.sm,
  },
});

