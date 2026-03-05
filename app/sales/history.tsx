import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SaleEntryData {
    _id: string;
    date: string;
    customerName?: string;
    productType: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    paymentMode: string;
}

export default function SalesHistoryScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [entries, setEntries] = useState<SaleEntryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/sales');
            if (response.ok) {
                const data = await response.json();
                setEntries(data);
            }
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchHistory();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const renderEntry = ({ item }: { item: SaleEntryData }) => (
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}>
            <View style={styles.cardHeader}>
                <View>
                    <ThemedText style={{ fontSize: 16, fontWeight: 'bold' }}>{item.customerName || 'Walk-in Customer'}</ThemedText>
                    <ThemedText style={{ fontSize: 13, color: theme.textSecondary }}>{formatDate(item.date)}</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color: theme.success }}>
                        + ₹{item.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                        {item.quantity} units @ ₹{item.pricePerUnit}
                    </ThemedText>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.cardFooter}>
                <View style={[styles.badge, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                    <ThemedText style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>{item.productType}</ThemedText>
                </View>
                <View style={[styles.badge, { backgroundColor: item.paymentMode === 'Credit' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)' }]}>
                    <ThemedText style={{ fontSize: 12, color: item.paymentMode === 'Credit' ? theme.error : theme.success, fontWeight: '600' }}>
                        {item.paymentMode}
                    </ThemedText>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.topDecoration, { backgroundColor: theme.warning }]} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText style={{ fontSize: 24, color: '#FFFFFF' }}>←</ThemedText>
                </TouchableOpacity>
                <View>
                    <ThemedText type="title" style={{ color: '#FFFFFF' }}>
                        Sales Ledger
                    </ThemedText>
                    <ThemedText style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                        History of all product sales
                    </ThemedText>
                </View>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.warning} />
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(item) => item._id}
                    renderItem={renderEntry}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 16 }}>No sales recorded yet.</ThemedText>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 180,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    backButton: {
        marginBottom: 16,
        padding: 4,
        alignSelf: 'flex-start',
    },
    listContainer: {
        padding: 24,
        paddingTop: 10,
        paddingBottom: 40,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 12,
        opacity: 0.3,
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
});
