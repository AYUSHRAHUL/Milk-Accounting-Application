import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ReportsScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Module Data
    const [metrics, setMetrics] = useState({
        sales: { revenue: 0, transactions: 0 },
        milkCollection: { cost: 0, liters: 0 },
        products: { produced: 0, batches: 0 },
        suppliers: { active: 0, total: 0 },
    });

    const fetchReports = useCallback(async () => {
        try {
            const response = await apiFetch(`/api/reports?filter=month&userId=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Failed to load reports', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            fetchReports();
        }, [fetchReports]),
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
            style={{ backgroundColor: theme.background }}
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
            {/* ── Branded Header ── */}
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnAbsolute}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTextCentered}>
                    <ThemedText style={styles.headerTitleCentered}>Reports</ThemedText>
                    <ThemedText style={styles.headerSubCentered}>Monthly Overview</ThemedText>
                </View>
                <TouchableOpacity disabled style={[styles.backBtnAbsolute, { left: undefined, right: Spacing.lg, backgroundColor: 'transparent' }]}>
                    <Ionicons name="stats-chart" size={24} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>
            </View>

            <View style={styles.body}>
                {isLoading ? (
                    <LoadingIndicator style={{ marginTop: Spacing.xl }} />
                ) : (
                    <View style={styles.gridContainer}>
                    {/* Milk Collected Report */}
                    <TouchableOpacity onPress={() => router.push('/(tabs)/report-milk')} activeOpacity={0.85}>
                        <Card variant="elevated" style={styles.moduleCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: theme.primaryMuted }]}>
                                    <Ionicons name="water" size={24} color={theme.primary} />
                                </View>
                                <ThemedText style={styles.cardTitle}>Milk Collected Report</ThemedText>
                            </View>
                            <View style={[styles.cardBody, { borderTopColor: theme.borderMuted }]}>
                                <View style={styles.statRow}>
                                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Volume</ThemedText>
                                    <ThemedText style={styles.statValue}>{metrics.milkCollection.liters.toFixed(1)} L</ThemedText>
                                </View>
                                <View style={[styles.statRow, { marginTop: Spacing.sm }]}>
                                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Cost</ThemedText>
                                    <ThemedText style={[styles.statValue, { color: theme.error }]}>
                                        {formatCurrency(metrics.milkCollection.cost)}
                                    </ThemedText>
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>

                    {/* Sales Report */}
                    <TouchableOpacity onPress={() => router.push('/(tabs)/report-sales')} activeOpacity={0.85}>
                        <Card variant="elevated" style={styles.moduleCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: theme.successMuted }]}>
                                    <Ionicons name="cash" size={24} color={theme.success} />
                                </View>
                                <ThemedText style={styles.cardTitle}>Sales Report</ThemedText>
                            </View>
                            <View style={[styles.cardBody, { borderTopColor: theme.borderMuted }]}>
                                <View style={styles.statRow}>
                                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Transactions</ThemedText>
                                    <ThemedText style={styles.statValue}>{metrics.sales.transactions}</ThemedText>
                                </View>
                                <View style={[styles.statRow, { marginTop: Spacing.sm }]}>
                                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Revenue</ThemedText>
                                    <ThemedText style={[styles.statValue, { color: theme.success }]}>
                                        {formatCurrency(metrics.sales.revenue)}
                                    </ThemedText>
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>



                    {/* Production Report */}
                    <TouchableOpacity onPress={() => router.push('/(tabs)/report-production')} activeOpacity={0.85}>
                        <Card variant="elevated" style={styles.moduleCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                                    <Ionicons name="flask" size={24} color="#F59E0B" />
                                </View>
                                <ThemedText style={styles.cardTitle}>Production Report</ThemedText>
                            </View>
                            <View style={[styles.cardBody, { borderTopColor: theme.borderMuted }]}>
                                <View style={styles.statRow}>
                                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Output</ThemedText>
                                    <ThemedText style={styles.statValue}>{metrics.products.produced.toFixed(1)}</ThemedText>
                                </View>
                                <View style={[styles.statRow, { marginTop: Spacing.sm }]}>
                                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Batches</ThemedText>
                                    <ThemedText style={[styles.statValue, { color: '#F59E0B' }]}>
                                        {metrics.products.batches}
                                    </ThemedText>
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>

                    {/* Supplier Report */}
                    <TouchableOpacity onPress={() => router.push('/(tabs)/report-suppliers')} activeOpacity={0.85}>
                        <Card variant="elevated" style={styles.moduleCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: theme.accentMuted }]}>
                                    <Ionicons name="people" size={24} color={theme.secondary} />
                                </View>
                                <ThemedText style={styles.cardTitle}>Supplier Report</ThemedText>
                            </View>
                            <View style={[styles.cardBody, { borderTopColor: theme.borderMuted }]}>
                                <View style={styles.statRow}>
                                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Active Suppliers</ThemedText>
                                    <ThemedText style={styles.statValue}>{metrics.suppliers.active}</ThemedText>
                                </View>
                                <View style={[styles.statRow, { marginTop: Spacing.sm }]}>
                                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Registered</ThemedText>
                                    <ThemedText style={[styles.statValue, { color: theme.secondary }]}>
                                        {metrics.suppliers.total}
                                    </ThemedText>
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>
                </View>
            )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: 50,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    headerTextCentered: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '100%' 
    },
    headerTitleCentered: { 
        fontSize: 20, 
        fontWeight: '800', 
        color: '#fff', 
        textAlign: 'center' 
    },
    headerSubCentered: { 
        fontSize: 12, 
        color: 'rgba(255,255,255,0.75)', 
        marginTop: 1, 
        textAlign: 'center' 
    },
    backBtnAbsolute: {
        position: 'absolute',
        left: Spacing.lg,
        bottom: Spacing.xl,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    body: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    moduleCard: {
        width: '47%',
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 20,
    },
    cardBody: {
        borderTopWidth: 1,
        paddingTop: Spacing.md,
    },
    statRow: {
        flexDirection: 'column',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '900',
    },
});

