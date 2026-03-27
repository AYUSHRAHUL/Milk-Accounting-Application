import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

function profileKey(email: string) {
  return `milkAccounting:profile:v1:${email.toLowerCase()}`;
}

// Dark Green Palette for Premium Look
const DARK_GREEN = '#064E3B';
const EMERALD_GREEN = '#059669';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const baseProfile = useMemo<ProfileData>(() => {
    return {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: '',
      address: '',
    };
  }, [user?.email, user?.name]);

  const [profile, setProfile] = useState<ProfileData>(baseProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hydrate = useCallback(async () => {
    if (!user?.email) return;
    setProfile(baseProfile);
    try {
      const raw = await AsyncStorage.getItem(profileKey(user.email));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ProfileData>;
      setProfile({
        ...baseProfile,
        ...parsed,
        email: user.email,
      });
    } catch {
      // ignore
    }
  }, [baseProfile, user?.email]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const save = async () => {
    if (!user?.email) return;
    if (!profile.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(profileKey(user.email), JSON.stringify(profile));
      if (profile.name.trim() !== user.name) {
        await updateUser({ name: profile.name.trim() });
      }
      setIsEditing(false);
      Alert.alert('Success', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          if (Platform.OS === 'web') {
            alert('successfull logout');
            logout();
            router.replace('/(auth)/login');
          } else {
            Alert.alert('Logout Success', 'successfull logout', [
              { 
                text: 'OK', 
                onPress: () => {
                  logout();
                  router.replace('/(auth)/login');
                } 
              }
            ]);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
        <View style={styles.headerHero}>
          <LinearGradient
            colors={[DARK_GREEN, EMERALD_GREEN]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} style={styles.headerContent}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButtonCorner}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.headerTitleCentered}>Profile</ThemedText>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </View>
        <View style={styles.contentContainer}>
          <Card variant="elevated" style={styles.emptyCard}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="lock-closed" size={32} color={theme.primary} />
            </View>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Please log in to view your profile and manage account settings.
            </ThemedText>
            <Button title="Go to Dashboard" style={styles.emptyButton} onPress={() => router.push('/')} />
          </Card>
        </View>
      </View>
    );
  }

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
              <ThemedText type="title" style={styles.headerTitleCentered}>Profile</ThemedText>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </View>

        {/* Profile Card / Content */}
        <View style={styles.contentContainer}>
          {/* Avatar Area - Overlapping */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarWrapper, { borderColor: theme.background, backgroundColor: theme.primaryMuted }]}>
              <ThemedText style={[styles.avatarInitial, { color: DARK_GREEN }]}>
                {(profile.name?.[0] ?? 'U').toUpperCase()}
              </ThemedText>
              {!isEditing && (
                <TouchableOpacity
                  style={[styles.editBadge, { backgroundColor: EMERALD_GREEN }]}
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="pencil" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            <ThemedText style={[styles.profileName, { color: theme.text }]}>{profile.name}</ThemedText>
            <ThemedText style={[styles.profileEmail, { color: theme.textSecondary }]}>{profile.email}</ThemedText>
          </View>

          {isEditing ? (
            <View style={styles.formContainer}>
              <Card variant="elevated" style={styles.infoCard}>
                <ThemedText style={[styles.cardHeading, { color: DARK_GREEN }]}>Edit Details</ThemedText>
                <Input
                  label="Full Name"
                  value={profile.name}
                  onChangeText={(v) => setProfile((p) => ({ ...p, name: v }))}
                  placeholder="Enter full name"
                />
                <Input
                  label="Email (Disabled)"
                  value={profile.email}
                  editable={false}
                  style={{ opacity: 0.7 }}
                />
                <Input
                  label="Phone Number"
                  placeholder="e.g. 9876543210"
                  value={profile.phone}
                  onChangeText={(v) => {
                    const numericValue = v.replace(/[^0-9]/g, '');
                    if (numericValue.length <= 10) {
                      setProfile((p) => ({ ...p, phone: numericValue }));
                    }
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Input
                  label="Address"
                  placeholder="Enter shop or home address"
                  value={profile.address}
                  onChangeText={(v) => setProfile((p) => ({ ...p, address: v }))}
                  multiline
                />
              </Card>

              <View style={styles.formActions}>
                <Button title="Save Changes" onPress={save} loading={isSaving} disabled={isSaving} style={{ backgroundColor: DARK_GREEN }} />
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setIsEditing(false);
                    void hydrate();
                  }}
                  disabled={isSaving}
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.detailsContainer}>
              <Card variant="elevated" style={styles.infoCard}>
                <InfoItem
                  icon="call-outline"
                  label="Phone Number"
                  value={profile.phone || 'Not added'}
                  theme={theme}
                  accentColor={EMERALD_GREEN}
                />
                <View style={[styles.itemDivider, { backgroundColor: theme.border }]} />
                <InfoItem
                  icon="location-outline"
                  label="Address"
                  value={profile.address || 'Not added'}
                  theme={theme}
                  accentColor={EMERALD_GREEN}
                />
              </Card>

              {/* Logout Section */}
              <TouchableOpacity 
                style={[styles.logoutButton, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]} 
                onPress={handleLogout}
              >
                <View style={[styles.infoIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                </View>
                <ThemedText style={[styles.logoutText, { color: '#B91C1C' }]}>Log Out</ThemedText>
                <Ionicons name="chevron-forward" size={18} color="#EF4444" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoItem({ icon, label, value, theme, accentColor }: { icon: any; label: string; value: string; theme: any; accentColor: string }) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconBox, { backgroundColor: `${accentColor}1A` }]}>
        <Ionicons name={icon} size={20} color={accentColor} />
      </View>
      <View style={styles.infoContent}>
        <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
        <ThemedText style={[styles.infoValue, { color: theme.text }]}>{value}</ThemedText>
      </View>
    </View>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '900',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  infoCard: {
    padding: 16,
    borderRadius: Radii.lg,
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  navIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  navText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  formContainer: {
    gap: 20,
  },
  detailsContainer: {
    gap: 20,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  formActions: {
    marginTop: 8,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    width: 'auto',
    paddingHorizontal: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
