import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import DashboardBannerImage from '@/assets/dashboard_banner.png';
import MilkCollectionImage from '@/assets/milkcollection.png';
import ReportsImage from '@/assets/reports.png';
import SalesImage from '@/assets/sales.png';
import SuppliersImage from '@/assets/supplier.png';
import HistoryImage from '@/assets/images/history.png';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface FeatureCard {
  title: string;
  id: string;
  route: string;
  image?: any;
  icon: string;
  useTint?: boolean;
}

const FEATURES: FeatureCard[] = [
  { title: 'Suppliers', id: 'suppliers', route: '/suppliers', image: SuppliersImage, icon: 'people', useTint: true },
  { title: 'Milk Collection', id: 'collection', route: '/milk-collection', image: MilkCollectionImage, icon: 'water', useTint: true },
  { title: 'Separation', id: 'production', route: '/production', image: null, icon: 'flask', useTint: true },
  { title: 'Products', id: 'products', route: '/production/make-products', image: null, icon: 'cube', useTint: true },
  { title: 'Sales', id: 'sales', route: '/sales', image: SalesImage, icon: 'cash', useTint: true },
  { title: 'Reports', id: 'reports', route: '/reports', image: ReportsImage, icon: 'bar-chart', useTint: true },
  { title: 'Quality Parameters', id: 'quality', route: '/quality-parameters', image: null, icon: 'analytics', useTint: true },
  { title: 'History', id: 'history', route: '/milk-collection/history', image: HistoryImage, icon: 'list', useTint: true },
];

// Dashboard Card
function DashboardCard({ item, index, disabled }: { item: FeatureCard; index: number; disabled?: boolean }) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Removed entrance animations to prevent intermittent visibility issues on slow renders

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(0.96, { duration: 120 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const imageSource = item.image;
  const hasValidImage = imageSource != null;

  return (
    <AnimatedTouchable
      style={[styles.card, cardAnimatedStyle, disabled && { opacity: 0.5, backgroundColor: '#f8fafc' }]}
      onPress={() => {
        if (!disabled) router.push(item.route as any);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={disabled ? 1 : 0.8}
    >
      {disabled && (
        <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 4 }}>
          <Ionicons name="lock-closed" size={16} color="#94A3B8" />
        </View>
      )}
      {hasValidImage ? (
        <Image
          source={imageSource}
          style={[
            styles.cardImage,
            item.useTint === false && { tintColor: undefined },
            disabled && { tintColor: '#94A3B8' }
          ]}
        />
      ) : (
        <View style={[styles.cardImagePlaceholder, disabled && { backgroundColor: '#E2E8F0' }]}>
          <Ionicons name={item.icon as any} size={40} color={disabled ? "#94A3B8" : "#22C55E"} />
        </View>
      )}
      <Text style={[styles.cardTitle, disabled && { color: '#94A3B8' }]}>{item.title}</Text>
    </AnimatedTouchable>
  );
}

function DashboardBanner() {
  return (
    <View style={styles.bannerContainer}>
      <Image source={DashboardBannerImage} style={styles.bannerBackground} />
      <LinearGradient
        colors={['rgba(6, 78, 59, 0.8)', 'rgba(5, 150, 105, 0.4)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerGradient}
      />
      <View style={styles.bannerContent}>
        <View style={styles.bannerBadge}>
          <Ionicons name="sparkles" size={12} color="#FDE047" />
          <Text style={styles.bannerBadgeText}>Premium Version</Text>
        </View>
        <Text style={styles.bannerTitle}>MOM AMI DAIRYWARE</Text>
        <Text style={styles.bannerSubtitle}>Monitor your growth in real-time</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [openingBalance, setOpeningBalance] = useState<number | null>(null);
  const [closingBalance, setClosingBalance] = useState<number | null>(null);
  const [closingBalanceDate, setClosingBalanceDate] = useState<string | null>(null);
  const [sourceOpeningBalance, setSourceOpeningBalance] = useState<any>(null);
  const [sourceClosingBalance, setSourceClosingBalance] = useState<any>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    try {
      const res = await apiFetch(`/api/production/milk-summary?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setOpeningBalance(data.openingBalance);
        setClosingBalance(data.closingBalance);
        setClosingBalanceDate(data.closingBalanceDate);
        setSourceOpeningBalance(data.sourceOpeningBalance);
        setSourceClosingBalance(data.sourceAvailable);
      }
    } catch (error) {
      console.error('Dashboard Summary Error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [fetchSummary])
  );

  if (isAuthLoading) {
    return <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#22C55E" size="large" />
      </View>
    </SafeAreaView>;
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };
  const today = new Date();
  const todayStr = formatDate(today);
  const cbDateStr = closingBalanceDate ? formatDate(new Date(closingBalanceDate)) : todayStr;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu-outline" size={28} color="#22C55E" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Dashboard</Text>

          <TouchableOpacity onPress={fetchSummary} disabled={isRefreshing} style={{ padding: 4 }}>
            <Ionicons name={isRefreshing ? "sync" : "refresh"} size={24} color={isRefreshing ? "#9CA3AF" : "#22C55E"} />
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your dairy operations efficiently
          </Text>
        </View>

        {/* Banner */}
        <DashboardBanner />

        {/* KPI Section */}
        <View style={[styles.grid, { marginBottom: 16 }]}>
          {/* Opening Balance Card */}
          <View style={[styles.card, { height: 'auto', paddingVertical: 20 }]}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              OPENING BAL. ({todayStr})
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 8 }}>
              {openingBalance?.toFixed(1) || '0.0'}L
            </Text>
            {sourceOpeningBalance && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '600' }}>
                  C: {sourceOpeningBalance.Cow?.toFixed(0)}L  •  B: {sourceOpeningBalance.Buffalo?.toFixed(0)}L
                </Text>
                <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '600' }}>
                  G: {sourceOpeningBalance.Goat?.toFixed(0)}L  •  O: {sourceOpeningBalance.Other?.toFixed(0)}L
                </Text>
              </View>
            )}
          </View>

          {/* Closing Balance Card */}
          <View style={[styles.card, { height: 'auto', paddingVertical: 20 }]}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              CLOSING BAL. ({cbDateStr})
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 8 }}>
              {closingBalance?.toFixed(1) || '0.0'}L
            </Text>
            {sourceClosingBalance && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '600' }}>
                  C: {sourceClosingBalance.Cow?.toFixed(0)}L  •  B: {sourceClosingBalance.Buffalo?.toFixed(0)}L
                </Text>
                <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '600' }}>
                  G: {sourceClosingBalance.Goat?.toFixed(0)}L  •  O: {sourceClosingBalance.Other?.toFixed(0)}L
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Feature Grid */}
        <View style={styles.grid}>
          {user?.role === 'admin' && (
            <DashboardCard item={{ title: 'Admin Dashboard', id: 'admin', route: '/admin/dashboard', icon: 'shield-checkmark', useTint: true }} index={0} />
          )}
          {FEATURES.map((item, index) => {
            let disabled = false;
            if (user?.role === 'admin') {
              disabled = false;
            } else if (!user?.modules) {
              // Backward compatibility if user.modules is missing: assume all enabled
              disabled = false;
            } else {
              // Now user.modules maps exactly to item.id
              disabled = !user.modules.includes(item.id);
            }
            return (
              <DashboardCard
                key={item.title}
                item={item}
                index={user?.role === 'admin' ? index + 1 : index}
                disabled={disabled}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },

  welcomeSection: {
    marginBottom: 20,
  },

  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },

  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 15,
    height: 130,
    width: '47%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  cardImage: {
    height: 45,
    width: 45,
    marginBottom: 10,
    resizeMode: 'contain',
    tintColor: '#22C55E',
  },

  cardImagePlaceholder: {
    height: 45,
    width: 45,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },

  bannerContainer: {
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  bannerBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },

  // KPI Styles
  kpiSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  kpiCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Minimal KPI Styles
  minimalKpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  minimalKpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  minimalKpiIcon: {
    marginRight: 6,
  },
  minimalKpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  minimalKpiDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 'auto',
    fontWeight: '500',
  },
  minimalKpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  minimalKpiBreakdown: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  minimalKpiBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minimalKpiBreakdownText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  minimalKpiBreakdownBold: {
    color: '#374151',
    fontWeight: '700',
  },
});