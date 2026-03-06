import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { PreferencesContext, type AppLanguage, type ThemeMode } from '@/context/PreferencesContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { router } from 'expo-router';
import React, { useContext, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

type DrawerItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'danger';
};

const languageOptions: { id: AppLanguage; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
  { id: 'or', label: 'Odia' },
  { id: 'te', label: 'Telugu' },
];

const themeOptions: { id: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'light', label: 'Light Mode', icon: 'sunny-outline' },
  { id: 'dark', label: 'Dark Mode', icon: 'moon-outline' },
];

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const prefs = useContext(PreferencesContext);
  const { user, logout } = useAuth();

  const [languageOpen, setLanguageOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);

  const displayName = user?.name?.trim() || 'User';
  const initials = useMemo(() => {
    const parts = displayName.split(' ').filter(Boolean);
    const first = parts[0]?.[0] ?? 'U';
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
    return (first + (second ?? '')).toUpperCase();
  }, [displayName]);

  const navigateTo = (path: string) => {
    props.navigation.closeDrawer();
    router.push(path as any);
  };

  const items: DrawerItem[] = [
    { key: 'profile', label: 'Profile', icon: 'person-outline', onPress: () => navigateTo('/(tabs)/profile') },
    { key: 'language', label: 'Language', icon: 'language-outline', onPress: () => setLanguageOpen(true) },
    { key: 'mode', label: 'Mode', icon: 'contrast-outline', onPress: () => setModeOpen(true) },
    { key: 'help', label: 'Need Help', icon: 'help-circle-outline', onPress: () => navigateTo('/(tabs)/help') },
    { key: 'support', label: 'Support', icon: 'chatbox-ellipses-outline', onPress: () => navigateTo('/(tabs)/support') },
    { key: 'about', label: 'About Us', icon: 'information-circle-outline', onPress: () => navigateTo('/(tabs)/about') },
    {
      key: 'logout',
      label: 'Log Out',
      icon: 'log-out-outline',
      variant: 'danger',
      onPress: () => {
        Alert.alert('Log out', 'Are you sure you want to log out?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: async () => {
              props.navigation.closeDrawer();
              await logout();
              router.replace('/(auth)/register');
            },
          },
        ]);
      },
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.surface }]}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
            <ThemedText style={[styles.avatarText, { color: theme.primary }]}>{initials}</ThemedText>
          </View>

          <View style={styles.headerText}>
            <ThemedText style={[styles.name, { color: theme.text }]}>{displayName}</ThemedText>
            <ThemedText style={[styles.sub, { color: theme.textSecondary }]}>{user?.email ?? ''}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: theme.surfaceMuted },
              ]}
              android_ripple={{ color: theme.surfaceMuted }}
            >
              <View
                style={[
                  styles.itemIcon,
                  { backgroundColor: item.variant === 'danger' ? theme.errorMuted : theme.surfaceMuted },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.variant === 'danger' ? theme.error : theme.primary}
                />
              </View>
              <ThemedText style={[styles.itemLabel, { color: item.variant === 'danger' ? theme.error : theme.text }]}>
                {item.label}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color={theme.icon} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: 12 }} />
        <ThemedText style={[styles.footer, { color: theme.textSecondary }]}>Milk Accounting</ThemedText>
      </DrawerContentScrollView>

      <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={() => setLanguageOpen(false)}>
          <Pressable style={[styles.modal, { backgroundColor: theme.surface }]} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={{ color: theme.text }}>
                Language
              </ThemedText>
              <Pressable onPress={() => setLanguageOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={theme.icon} />
              </Pressable>
            </View>

            {languageOptions.map((opt) => {
              const selected = !!prefs && prefs.language === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={async () => {
                    if (prefs) await prefs.setLanguage(opt.id);
                    setLanguageOpen(false);
                  }}
                  style={[
                    styles.choice,
                    { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primaryMuted : 'transparent' },
                  ]}
                >
                  <ThemedText style={{ color: theme.text, fontWeight: selected ? '800' : '600' }}>{opt.label}</ThemedText>
                  {selected ? <Ionicons name="checkmark-circle" size={18} color={theme.primary} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={modeOpen} transparent animationType="fade" onRequestClose={() => setModeOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={() => setModeOpen(false)}>
          <Pressable style={[styles.modal, { backgroundColor: theme.surface }]} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={{ color: theme.text }}>
                Mode
              </ThemedText>
              <Pressable onPress={() => setModeOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={theme.icon} />
              </Pressable>
            </View>

            {themeOptions.map((opt) => {
              const selected = !!prefs && prefs.themeMode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={async () => {
                    if (prefs) await prefs.setThemeMode(opt.id);
                    setModeOpen(false);
                  }}
                  style={[
                    styles.choice,
                    { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primaryMuted : 'transparent' },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name={opt.icon} size={18} color={theme.icon} />
                    <ThemedText style={{ color: theme.text, fontWeight: selected ? '800' : '600' }}>{opt.label}</ThemedText>
                  </View>
                  {selected ? <Ionicons name="checkmark-circle" size={18} color={theme.primary} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sub: {
    marginTop: 2,
    fontSize: 12,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    fontSize: 12,
  },
  backdrop: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  modal: {
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  choice: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

