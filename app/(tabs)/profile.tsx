import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

function profileKey(email: string) {
  return `milkAccounting:profile:v1:${email.toLowerCase()}`;
}

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
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
      Alert.alert('Name is required');
      return;
    }
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(profileKey(user.email), JSON.stringify(profile));
      if (profile.name.trim() !== user.name) {
        await updateUser({ name: profile.name.trim() });
      }
      setIsEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Profile" subtitle="Your account details" onBack={() => router.back()} />
        <Card variant="elevated">
          <ThemedText style={{ color: theme.textSecondary }}>Please log in to view your profile.</ThemedText>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Profile" subtitle="Your account details" onBack={() => router.back()} />

      <Card variant="elevated" style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
            <ThemedText style={{ fontWeight: '900', color: theme.primary, fontSize: 18 }}>
              {(profile.name?.[0] ?? 'U').toUpperCase()}
            </ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="title" style={{ color: theme.text }}>
              {profile.name}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary, marginTop: 2 }}>{profile.email}</ThemedText>
          </View>
        </View>

        <View style={{ height: Spacing.lg }} />

        {isEditing ? (
          <View style={{ gap: Spacing.md }}>
            <Input label="Full Name" value={profile.name} onChangeText={(v) => setProfile((p) => ({ ...p, name: v }))} />
            <Input label="Email" value={profile.email} editable={false} />
            <Input
              label="Phone Number"
              placeholder="Add phone number"
              value={profile.phone}
              onChangeText={(v) => setProfile((p) => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
            />
            <Input
              label="Address"
              placeholder="Add address"
              value={profile.address}
              onChangeText={(v) => setProfile((p) => ({ ...p, address: v }))}
            />
          </View>
        ) : (
          <View style={{ gap: Spacing.md }}>
            <InfoRow label="Phone Number" value={profile.phone || 'Not added'} />
            <InfoRow label="Address" value={profile.address || 'Not added'} />
          </View>
        )}
      </Card>

      <View style={{ marginTop: Spacing.lg }}>
        {isEditing ? (
          <View style={{ gap: Spacing.sm }}>
            <Button title="Save Changes" onPress={save} loading={isSaving} disabled={isSaving} />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setIsEditing(false);
                void hydrate();
              }}
              disabled={isSaving}
            />
          </View>
        ) : (
          <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
        )}
      </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
});

