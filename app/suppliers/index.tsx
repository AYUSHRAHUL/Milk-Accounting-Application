import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SupplierData {
    _id: string;
    supplierId?: string;
    name: string;
    phone: string;
    address: string;
    animalType: string[];
}

export default function SuppliersListScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/suppliers');
            if (response.ok) {
                const data = await response.json();
                setSuppliers(data);
            } else {
                console.error('Failed to fetch suppliers');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh suppliers every time the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchSuppliers();
        }, [])
    );

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'Delete Supplier',
            `Are you sure you want to remove ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
                            if (response.ok) {
                                setSuppliers(prev => prev.filter(s => s._id !== id));
                            } else {
                                Alert.alert('Error', 'Failed to delete supplier');
                            }
                        } catch {
                            Alert.alert('Error', 'Network error while deleting');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (supplier: SupplierData) => {
        router.push({
            pathname: '/suppliers/manage',
            params: { ...supplier, animalType: supplier.animalType ? supplier.animalType.join(',') : '' }
        });
    };

    const handleViewDetails = (id: string) => {
        router.push(`/suppliers/${id}`);
    };

    const renderSupplier = ({ item }: { item: SupplierData }) => (
        <TouchableOpacity
            style={styles.cardPressable}
            onPress={() => handleViewDetails(item._id)}
            activeOpacity={0.7}
        >
            <Card variant="elevated" style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
            <View style={styles.cardInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</ThemedText>
                    {item.supplierId && (
                        <View style={{ backgroundColor: theme.primaryMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <ThemedText style={{ fontSize: 12, color: theme.primary, fontWeight: 'bold' }}>{item.supplierId}</ThemedText>
                        </View>
                    )}
                </View>
                <ThemedText style={{ color: theme.textSecondary, marginTop: 4 }}>📞 {item.phone}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, marginTop: 2 }}>📍 {item.address}</ThemedText>
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {item.animalType?.map(type => (
                        <View key={type} style={[styles.badge, { backgroundColor: theme.background }]}>
                            <ThemedText style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>{type}</ThemedText>
                        </View>
                    ))}
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                    <ThemedText style={{ fontSize: 20 }}>✏️</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} style={styles.actionBtn}>
                    <ThemedText style={{ fontSize: 20 }}>🗑️</ThemedText>
                </TouchableOpacity>
            </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.topRow}>
                 
                <Button title="Add New" onPress={() => router.push('/suppliers/manage')} style={styles.addBtn} />
            </View>

            {isLoading ? (
                <LoadingIndicator />
            ) : suppliers.length === 0 ? (
                <EmptyState title="No suppliers yet" description="Add your first supplier to get started." />
            ) : (
                <FlatList
                    data={suppliers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderSupplier}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.xl,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    backBtn: {
        paddingVertical: 8,
        paddingRight: 12,
    },
    addBtn: {
        height: 40,
        minWidth: 120,
    },
    cardPressable: { marginBottom: Spacing.lg },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.xl,
    },
    cardInfo: {
        flex: 1,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 8,
    },
    actions: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginLeft: Spacing.lg,
    },
    actionBtn: {
        padding: 8,
    }
});
