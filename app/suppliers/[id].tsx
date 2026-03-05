import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SupplierData {
    _id: string;
    name: string;
    phone: string;
    address: string;
    animalType: string[];
    bankDetails?: string;
    createdAt: string;
}

export default function SupplierDetailsScreen() {
    const { id } = useLocalSearchParams();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [supplier, setSupplier] = useState<SupplierData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetch(`/api/suppliers/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setSupplier(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!supplier) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
                <ThemedText style={{ fontSize: 20 }}>Supplier not found 😕</ThemedText>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <ThemedText style={{ color: theme.primary }}>Go Back</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.topDecoration, { backgroundColor: theme.primary }]} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText style={{ fontSize: 24, color: '#FFFFFF' }}>←</ThemedText>
                </TouchableOpacity>
                <View>
                    <ThemedText type="title" style={{ color: '#FFFFFF', fontSize: 28 }}>
                        {supplier.name}
                    </ThemedText>
                    <ThemedText style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                        Joined {formatDate(supplier.createdAt)}
                    </ThemedText>
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}>
                <ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>Contact Information</ThemedText>

                <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Phone:</ThemedText>
                    <ThemedText style={styles.detailValue}>{supplier.phone}</ThemedText>
                </View>

                <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Address:</ThemedText>
                    <ThemedText style={styles.detailValue}>{supplier.address}</ThemedText>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>Livestock</ThemedText>
                <View style={styles.badgeContainer}>
                    {supplier.animalType?.map(type => (
                        <View key={type} style={[styles.badge, { backgroundColor: theme.background }]}>
                            <ThemedText style={{ fontSize: 14, color: theme.primary, fontWeight: 'bold' }}>{type}</ThemedText>
                        </View>
                    ))}
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {supplier.bankDetails ? (
                    <>
                        <ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>Bank Details</ThemedText>
                        <ThemedText style={{ fontSize: 16, marginTop: 8, lineHeight: 24, color: theme.text }}>
                            {supplier.bankDetails}
                        </ThemedText>
                    </>
                ) : (
                    <ThemedText style={{ fontStyle: 'italic', color: theme.textSecondary }}>No bank details provided.</ThemedText>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
    },
    topDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    header: {
        marginTop: 40,
        marginBottom: 32,
    },
    backButton: {
        marginBottom: 16,
        padding: 8,
        alignSelf: 'flex-start',
    },
    card: {
        width: '100%',
        padding: 24,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    detailLabel: {
        width: 80,
        fontWeight: '600',
        color: 'gray',
    },
    detailValue: {
        flex: 1,
        fontSize: 16,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 20,
        opacity: 0.3,
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 10,
    },
    badge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
});
