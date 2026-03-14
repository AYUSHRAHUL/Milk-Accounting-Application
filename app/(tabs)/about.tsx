import ZyncleLogo from '@/assets/images/logo_font.png';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Colors, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Dark Green Palette for Premium Look
const DARK_GREEN = '#064E3B';
const EMERALD_GREEN = '#059669';

export default function AboutScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const version = Constants.expoConfig?.version ?? '1.0.0';
  
  const openZyncleWebsite = () => {
    Linking.openURL('https://zyncle.com');
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
          {/* Subtle Decorative Circle */}
          <View style={styles.headerDecoration} />

          <SafeAreaView edges={['top']} style={styles.headerContent}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButtonCorner}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.headerTitleCentered}>About Us</ThemedText>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>

          {/* App Info Card - Overlapping */}
          <Card variant="elevated" style={styles.appCard}>
            <TouchableOpacity onPress={openZyncleWebsite} activeOpacity={0.7} style={styles.companyLogoBox}>
              <View style={styles.companyLogoBox}>
                <Image source={ZyncleLogo} style={styles.companyLogoImg} resizeMode="contain" />
              </View>
              <ThemedText style={[styles.companyFullName, { color: DARK_GREEN }]}>Zyncle Innovations Private Limited</ThemedText>
            </TouchableOpacity>
            <View style={styles.dividerLine} />
            <ThemedText style={[styles.appName, { color: theme.text }]}>Milk Accounting</ThemedText>
            <View style={[styles.versionBadge, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
              <ThemedText style={{ color: EMERALD_GREEN, fontSize: 12, fontWeight: '700' }}>Version {version}</ThemedText>
            </View>
          </Card>

          {/* Mission Section */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionHeading, { color: theme.textSecondary }]}>OUR MISSION</ThemedText>
            <Card variant="elevated" style={styles.infoCard}>
              <ThemedText style={[styles.descriptionText, { color: theme.textSecondary }]}>
                Milk Accounting is designed to empower dairy businesses with professional-grade tools for daily operations.
                We simplify recording milk collections, managing supplier relationships, and generating detailed financial reports,
                allowing you to focus on growth and efficiency.
              </ThemedText>
            </Card>
          </View>

          {/* Technical Details Section */}
          <View style={[styles.section, { marginTop: 24 }]}>
            <ThemedText style={[styles.sectionHeading, { color: theme.textSecondary }]}>TECHNICAL DETAILS</ThemedText>
            <Card variant="elevated" style={styles.infoCard}>
              <AboutInfoItem
                icon="flask-outline"
                label="Environment"
                value="Production"
                theme={theme}
              />
              <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
              <AboutInfoItem
                icon="shield-checkmark-outline"
                label="Developer"
                value="Zyncle Innovations Pvt. Ltd. Team"
                theme={theme}
                onPress={openZyncleWebsite}
              />
              <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
              <AboutInfoItem
                icon="document-text-outline"
                label="License"
                value="Proprietary"
                theme={theme}
              />
            </Card>
          </View>

          <TouchableOpacity onPress={openZyncleWebsite} activeOpacity={0.6} style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
              © 2026 Zyncle Innovations Private Limited. All rights reserved.
            </ThemedText>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

function AboutInfoItem({ icon, label, value, theme, onPress }: { icon: any; label: string; value: string; theme: any, onPress?: () => void }) {
  const Content = (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconBox, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
        <Ionicons name={icon} size={20} color={EMERALD_GREEN} />
      </View>
      <View style={styles.infoContent}>
        <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
        <ThemedText style={[styles.infoValue, { color: theme.text }]}>{value}</ThemedText>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
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
  },
  appCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: Radii.xl,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  companyLogoBox: {
    marginBottom: 12,
    alignItems: 'center',
  },
  companyLogoImg: {
    width: 160,
    height: 48,
  },
  companyFullName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  dividerLine: {
    width: 48,
    height: 1.5,
    backgroundColor: '#D1FAE5',
    marginBottom: 14,
    borderRadius: 2,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  section: {
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    padding: 20,
    borderRadius: Radii.lg,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'justify',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDivider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
