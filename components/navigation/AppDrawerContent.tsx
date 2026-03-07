import { useAuth } from '@/context/AuthContext';
import { PreferencesContext, type AppLanguage, type ThemeMode } from '@/context/PreferencesContext';
import { Ionicons } from '@expo/vector-icons';
import { type DrawerContentComponentProps } from '@react-navigation/drawer';
import { router } from 'expo-router';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ───────────────────────────────────────────────────────────────────

type DrawerItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'danger';
};

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  primaryGreen: '#22C55E',
  lightGreen: '#DCFCE7',
  white: '#FFFFFF',
  darkText: '#111827',
  secondaryText: '#6B7280',
  divider: '#E5E7EB',
  iconBg: '#F3F4F6',
  arrowColor: '#9CA3AF',
  dangerBg: '#FEE2E2',
  dangerText: '#EF4444',
  overlay: 'rgba(0,0,0,0.35)',
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

// ─── Animated Menu Item ──────────────────────────────────────────────────────

function DrawerMenuItem({ item, index }: { item: DrawerItem; index: number }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-10);
  const scale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }));
    translateX.value = withDelay(delay, withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) }));
  }, [index, opacity, translateX]);

  const enterAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const isDanger = item.variant === 'danger';

  return (
    <Animated.View style={enterAnimStyle}>
      <Animated.View style={scaleStyle}>
        <Pressable
          onPress={item.onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.menuItem,
            pressed && { backgroundColor: isDanger ? COLORS.dangerBg : COLORS.lightGreen },
          ]}
        >
          {/* Left: Icon + Title */}
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, isDanger && { backgroundColor: COLORS.dangerBg }]}>
              <Ionicons
                name={item.icon}
                size={18}
                color={isDanger ? COLORS.dangerText : COLORS.primaryGreen}
              />
            </View>
            <Text style={[styles.menuTitle, isDanger && { color: COLORS.dangerText }]}>
              {item.label}
            </Text>
          </View>

          {/* Right: Arrow */}
          <Ionicons name="chevron-forward" size={16} color={COLORS.arrowColor} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main Drawer Component ───────────────────────────────────────────────────

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const prefs = useContext(PreferencesContext);
  const { user, logout } = useAuth();

  const [languageOpen, setLanguageOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);

  // Profile header animation
  const headerOpacity = useSharedValue(0);
  const headerTranslateX = useSharedValue(-10);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    headerTranslateX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
  }, [headerOpacity, headerTranslateX]);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateX: headerTranslateX.value }],
  }));

  const displayName = user?.name?.trim() || 'User';
  const firstLetter = useMemo(() => (displayName[0] ?? 'U').toUpperCase(), [displayName]);

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
        const doLogout = () => {
          props.navigation.closeDrawer();
          logout();
          router.replace('/(auth)/register');
        };

        if (Platform.OS === 'web') {
          if (window.confirm('Are you sure you want to log out?')) {
            doLogout();
          }
        } else {
          Alert.alert('Log out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: doLogout },
          ]);
        }
      },
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1: Profile Header ── */}
        <Animated.View style={[styles.profileHeader, headerAnimStyle]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{firstLetter}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email ?? ''}</Text>
          </View>
        </Animated.View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Section 2: Menu Items ── */}
        <View style={styles.menuSection}>
          {items.map((item, index) => (
            <DrawerMenuItem key={item.key} item={item} index={index} />
          ))}
        </View>
      </ScrollView>

      {/* ── Section 3: Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerText}>Milk Accounting</Text>
      </View>

      {/* ── Language Modal ── */}
      <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setLanguageOpen(false)}>
          <Pressable style={styles.modal} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Language</Text>
              <Pressable onPress={() => setLanguageOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={COLORS.secondaryText} />
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
                    {
                      borderColor: selected ? COLORS.primaryGreen : COLORS.divider,
                      backgroundColor: selected ? COLORS.lightGreen : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.choiceText, selected && { fontWeight: '700' }]}>{opt.label}</Text>
                  {selected ? <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryGreen} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Mode Modal ── */}
      <Modal visible={modeOpen} transparent animationType="fade" onRequestClose={() => setModeOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setModeOpen(false)}>
          <Pressable style={styles.modal} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mode</Text>
              <Pressable onPress={() => setModeOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={COLORS.secondaryText} />
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
                    {
                      borderColor: selected ? COLORS.primaryGreen : COLORS.divider,
                      backgroundColor: selected ? COLORS.lightGreen : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.choiceLeft}>
                    <Ionicons name={opt.icon} size={18} color={COLORS.secondaryText} />
                    <Text style={[styles.choiceText, selected && { fontWeight: '700' }]}>{opt.label}</Text>
                  </View>
                  {selected ? <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryGreen} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  // ── Profile Header ──
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkText,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 2,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 12,
  },

  // ── Menu Items ──
  menuSection: {
    // no extra styles needed
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.darkText,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 8,
  },

  // ── Modals ──
  backdrop: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: COLORS.overlay,
  },
  modal: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkText,
  },
  choice: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  choiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  choiceText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.darkText,
  },
});