import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import Logo from '@/assets/images/logo.jpeg';

const { width, height } = Dimensions.get('window');

// Custom Animated TouchableOpacity component for button press effects
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function LandingScreen() {
  // Animation Values
  const logoScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const buttonsTranslateY = useSharedValue(50);
  const buttonsOpacity = useSharedValue(0);

  // Button Press Animation Values
  const loginScale = useSharedValue(1);
  const registerScale = useSharedValue(1);

  useEffect(() => {
    // 1. Logo scales in
    logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // 2. Text fades and slides up (delayed)
    textOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    textTranslateY.value = withDelay(
      300,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );

    // 3. Buttons slide up and fade in (delayed further)
    buttonsOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    buttonsTranslateY.value = withDelay(
      600,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    // Intentionally run once on mount for entrance animation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animated Styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const loginButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loginScale.value }],
  }));

  const registerButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: registerScale.value }],
  }));

  // Press Handlers
  const handlePressIn = (scale: SharedValue<number>) => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = (scale: SharedValue<number>) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const CurvedSeparator = () => {
    // A simple SVG equivalent using absolute positioned overlapping views
    // to create a clean wave effect between green and white.
    return (
      <View style={styles.curveContainer}>
        <View style={styles.curveElement} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Green Background */}
      <View style={styles.topBackground} />
      
      {/* Soft curve transition */}
      <CurvedSeparator />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          
          {/* Top Section - Logo & Text */}
          <View style={styles.topSection}>
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <Image source={Logo} style={styles.logoImage} />
            </Animated.View>

            <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
              <Text style={styles.title}>Milk Management{'\n'}App</Text>
              <Text style={styles.subtitle}>Streamline your daily milk accounting</Text>
            </Animated.View>
          </View>

          {/* Bottom Section - Buttons */}
          <Animated.View style={[styles.bottomSection, buttonsAnimatedStyle]}>
            <AnimatedTouchableOpacity
              style={[styles.loginButton, loginButtonAnimatedStyle]}
              onPress={() => router.push('/(auth)/login')}
              onPressIn={() => handlePressIn(loginScale)}
              onPressOut={() => handlePressOut(loginScale)}
              activeOpacity={1}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity
              style={[styles.registerButton, registerButtonAnimatedStyle]}
              onPress={() => router.push('/(auth)/register')}
              onPressIn={() => handlePressIn(registerScale)}
              onPressOut={() => handlePressOut(registerScale)}
              activeOpacity={1}
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </AnimatedTouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: '#22C55E',
  },
  curveContainer: {
    position: 'absolute',
    top: height * 0.55 - 50,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
  },
  curveElement: {
    position: 'absolute',
    top: -height, // Push the bulk of it up
    left: -width * 0.5,
    width: width * 2,
    height: height + 50,
    borderRadius: width, // Create massive circle
    backgroundColor: '#22C55E',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingTop: 40,
  },
  topSection: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  bottomSection: {
    width: '100%',
    gap: 16,
  },
  loginButton: {
    backgroundColor: '#22C55E',
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerButton: {
    backgroundColor: 'transparent',
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#22C55E',
  },
  registerButtonText: {
    color: '#22C55E',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
