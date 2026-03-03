import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useAuth();

    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const handleLogin = async () => {
        if (!email || !password) return;
        try {
            await login(email, password);
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.topDecoration, { backgroundColor: theme.primary }]} />

                <ThemedView style={styles.headerContainer}>
                    <View style={[styles.logoContainer, { shadowColor: theme.primary, borderColor: theme.border }]}>
                        <Image
                            source={require('@/assets/images/react-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
                    <ThemedText type="subtitle" style={[styles.subtitle, { color: theme.textSecondary }]}>Log in to continue</ThemedText>
                </ThemedView>

                <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}>
                    <Input
                        label="Email Address"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        title="Log In"
                        onPress={handleLogin}
                        loading={isLoading}
                        style={styles.loginButton}
                        disabled={!email || !password || isLoading}
                    />

                    <View style={styles.footerContainer}>
                        <ThemedText style={{ color: theme.textSecondary }}>Don&apos;t have an account? </ThemedText>
                        <Link href="/(auth)/register" asChild>
                            <ThemedText type="link" style={{ color: theme.primary, fontWeight: '700' }}>Register Here</ThemedText>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
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
        padding: 24,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
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
