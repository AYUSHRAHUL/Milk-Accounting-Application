import { Card } from '@/components/ui/Card';
import { SupportCard } from '@/components/support/SupportCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';

export default function SupportScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const SUPPORT_PHONE = '+919876543210';
  const SUPPORT_EMAIL = 'support@yourapp.com';

  const openDialer = async () => {
    const url = `tel:${SUPPORT_PHONE}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Call Us', 'Dialer is not available on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Call Us', 'Could not open the dialer.');
    }
  };

  const openMail = async () => {
    const subject = encodeURIComponent('Support Request');
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Mail Us', 'Mail app is not available on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Mail Us', 'Could not open the mail app.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Support Center" subtitle="We’re here to help you" onBack={() => router.back()} />

      <Card variant="elevated" style={styles.card}>
        <SupportCard
          icon="chatbubbles-outline"
          title="Chat Us"
          description="Talk to our support team instantly"
          onPress={() => router.push('/(tabs)/support-chat')}
        />
        <SupportCard
          icon="call-outline"
          title="Call Us"
          description={`Speak directly with support (${SUPPORT_PHONE})`}
          onPress={openDialer}
          tone="success"
        />
        <SupportCard
          icon="mail-outline"
          title="Mail Us"
          description={`Send us your queries at ${SUPPORT_EMAIL}`}
          onPress={openMail}
          tone="warning"
        />
      </Card>
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
});

