import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { SuccessOverlay } from '@/components/ui/SuccessOverlay';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '@/assets/images/logo.jpeg';
import ZyncleLogo from '@/assets/images/logo_font.png';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  const { login, isLoading } = useAuth();

  // Animation for the button
  const buttonScale = useMemo(() => new Animated.Value(1), []);

  const openZyncleWebsite = () => {
    Linking.openURL('https://zyncle.com');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    try {
      if (login) {
        await login(email, password);
        setIsSuccessVisible(true);
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        alert(error.message || 'Login failed');
      } else {
        Alert.alert('Error', error.message || 'Login failed');
      }
    }
  };

  const handleSuccessComplete = () => {
    setIsSuccessVisible(false);
    router.replace('/(tabs)');
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isFormFilled = email.trim().length > 0 && password.length > 0;

  return (
    <View style={styles.container}>
      <SuccessOverlay 
        visible={isSuccessVisible} 
        message="login suceess full" 
        onAnimationComplete={handleSuccessComplete}
      />
      {/* Split background */}
      <View style={styles.topBackground} />
      <View style={styles.bottomBackground} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >

            <View style={styles.headerArea}>
              <View style={styles.logoContainer}>
                <Image source={Logo} style={styles.logoImage} />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Log in to continue</Text>
            </View>

            {/* Floating Form Card */}
            <View style={styles.card}>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'email' && styles.inputFocused
                ]}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder="Email Address"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => {
                      setFocusedField('email');
                    }}
                    onBlur={() => setFocusedField(null)}
                    selectionColor="#22C55E"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'password' && styles.inputFocused
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => {
                      setFocusedField('password');
                    }}
                    onBlur={() => setFocusedField(null)}
                    selectionColor="#22C55E"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.button, (!isFormFilled || isLoading) ? styles.buttonDisabled : null]}
                  onPress={handleLogin}
                  activeOpacity={1}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={!isFormFilled || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Log In</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Bottom Text */}
              {/* 
              <View style={styles.bottomTextContainer}>
                <Text style={styles.bottomText}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                  <Text style={styles.registerText}>Register</Text>
                </TouchableOpacity>
              </View> 
              */}

            </View>

            <TouchableOpacity onPress={openZyncleWebsite} activeOpacity={0.7} style={styles.footerBrand}>
              <Text style={styles.footerBrandText}>Zyncle Innovations Private Limited</Text>
              <Image source={ZyncleLogo} style={styles.footerLogo} resizeMode="contain" />
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
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
    height: '50%', // Top half background
    backgroundColor: '#22C55E',
  },
  bottomBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20, // requested marginHorizontal 20, keeping it in the container padding
    paddingTop: 40,
    paddingBottom: 60,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 30,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  logoImage: {
    width: '125%',
    height: '125%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    marginHorizontal: 4, // Added small margin since container has padding 20
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderColor: '#22C55E',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#86EFAC',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 4,
  },
  bottomText: {
    color: '#6B7280',
    fontSize: 14,
  },
  registerText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
  footerBrand: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  footerBrandText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerLogo: {
    width: 140,
    height: 48,
  },
  companyBadge: {
    alignItems: 'center',
    marginTop: 14,
    gap: 3,
  },
  companyLogoImg: {
    width: 110,
    height: 30,
  },
  companyBadgeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});