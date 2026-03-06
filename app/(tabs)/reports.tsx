import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function ReportsScreen() {
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
      const response = await fetch(`/api/reports?filter=month`);
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
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader title="Reports" subtitle="Sales, milk, products & suppliers." onBack={() => router.back()} />

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

          {/* Products Report */}
          <TouchableOpacity onPress={() => router.push('/(tabs)/report-products')} activeOpacity={0.85}>
            <Card variant="elevated" style={styles.moduleCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: theme.warningMuted }]}>
                <Ionicons name="cube" size={24} color={theme.warning} />
              </View>
              <ThemedText style={styles.cardTitle}>Products Report</ThemedText>
            </View>
            <View style={[styles.cardBody, { borderTopColor: theme.borderMuted }]}>
              <View style={styles.statRow}>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Batches Made</ThemedText>
                <ThemedText style={styles.statValue}>{metrics.products.batches}</ThemedText>
              </View>
              <View style={[styles.statRow, { marginTop: Spacing.sm }]}>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Yield</ThemedText>
                <ThemedText style={[styles.statValue, { color: theme.warning }]}>
                  {metrics.products.produced.toFixed(1)} Units
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
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

