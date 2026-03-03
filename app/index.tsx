import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

export default function LandingScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.topDecoration} />
            <ThemedView style={styles.headerContainer}>
                <View style={[styles.logoContainer, { shadowColor: theme.primary, borderColor: theme.border }]}>
                    <Image
                        source={require('@/assets/images/react-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <ThemedText type="title" style={styles.title}>Milk Management App</ThemedText>
                <ThemedText type="subtitle" style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Streamline your daily accounting
                </ThemedText>
            </ThemedView>

            <View style={styles.cardContainer}>
                <Button
                    title="Log In"
                    onPress={() => router.push('/(auth)/login')}
                    style={styles.button}
                />
                <Button
                    title="Create Account"
                    onPress={() => router.push('/(auth)/register')}
                    style={[styles.button, styles.registerButton, { borderColor: theme.primary, backgroundColor: 'transparent', shadowColor: 'transparent', elevation: 0 }]}
                    textStyle={[styles.registerButtonText, { color: theme.primary }]}
                />
            </View>
        </ScrollView>
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
        top: -150,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#4F46E5',
        opacity: 0.1,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 60,
        backgroundColor: 'transparent',
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    logo: {
        width: 70,
        height: 70,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    cardContainer: {
        width: '100%',
        gap: 8,
    },
    button: {
        width: '100%',
    },
    registerButton: {
        borderWidth: 2,
    },
    registerButtonText: {
        fontWeight: 'bold',
    },
});
