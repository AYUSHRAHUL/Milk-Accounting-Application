import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function HelpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Need Help" subtitle="FAQs & how to use the app" onBack={() => router.back()} />

      <Card variant="elevated" style={styles.card}>
        <SectionTitle>Quick Start</SectionTitle>
        <Bullet text="Go to Milk Collection to record daily milk entries." />
        <Bullet text="Add suppliers from Suppliers and manage their details." />
        <Bullet text="Use Sales to record customer sales and payments." />
        <Bullet text="Open Reports to filter, export CSV, and view charts." />

        <View style={{ height: Spacing.lg }} />

        <SectionTitle>Frequently Asked Questions</SectionTitle>
        <Faq q="How do I export report data?" a="Open any report and tap Export Data. On web it downloads a CSV file." />
        <Faq q="How do I change language?" a="Open the side menu and select Language, then pick your preference." />
        <Faq q="How do I switch dark mode?" a="Open the side menu and select Mode, then choose Light or Dark." />
        <Faq q="I can’t find a record I entered." a="Check the filters and search fields; refresh the list to reload data." />

        <View style={{ height: Spacing.lg }} />

        <SectionTitle>Contact</SectionTitle>
        <ThemedText style={{ color: theme.textSecondary, lineHeight: 22 }}>
          If you need assistance, contact support from the Support screen, or email us at{' '}
          <ThemedText type="link" style={{ color: theme.primary }}>
            support@milkaccounting.app
          </ThemedText>
          .
        </ThemedText>
      </Card>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <ThemedText style={{ color: theme.text, fontSize: 14, fontWeight: '900', marginBottom: Spacing.sm }}>
      {children}
    </ThemedText>
  );
}

function Bullet({ text }: { text: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      <View style={[styles.dot, { backgroundColor: theme.primary }]} />
      <ThemedText style={{ color: theme.textSecondary, flex: 1, lineHeight: 22 }}>{text}</ThemedText>
    </View>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <View style={[styles.faq, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
      <ThemedText style={{ color: theme.text, fontWeight: '900' }}>{q}</ThemedText>
      <ThemedText style={{ color: theme.textSecondary, marginTop: 4, lineHeight: 22 }}>{a}</ThemedText>
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  faq: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
});

