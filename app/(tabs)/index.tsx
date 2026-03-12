import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

import DashboardBannerImage from '@/assets/dashboard_banner.png';
import MilkCollectionImage from '@/assets/milkcollection.png';
import ProductsImage from '@/assets/protection.png';
import ReportsImage from '@/assets/reports.png';
import SalesImage from '@/assets/sales.png';
import SuppliersImage from '@/assets/supplier.png';
import ViewCollectionsImage from '@/assets/view collection.png';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface FeatureCard {
  title: string;
  route: string;
  image?: any;
  icon: string;
  useTint?: boolean;
}


const FEATURES: FeatureCard[] = [
  { title: 'Milk Collection', route: '/milk-collection', image: MilkCollectionImage, icon: 'water', useTint: true },
  { title: 'View Collections', route: '/milk-collection/history', image: ViewCollectionsImage, icon: 'list', useTint: true },
  { title: 'Suppliers', route: '/suppliers', image: SuppliersImage, icon: 'people', useTint: true },
  { title: 'Production', route: '/production', image: null, icon: 'flask', useTint: true },
  { title: 'Products', route: '/products', image: ProductsImage, icon: 'cube', useTint: true },
  { title: 'Sales', route: '/sales', image: SalesImage, icon: 'cash', useTint: true },
  { title: 'Reports', route: '/(tabs)/reports', image: ReportsImage, icon: 'bar-chart', useTint: true },
];

// Dashboard Card
function DashboardCard({ item, index }: { item: FeatureCard; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 80;
    opacity.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }));
  }, [index, opacity, translateY]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const imageSource = item.image;
  const hasValidImage = imageSource != null;

  return (
    <AnimatedTouchable
      style={[styles.card, cardAnimatedStyle]}
      onPress={() => router.push(item.route as any)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      {hasValidImage ? (
        <Image
          source={imageSource}
          style={[
            styles.cardImage,
            item.useTint === false && { tintColor: undefined }
          ]}
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Ionicons name={item.icon as any} size={40} color="#22C55E" />
        </View>
      )}
      <Text style={styles.cardTitle}>{item.title}</Text>
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
        <Text style={styles.bannerTitle}>Precision Dairy Accounting</Text>
        <Text style={styles.bannerSubtitle}>Monitor your growth in real-time</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();

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

          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={26} color="#22C55E" />
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

        {/* Feature Grid */}
        <View style={styles.grid}>
          {FEATURES.map((item, index) => (
            <DashboardCard key={item.title} item={item} index={index} />
          ))}
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
});