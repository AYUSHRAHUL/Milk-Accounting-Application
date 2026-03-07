import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ReportsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const formatCurrency = (amount: number) =>
    '₹ ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <ThemedText style={styles.headerTitle}>Reports</ThemedText>
          <ThemedText style={styles.headerSub}>Monthly Overview</ThemedText>
        </View>
        <Ionicons name="bar-chart-outline" size={28} color="rgba(255,255,255,0.35)" />
      </View>

      {isLoading ? (
        <LoadingIndicator style={{ marginTop: Spacing.xl }} />
      ) : (
        <View style={styles.list}>

          {/* Milk Collected */}
          <TouchableOpacity onPress={() => router.push('/(tabs)/report-milk')} activeOpacity={0.82}>
            <Card variant="elevated" style={[styles.card, { borderLeftColor: theme.primary }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name="water" size={26} color={theme.primary} />
              </View>
              <View style={styles.cardContent}>
                <ThemedText style={styles.cardTitle}>Milk Collected</ThemedText>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Volume</ThemedText>
                    <ThemedText style={styles.statValue}>{metrics.milkCollection.liters.toFixed(1)} L</ThemedText>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.borderMuted }]} />
                  <View style={styles.stat}>
                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Cost</ThemedText>
                    <ThemedText style={[styles.statValue, { color: theme.error }]}>
                      {formatCurrency(metrics.milkCollection.cost)}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Card>
          </TouchableOpacity>

          {/* Sales */}
          <TouchableOpacity onPress={() => router.push('/(tabs)/report-sales')} activeOpacity={0.82}>
            <Card variant="elevated" style={[styles.card, { borderLeftColor: theme.success }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.successMuted }]}>
                <Ionicons name="cash" size={26} color={theme.success} />
              </View>
              <View style={styles.cardContent}>
                <ThemedText style={styles.cardTitle}>Sales Report</ThemedText>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Transactions</ThemedText>
                    <ThemedText style={styles.statValue}>{metrics.sales.transactions}</ThemedText>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.borderMuted }]} />
                  <View style={styles.stat}>
                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Revenue</ThemedText>
                    <ThemedText style={[styles.statValue, { color: theme.success }]}>
                      {formatCurrency(metrics.sales.revenue)}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Card>
          </TouchableOpacity>

          {/* Products */}
          <TouchableOpacity onPress={() => router.push('/(tabs)/report-products')} activeOpacity={0.82}>
            <Card variant="elevated" style={[styles.card, { borderLeftColor: theme.warning }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.warningMuted }]}>
                <Ionicons name="cube" size={26} color={theme.warning} />
              </View>
              <View style={styles.cardContent}>
                <ThemedText style={styles.cardTitle}>Products Report</ThemedText>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Batches</ThemedText>
                    <ThemedText style={styles.statValue}>{metrics.products.batches}</ThemedText>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.borderMuted }]} />
                  <View style={styles.stat}>
                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Yield</ThemedText>
                    <ThemedText style={[styles.statValue, { color: theme.warning }]}>
                      {metrics.products.produced.toFixed(1)} Units
                    </ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Card>
          </TouchableOpacity>

          {/* Suppliers */}
          <TouchableOpacity onPress={() => router.push('/(tabs)/report-suppliers')} activeOpacity={0.82}>
            <Card variant="elevated" style={[styles.card, { borderLeftColor: '#9333EA' }]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(147,51,234,0.10)' }]}>
                <Ionicons name="people" size={26} color="#9333EA" />
              </View>
              <View style={styles.cardContent}>
                <ThemedText style={styles.cardTitle}>Supplier Report</ThemedText>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Active</ThemedText>
                    <ThemedText style={styles.statValue}>{metrics.suppliers.active}</ThemedText>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.borderMuted }]} />
                  <View style={styles.stat}>
                    <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total</ThemedText>
                    <ThemedText style={[styles.statValue, { color: '#9333EA' }]}>
                      {metrics.suppliers.total}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 8,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderLeftWidth: 4,
    gap: Spacing.md,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stat: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 32,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
});
