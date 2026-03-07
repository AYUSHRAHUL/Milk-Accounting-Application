import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <Card variant="elevated" style={styles.card}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleViewDetails(item._id)}
                style={styles.cardMain}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={20} color={theme.primary} />
                    </View>
                    <View style={styles.mainInfo}>
                        <View style={styles.nameRow}>
                            <ThemedText style={styles.supplierName}>{item.name}</ThemedText>
                            {item.supplierId && (
                                <View style={[styles.idBadge, { backgroundColor: theme.primaryMuted }]}>
                                    <ThemedText style={[styles.idText, { color: theme.primary }]}>{item.supplierId}</ThemedText>
                                </View>
                            )}
                        </View>
                        <View style={styles.detailsRow}>
                            <View style={styles.detailItem}>
                                <Ionicons name="call" size={10} color={theme.textSecondary} />
                                <ThemedText style={styles.contactText}>{item.phone}</ThemedText>
                            </View>
                            <View style={styles.detailItem}>
                                <Ionicons name="location" size={10} color={theme.textSecondary} />
                                <ThemedText style={styles.contactText} numberOfLines={1}>{item.address}</ThemedText>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDelete(item._id, item.name)}
                        style={[styles.deleteBtn, { backgroundColor: theme.error + '15' }]}
                    >
                        <Ionicons name="trash" size={16} color={theme.error} />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSection}>
                    <View style={styles.animalBadges}>
                        {item.animalType?.map(type => (
                            <View key={type} style={[styles.animalBadge, { backgroundColor: theme.background, borderColor: theme.borderMuted }]}>
                                <ThemedText style={[styles.animalText, { color: theme.primary }]}>
                                    {type === 'Cow' ? '🐄 ' : '🐃 '}{type}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Suppliers</ThemedText>
                <TouchableOpacity
                    style={[styles.addNewBtn, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/suppliers/manage')}
                >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.addNewText}>Add New</ThemedText>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <LoadingIndicator />
            ) : (
                <FlatList
                    data={suppliers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderSupplier}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading && suppliers.length > 0}
                            onRefresh={fetchSuppliers}
                            colors={[theme.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            title="No suppliers yet"
                            description="Add your first supplier to begin managing collections."
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    addNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
    },
    addNewText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 16,
        padding: 0,
        overflow: 'hidden',
    },
    cardMain: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DCFCE7', // Light Green
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    mainInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 0,
    },
    supplierName: {
        fontSize: 16,
        fontWeight: '700',
    },
    idBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    idText: {
        fontSize: 10,
        fontWeight: '800',
    },
    contactText: {
        fontSize: 12,
        color: '#6B7280', // Secondary Text
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 2,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    deleteBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    bottomSection: {
        marginTop: 4,
    },
    animalBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    animalBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    animalText: {
        fontSize: 11,
        fontWeight: '600',
    },
});
