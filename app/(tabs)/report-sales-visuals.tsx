import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

interface SaleEntryRow {
  _id: string;
  date: string;
  quantity: number;
  totalAmount: number;
}

export default function ReportSalesVisualsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  type PeriodFilter = 'All' | 'Today' | '7D' | '30D';
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<SaleEntryRow[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/api/sales?userId=${user?.id}`);
      if (!response.ok) return;

      const data = await response.json();
      const mapped: SaleEntryRow[] = data.map((item: any) => ({
        _id: item._id,
        date: item.date,
        quantity: item.quantity,
        totalAmount: item.totalAmount,
      }));
      setEntries(mapped);
    } catch (error) {
      console.error('Failed to load sales entries for visuals', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = today - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;

    return entries.filter((e) => {
      const entryDate = new Date(e.date).getTime();
      if (periodFilter === 'Today') return entryDate >= today;
      if (periodFilter === '7D') return entryDate >= sevenDaysAgo;
      if (periodFilter === '30D') return entryDate >= thirtyDaysAgo;
      return true;
    });
  }, [entries, periodFilter]);

  const summary = useMemo(() => {
    const totalRevenue = filteredEntries.reduce((s, e) => s + (e.totalAmount || 0), 0);
    const totalQty = filteredEntries.reduce((s, e) => s + (e.quantity || 0), 0);
    const avgSale = filteredEntries.length > 0 ? totalRevenue / filteredEntries.length : 0;
    return { totalRevenue, totalQty, avgSale };
  }, [filteredEntries]);

  const chartData = useMemo(() => {
    if (!filteredEntries.length) return null;

    const byDate = new Map<string, { quantity: number; revenue: number }>();
    for (const e of filteredEntries) {
      const key = new Date(e.date).toISOString().slice(0, 10);
      const current = byDate.get(key) ?? { quantity: 0, revenue: 0 };
      current.quantity += e.quantity ?? 0;
      current.revenue += e.totalAmount ?? 0;
      byDate.set(key, current);
    }

    const sortedKeys = Array.from(byDate.keys()).sort();
    const lastKeys = sortedKeys.slice(-10);

    const labels = lastKeys.map((k) => {
      const d = new Date(k);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    });

    const quantities = lastKeys.map((k) => byDate.get(k)!.quantity);
    const revenue = lastKeys.map((k) => byDate.get(k)!.revenue);

    return { labels, quantities, revenue };
  }, [filteredEntries]);

  const formatCurrency = (amount: number) =>
    '₹ ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Branded Header ── */}
      <View style={[styles.header, { backgroundColor: theme.success }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/report-sales')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Sales Visuals</ThemedText>
          <ThemedText style={styles.headerSub}>Revenue Trends & Analysis</ThemedText>
        </View>
        <Ionicons name="trending-up-outline" size={28} color="rgba(255,255,255,0.35)" />
      </View>

      <View style={styles.body}>
        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.successMuted }]}>
            <ThemedText style={[styles.statValue, { color: theme.success }]}>{formatCurrency(summary.totalRevenue)}</ThemedText>
            <ThemedText style={styles.statLabel}>Revenue</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.primaryMuted }]}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>{summary.totalQty.toFixed(1)}</ThemedText>
            <ThemedText style={styles.statLabel}>Units Sold</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.warningMuted }]}>
            <ThemedText style={[styles.statValue, { color: theme.warning }]}>{formatCurrency(summary.avgSale)}</ThemedText>
            <ThemedText style={styles.statLabel}>Avg Sale</ThemedText>
          </View>
        </View>

        {/* ── Period Filter ── */}
        <Card variant="elevated" style={styles.filtersCard}>
          <ThemedText style={styles.filtersLabel}>Time Period</ThemedText>
          <View style={styles.pillsRow}>
            {(['All', 'Today', '7D', '30D'] as PeriodFilter[]).map((val) => {
              const active = periodFilter === val;
              return (
                <TouchableOpacity
                  key={val}
                  onPress={() => setPeriodFilter(val)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: active ? theme.success : theme.surfaceMuted,
                      borderColor: active ? theme.success : theme.borderMuted,
                    },
                  ]}
                >
                  <ThemedText style={[styles.pillText, { color: active ? '#fff' : theme.text }]}>
                    {val}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {isLoading ? (
          <LoadingIndicator style={{ marginTop: 40 }} />
        ) : !chartData ? (
          <EmptyState title="No data to visualise" description="Adjust filters or add sales entries." />
        ) : (
          <View style={{ gap: 24, paddingBottom: 40 }}>
            <Card variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="stats-chart" size={18} color={theme.success} />
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Daily Revenue</ThemedText>
              </View>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [{ data: chartData.revenue }],
                }}
                width={screenWidth}
                height={200}
                yAxisLabel="₹"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: theme.surface,
                  backgroundGradientFrom: theme.surface,
                  backgroundGradientTo: theme.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.success,
                  labelColor: (opacity = 1) => theme.textSecondary,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: theme.success },
                }}
                bezier
                style={styles.chart}
              />
            </Card>

            <Card variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="cube" size={18} color={theme.primary} />
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Daily Quantity Sold</ThemedText>
              </View>
              <BarChart
                data={{
                  labels: chartData.labels,
                  datasets: [{ data: chartData.quantities }],
                }}
                width={screenWidth}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: theme.surface,
                  backgroundGradientFrom: theme.surface,
                  backgroundGradientTo: theme.surface,
                  decimalPlaces: 1,
                  color: (opacity = 1) => theme.primary,
                  labelColor: (opacity = 1) => theme.textSecondary,
                }}
                style={styles.chart}
              />
            </Card>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
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
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  body: { padding: Spacing.lg, gap: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, borderRadius: 14, padding: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  statLabel: { fontSize: 10, marginTop: 2, color: 'rgba(0,0,0,0.5)', fontWeight: '600' },
  filtersCard: { padding: Spacing.md, marginBottom: Spacing.md },
  filtersLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', opacity: 0.6 },
  pillsRow: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: '700' },
  card: { padding: 16, borderRadius: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  chart: { marginTop: 8, borderRadius: 16 },
});

