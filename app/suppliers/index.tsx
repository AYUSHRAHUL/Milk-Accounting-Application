import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SupplierData {
    _id: string;
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
                        } catch (error) {
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
            style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
            onPress={() => handleViewDetails(item._id)}
            activeOpacity={0.7}
        >
            <View style={styles.cardInfo}>
                <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</ThemedText>
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
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.topDecoration, { backgroundColor: theme.secondary }]} />

            <View style={styles.header}>
                <View>
                    <ThemedText type="title" style={{ color: colorScheme === 'light' ? '#fff' : theme.text }}>
                        Suppliers
                    </ThemedText>
                    <ThemedText style={{ color: colorScheme === 'light' ? 'rgba(255,255,255,0.8)' : theme.textSecondary, marginTop: 4 }}>
                        Manage your milk providers
                    </ThemedText>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.card }]}
                    onPress={() => router.push('/suppliers/manage')}
                >
                    <ThemedText style={{ color: theme.secondary, fontWeight: 'bold' }}>+ Add New</ThemedText>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={theme.secondary} style={{ marginTop: 50 }} />
            ) : suppliers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <ThemedText style={{ fontSize: 40, marginBottom: 10 }}>🧑‍🌾</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }}>No suppliers added yet.</ThemedText>
                </View>
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
        padding: 24,
    },
    topDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 160,
    },
    header: {
        marginTop: 40,
        marginBottom: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
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
        marginLeft: 16,
    },
    actionBtn: {
        padding: 8,
    }
});
