import Logo from '@/assets/images/logo.jpeg';
import ZyncleLogo from '@/assets/images/logo_font.png';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { ThemedText } from './themed-text';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export const CustomSplashScreen = ({ onAnimationComplete }: SplashScreenProps) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    // Phase 1: Logo fades in and scales up
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });

    // Phase 2: Text fades and slides up
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(400, withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.5)) }));

    // Phase 3: Wait and complete
    const timeout = setTimeout(() => {
      // Fade out everything
      opacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      });
    }, 2800);

    return () => clearTimeout(timeout);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, containerStyle]}>
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <Image source={Logo} style={styles.logo} />
        </Animated.View>
        <Animated.View style={[styles.textContainer, textStyle]}>
          <ThemedText style={styles.brandName}>MILK ACCOUNTING</ThemedText>
          <ThemedText style={styles.tagline}>Quality You Can Trust</ThemedText>

          {/* ── Zyncle Company Brand ── */}
          <View style={styles.companyWrapper}>
            <View style={styles.companyDivider} />
            <ThemedText style={styles.poweredBy}>Powered by</ThemedText>
            <Image source={ZyncleLogo} style={styles.companyLogo} resizeMode="contain" />
            <ThemedText style={styles.companyName}>Zyncle Innovation Private Limited</ThemedText>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DCFCE7',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80, // Perfectly round
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#10B981',
    // Shadow for premium look
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  companyWrapper: {
    alignItems: 'center',
    marginTop: 28,
    gap: 4,
  },
  companyDivider: {
    width: 40,
    height: 1.5,
    backgroundColor: '#D1FAE5',
    marginBottom: 10,
  },
  poweredBy: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  companyLogo: {
    width: 140,
    height: 40,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
});
