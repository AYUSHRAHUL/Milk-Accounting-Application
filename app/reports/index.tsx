import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const TimeFilters = [
    { label: 'All Time', value: 'all' },
    { label: 'This Month', value: 'month' },
    { label: 'Today', value: 'today' },
];

export default function ReportsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [activeFilter, setActiveFilter] = useState('month');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Module Data
    const [metrics, setMetrics] = useState({
        sales: { revenue: 0, transactions: 0 },
        milkCollection: { cost: 0, liters: 0 },
        products: { produced: 0, batches: 0 },
        suppliers: { active: 0, total: 0 }
    });

    const fetchReports = useCallback(async () => {
        try {
            const response = await fetch(`/api/reports?filter=${activeFilter}`);
            if (response.ok) {
                const data = await response.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error("Failed to load reports", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [activeFilter]);

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            fetchReports();
        }, [fetchReports])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchReports();
    };

    const formatCurrency = (amount: number) => {
        return '₹ ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    return (
        <ScrollView
            contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
            <LinearGradient
                colors={[theme.primary, '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topDecoration}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText style={{ fontSize: 24, color: '#FFFFFF' }}>←</ThemedText>
                </TouchableOpacity>
                <View>
                    <ThemedText type="title" style={{ color: '#FFFFFF' }}>
                        Module Reports
                    </ThemedText>
                    <ThemedText style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                        System Activity Overview
                    </ThemedText>
                </View>
            </View>

            {/* Time Filter Tabs */}
            <View style={styles.filterContainer}>
                {TimeFilters.map((filter) => {
                    const isActive = activeFilter === filter.value;
                    return (
                        <TouchableOpacity
                            key={filter.value}
                            style={[
                                styles.filterPill,
                                {
                                    backgroundColor: isActive ? theme.primary : theme.card,
                                    borderColor: isActive ? theme.primary : theme.border,
                                }
                            ]}
                            onPress={() => setActiveFilter(filter.value)}
                            activeOpacity={0.7}
                        >
                            <ThemedText style={[
                                styles.filterText,
                                { color: isActive ? '#FFFFFF' : theme.textSecondary }
                            ]}>
                                {filter.label}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <View style={styles.gridContainer}>
                    {/* Milk Collection Module */}
                    <TouchableOpacity
                        style={[styles.moduleCard, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
                        onPress={() => router.push('/milk-collection/history')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                                <Ionicons name="water" size={24} color={theme.primary} />
                            </View>
                            <ThemedText style={styles.cardTitle}>Milk Collection</ThemedText>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.statRow}>
                                <ThemedText style={styles.statLabel}>Total Volume:</ThemedText>
                                <ThemedText style={styles.statValue}>{metrics.milkCollection.liters.toFixed(1)} L</ThemedText>
                            </View>
                            <View style={[styles.statRow, { marginTop: 8 }]}>
                                <ThemedText style={styles.statLabel}>Total Cost:</ThemedText>
                                <ThemedText style={[styles.statValue, { color: theme.error }]}>{formatCurrency(metrics.milkCollection.cost)}</ThemedText>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Sales Module */}
                    <TouchableOpacity
                        style={[styles.moduleCard, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
                        onPress={() => router.push('/sales/history')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
                                <Ionicons name="cash" size={24} color={theme.success} />
                            </View>
                            <ThemedText style={styles.cardTitle}>Sales & Revenue</ThemedText>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.statRow}>
                                <ThemedText style={styles.statLabel}>Transactions:</ThemedText>
                                <ThemedText style={styles.statValue}>{metrics.sales.transactions}</ThemedText>
                            </View>
                            <View style={[styles.statRow, { marginTop: 8 }]}>
                                <ThemedText style={styles.statLabel}>Revenue:</ThemedText>
                                <ThemedText style={[styles.statValue, { color: theme.success }]}>{formatCurrency(metrics.sales.revenue)}</ThemedText>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Products Module */}
                    <TouchableOpacity
                        style={[styles.moduleCard, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
                        onPress={() => router.push('/products')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(230, 126, 34, 0.1)' }]}>
                                <Ionicons name="cube" size={24} color={theme.warning} />
                            </View>
                            <ThemedText style={styles.cardTitle}>Production</ThemedText>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.statRow}>
                                <ThemedText style={styles.statLabel}>Batches Made:</ThemedText>
                                <ThemedText style={styles.statValue}>{metrics.products.batches}</ThemedText>
                            </View>
                            <View style={[styles.statRow, { marginTop: 8 }]}>
                                <ThemedText style={styles.statLabel}>Total Yield:</ThemedText>
                                <ThemedText style={[styles.statValue, { color: theme.warning }]}>{metrics.products.produced.toFixed(1)} Units</ThemedText>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Suppliers Module */}
                    <TouchableOpacity
                        style={[styles.moduleCard, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
                        onPress={() => router.push('/suppliers')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}>
                                <Ionicons name="people" size={24} color={theme.secondary} />
                            </View>
                            <ThemedText style={styles.cardTitle}>Suppliers</ThemedText>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.statRow}>
                                <ThemedText style={styles.statLabel}>New Profiles:</ThemedText>
                                <ThemedText style={styles.statValue}>{metrics.suppliers.active}</ThemedText>
                            </View>
                            <View style={[styles.statRow, { marginTop: 8 }]}>
                                <ThemedText style={styles.statLabel}>Total Registered:</ThemedText>
                                <ThemedText style={[styles.statValue, { color: theme.secondary }]}>{metrics.suppliers.total}</ThemedText>
                            </View>
                        </View>
                    </TouchableOpacity>

                </View>
            )}

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
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    header: {
        marginTop: 40,
        marginBottom: 20,
    },
    backButton: {
        marginBottom: 16,
        padding: 8,
        alignSelf: 'flex-start',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
    },
    filterPill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: '#fff',
    },
    filterText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    moduleCard: {
        width: '47%',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 20,
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    statRow: {
        flexDirection: 'column',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '900',
    },
});
