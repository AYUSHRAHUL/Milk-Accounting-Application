import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login, isLoading } = useAuth();

  // Animation for the button
  const buttonScale = useMemo(() => new Animated.Value(1), []);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    try {
      if (login) {
        await login(email, password);
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error(error);
    }
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
      {/* Split background */}
      <View style={styles.topBackground} />
      <View style={styles.bottomBackground} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            keyboardShouldPersistTaps="handled" 
            showsVerticalScrollIndicator={false}
          >
            
            {/* Header Area (in Green section) */}
            <View style={styles.headerArea}>
              <View style={styles.logoContainer}>
                <Ionicons name="water" size={36} color="#22C55E" />
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
                    onFocus={() => setFocusedField('email')}
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
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    selectionColor="#22C55E"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
                <Card variant="elevated" style={styles.card}>
                    <Input
                        label="Email Address"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

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
              <View style={styles.bottomTextContainer}>
                <Text style={styles.bottomText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                  <Text style={styles.registerText}>Register</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
                    <View style={styles.footerContainer}>
                        <ThemedText style={{ color: theme.textSecondary }}>Don&apos;t have an account? </ThemedText>
                        <Link href="/(auth)/register" asChild>
                            <ThemedText type="link" style={{ color: theme.primary, fontWeight: '700' }}>Register Here</ThemedText>
                        </Link>
                    </View>
                </Card>
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
    height: '45%', // Top half background
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
    paddingBottom: 40,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    topDecoration: {
        position: 'absolute',
        top: -200,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.08,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
        backgroundColor: 'transparent',
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    logo: {
        width: 45,
        height: 45,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
    },
    card: {
        width: '100%',
    },
    loginButton: {
        marginTop: 24,
        marginBottom: 20,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
});
