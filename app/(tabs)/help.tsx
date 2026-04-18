import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Colors, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Dark Green Palette for Premium Look
const DARK_GREEN = '#064E3B';
const EMERALD_GREEN = '#059669';

export default function HelpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

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
              <ThemedText type="title" style={styles.headerTitleCentered}>Need Help?</ThemedText>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>

          {/* Quick Start Section */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionHeading, { color: theme.textSecondary }]}>QUICK START GUIDE</ThemedText>
            <Card variant="elevated" style={styles.infoCard}>
              <HelpBullet
                icon="water-outline"
                text="Go to Milk Collection to record daily milk entries."
                theme={theme}
              />
              <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
              <HelpBullet
                icon="people-outline"
                text="Add suppliers and manage their details effortlessly."
                theme={theme}
              />
              <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
              <HelpBullet
                icon="cash-outline"
                text="Use Sales to record customer transactions and payments."
                theme={theme}
              />
              <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
              <HelpBullet
                icon="bar-chart-outline"
                text="Open Reports to filter, export CSV, and view charts."
                theme={theme}
              />
            </Card>
          </View>

          {/* FAQ Section */}
          <View style={[styles.section, { marginTop: 24 }]}>
            <ThemedText style={[styles.sectionHeading, { color: theme.textSecondary }]}>FREQUENTLY ASKED QUESTIONS</ThemedText>
            <FaqItem
              q="How do I export report data?"
              a="Open any report and tap 'Export Data'. On web, it downloads a CSV file instantly."
              theme={theme}
            />
            <FaqItem
              q="How do I change my admin password?"
              a="Navigate to the Admin Panel and tap the green 'Change password' card. A secure pop-up will appear allowing you to update your credentials."
              theme={theme}
            />
            <FaqItem
              q="How do I delete an admin account?"
              a="As a Super Admin, go to the Admins management page and tap the red trash icon on the admin's card. Confirm the prompt to complete deletion."
              theme={theme}
            />
          </View>

          {/* Contact Section */}
          <View style={[styles.section, { marginTop: 24 }]}>
            <ThemedText style={[styles.sectionHeading, { color: theme.textSecondary }]}>CONTACT US</ThemedText>
            <Card variant="elevated" style={styles.infoCard}>
              <View style={styles.contactContent}>
                <View style={[styles.contactIconBox, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
                  <Ionicons name="chatbubbles-outline" size={24} color={EMERALD_GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>Direct Assistance</ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
                    If you need further help, please email us or use the support chat.
                  </ThemedText>
                  <TouchableOpacity style={{ marginTop: 12 }}>
                    <ThemedText type="link" style={{ color: EMERALD_GREEN, fontWeight: '700' }}>
                      support@zyncle.com
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

function HelpBullet({ icon, text, theme }: { icon: any; text: string; theme: any }) {
  return (
    <View style={styles.helpBullet}>
      <View style={[styles.bulletIconBox, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
        <Ionicons name={icon} size={20} color={EMERALD_GREEN} />
      </View>
      <ThemedText style={[styles.bulletText, { color: theme.textSecondary }]}>{text}</ThemedText>
    </View>
  );
}

function FaqItem({ q, a, theme }: { q: string; a: string; theme: any }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card variant="elevated" style={[styles.faqCard, { marginBottom: 12 }]}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.faqHeader}
        activeOpacity={0.7}
      >
        <ThemedText style={[styles.faqQuestion, { color: theme.text }]}>{q}</ThemedText>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.icon}
        />
      </TouchableOpacity>
      {expanded && (
        <ThemedText style={[styles.faqAnswer, { color: theme.textSecondary }]}>{a}</ThemedText>
      )}
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
    padding: 16,
    borderRadius: Radii.lg,
  },
  helpBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  bulletIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  itemDivider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  faqCard: {
    padding: 16,
    borderRadius: Radii.lg,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  contactContent: {
    flexDirection: 'row',
    gap: 16,
  },
  contactIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
