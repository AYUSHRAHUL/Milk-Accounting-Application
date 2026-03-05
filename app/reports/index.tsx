import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const TimeFilters = [
    { label: 'All Time', value: 'all' },
    { label: 'This Month', value: 'month' },
    { label: 'Today', value: 'today' },
];

export default function ReportsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const screenWidth = Dimensions.get('window').width;

    const [activeFilter, setActiveFilter] = useState('month');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Financial Data
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        totalMilkCost: 0,
        totalExpenses: 0,
        netProfit: 0
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

    const chartData = [
        {
            name: "Profit",
            amount: Math.max(0, metrics.netProfit),
            color: theme.primary,
            legendFontColor: theme.textSecondary,
            legendFontSize: 12
        },
        {
            name: "Milk Cost",
            amount: metrics.totalMilkCost,
            color: theme.warning,
            legendFontColor: theme.textSecondary,
            legendFontSize: 12
        },
        {
            name: "Expenses",
            amount: metrics.totalExpenses,
            color: theme.error,
            legendFontColor: theme.textSecondary,
            legendFontSize: 12
        }
    ];

    return (
        <ScrollView
            contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
            <LinearGradient
                colors={[theme.success, theme.secondary]}
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
                        Financial Reports
                    </ThemedText>
                    <ThemedText style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                        Track your business health
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
                                    backgroundColor: isActive ? theme.success : theme.card,
                                    borderColor: isActive ? theme.success : theme.border,
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
                    <ActivityIndicator size="large" color={theme.success} />
                </View>
            ) : (
                <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}>

                    {/* Top Row: Revenue & Profit */}
                    <View style={styles.metricsRow}>
                        <View style={[styles.metricBox, { backgroundColor: 'rgba(46, 204, 113, 0.08)' }]}>
                            <ThemedText style={styles.metricLabel}>Total Revenue</ThemedText>
                            <ThemedText style={[styles.metricValue, { color: theme.success }]}>
                                {formatCurrency(metrics.totalRevenue)}
                            </ThemedText>
                        </View>

                        <View style={[styles.metricBox, {
                            backgroundColor: metrics.netProfit >= 0 ? 'rgba(52, 152, 219, 0.08)' : 'rgba(231, 76, 60, 0.08)'
                        }]}>
                            <ThemedText style={styles.metricLabel}>Net Profit</ThemedText>
                            <ThemedText style={[styles.metricValue, {
                                color: metrics.netProfit >= 0 ? theme.primary : theme.error
                            }]}>
                                {formatCurrency(metrics.netProfit)}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Cost Breakdown</ThemedText>

                    {/* Bottom Row: Milk Costs & Expenses */}
                    <View style={styles.metricsRow}>
                        <View style={[styles.metricBox, { backgroundColor: 'rgba(230, 126, 34, 0.08)' }]}>
                            <ThemedText style={styles.metricLabel}>Raw Milk</ThemedText>
                            <ThemedText style={[styles.metricValue, { color: theme.warning }]}>
                                {formatCurrency(metrics.totalMilkCost)}
                            </ThemedText>
                        </View>

                        <View style={[styles.metricBox, { backgroundColor: 'rgba(231, 76, 60, 0.08)' }]}>
                            <ThemedText style={styles.metricLabel}>Op. Expenses</ThemedText>
                            <ThemedText style={[styles.metricValue, { color: theme.error }]}>
                                {formatCurrency(metrics.totalExpenses)}
                            </ThemedText>
                        </View>
                    </View>

                    {(metrics.totalRevenue > 0 || metrics.totalExpenses > 0 || metrics.totalMilkCost > 0) && (
                        <>
                            <View style={[styles.divider, { backgroundColor: theme.border, marginTop: 16 }]} />
                            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 12 }]}>Revenue Distribution</ThemedText>
                            <View style={{ alignItems: 'center' }}>
                                <PieChart
                                    data={chartData}
                                    width={screenWidth - 80}
                                    height={200}
                                    chartConfig={{
                                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    }}
                                    accessor={"amount"}
                                    backgroundColor={"transparent"}
                                    paddingLeft={"15"}
                                    center={[10, 0]}
                                    absolute
                                />
                            </View>
                        </>
                    )}

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
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
    },
    metricBox: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 10,
        opacity: 0.3,
    },
});
