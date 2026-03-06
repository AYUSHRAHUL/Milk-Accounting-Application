import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

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
        <Card variant="elevated" style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
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
                <View style={[styles.badge, { backgroundColor: theme.primaryMuted }]}>
                    <ThemedText style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>{item.productType}</ThemedText>
                </View>
                <View style={[styles.badge, { backgroundColor: item.paymentMode === 'Credit' ? theme.errorMuted : theme.successMuted }]}>
                    <ThemedText style={{ fontSize: 12, color: item.paymentMode === 'Credit' ? theme.error : theme.success, fontWeight: '600' }}>
                        {item.paymentMode}
                    </ThemedText>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
                <ScreenHeader title="Sales Ledger" subtitle="History of all product sales" onBack={() => router.back()} />
            </View>

            {isLoading ? (
                <LoadingIndicator />
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(item) => item._id}
                    renderItem={renderEntry}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <EmptyState title="No sales recorded" description="Once you record sales, they will appear here." />
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
    listContainer: {
        padding: Spacing.xl,
        paddingTop: 10,
        paddingBottom: 40,
    },
    card: {
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
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
        gap: Spacing.sm,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
});
