import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Colors, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Dark Green Palette for Premium Look
const DARK_GREEN = '#064E3B';
const EMERALD_GREEN = '#059669';

export default function SupportScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const SUPPORT_PHONE = '9279866178';
  const SUPPORT_EMAIL = 'support@kaamwalah.com';

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
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Premium Dark Green Hero Header */}
        <View style={styles.headerHero}>
          <LinearGradient
            colors={[DARK_GREEN, EMERALD_GREEN]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerDecoration} />

          <SafeAreaView edges={['top']} style={styles.headerContent}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButtonCorner}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.headerTitleCentered}>Support Center</ThemedText>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </View>

        {/* Action Cards Container */}
        <View style={styles.contentContainer}>

          <SupportActionCard
            icon="chatbubbles-outline"
            title="Chat with Us"
            description="Talk directly with our support team for instant help."
            buttonText="Start Chat"
            onPress={() => router.push('/(tabs)/support-chat')}
            theme={theme}
            color={EMERALD_GREEN}
          />

          <SupportActionCard
            icon="call-outline"
            title="Call Support"
            description="Need to speak with someone? Give us a call."
            buttonText="Call Now"
            onPress={openDialer}
            theme={theme}
            color={DARK_GREEN}
          />

          <SupportActionCard
            icon="mail-outline"
            title="Email Support"
            description="Send us a detailed message about your query."
            buttonText="Send Email"
            onPress={openMail}
            theme={theme}
            color="#2563EB" // A professional blue for mail
          />

          {/* Footer Info */}
          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
              Our support team is available Mon-Fri, 9am - 6pm.
            </ThemedText>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

function SupportActionCard({ icon, title, description, buttonText, onPress, theme, color }: any) {
  return (
    <Card variant="elevated" style={styles.supportCard}>
      <View style={[styles.iconBox, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={[styles.cardTitle, { color: theme.text }]}>{title}</ThemedText>
        <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>{description}</ThemedText>
        <TouchableOpacity
          onPress={onPress}
          style={[styles.cardButton, { backgroundColor: color }]}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.buttonText}>{buttonText}</ThemedText>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerHero: {
    height: 180,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButtonCorner: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCentered: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  contentContainer: {
    marginTop: -40,
    paddingHorizontal: 20,
    gap: 16,
  },
  supportCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: Radii.lg,
    gap: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardDescription: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
