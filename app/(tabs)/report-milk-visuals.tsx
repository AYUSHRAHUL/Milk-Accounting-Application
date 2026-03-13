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

interface MilkEntryRow {
  _id: string;
  date: string;
  quantity: number;
  totalCost: number;
}

export default function ReportMilkVisualsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  type PeriodFilter = 'All' | 'Today' | '7D' | '30D';
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<MilkEntryRow[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/api/milk/collection?userId=${user?.id}`);
      if (!response.ok) return;

      const data = await response.json();
      const mapped: MilkEntryRow[] = data.map((item: any) => ({
        _id: item._id,
        date: item.date,
        quantity: item.quantity,
        totalCost: item.totalCost,
      }));
      setEntries(mapped);
    } catch (error) {
      console.error('Failed to load milk entries for visuals', error);
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
    const totalQty = filteredEntries.reduce((s, e) => s + (e.quantity || 0), 0);
    const totalCost = filteredEntries.reduce((s, e) => s + (e.totalCost || 0), 0);
    const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;
    return { totalQty, totalCost, avgPrice };
  }, [filteredEntries]);

  const chartData = useMemo(() => {
    if (!filteredEntries.length) return null;

    const byDate = new Map<string, { quantity: number; cost: number }>();
    for (const e of filteredEntries) {
      const key = new Date(e.date).toISOString().slice(0, 10);
      const current = byDate.get(key) ?? { quantity: 0, cost: 0 };
      current.quantity += e.quantity ?? 0;
      current.cost += e.totalCost ?? 0;
      byDate.set(key, current);
    }

    const sortedKeys = Array.from(byDate.keys()).sort();
    const lastKeys = sortedKeys.slice(-10);

    const labels = lastKeys.map((k) => {
      const d = new Date(k);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    });

    const quantities = lastKeys.map((k) => byDate.get(k)!.quantity);
    const costs = lastKeys.map((k) => byDate.get(k)!.cost);

    return { labels, quantities, costs };
  }, [filteredEntries]);

  const formatCurrency = (amount: number) =>
    '₹ ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 1 });

  const screenWidth = Dimensions.get('window').width - 64; // Spacing.lg (16) * 2 for body + 16 * 2 for card padding

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Branded Header ── */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/report-milk')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Milk Visuals</ThemedText>
          <ThemedText style={styles.headerSub}>Data Visualization & Trends</ThemedText>
        </View>
        <TouchableOpacity disabled style={[styles.backBtn, { backgroundColor: 'transparent' }]}>
          <Ionicons name="stats-chart-outline" size={24} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.primaryMuted }]}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>{summary.totalQty.toFixed(1)}L</ThemedText>
            <ThemedText style={styles.statLabel}>Volume</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.errorMuted }]}>
            <ThemedText style={[styles.statValue, { color: theme.error }]}>{formatCurrency(summary.totalCost)}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Cost</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.warningMuted }]}>
            <ThemedText style={[styles.statValue, { color: theme.warning }]}>{formatCurrency(summary.avgPrice)}/L</ThemedText>
            <ThemedText style={styles.statLabel}>Avg Price</ThemedText>
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
                      backgroundColor: active ? theme.primary : theme.surfaceMuted,
                      borderColor: active ? theme.primary : theme.borderMuted,
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
          <EmptyState title="No data to visualise" description="Adjust filters or add milk collection entries." />
        ) : (
          <View style={{ gap: 24, paddingBottom: 40 }}>
            <Card variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="water" size={18} color={theme.primary} />
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Daily Volume (Litres)</ThemedText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
                <LineChart
                  data={{
                    labels: chartData.labels,
                    datasets: [{ data: chartData.quantities }],
                  }}
                  width={Math.max(screenWidth, chartData.labels.length * 60)}
                  height={220}
                  yAxisSuffix="L"
                  chartConfig={{
                    backgroundColor: theme.surface,
                    backgroundGradientFrom: theme.surface,
                    backgroundGradientTo: theme.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => theme.primary,
                    labelColor: (opacity = 1) => theme.textSecondary,
                    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.primary },
                    propsForLabels: { fontSize: 10 },
                  }}
                  bezier
                  style={styles.chart}
                />
              </ScrollView>
            </Card>

            <Card variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="wallet" size={18} color={theme.success} />
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Daily Purchase Cost</ThemedText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
                <BarChart
                  data={{
                    labels: chartData.labels,
                    datasets: [{ data: chartData.costs }],
                  }}
                  width={Math.max(screenWidth, chartData.labels.length * 60)}
                  height={220}
                  yAxisLabel="₹"
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: theme.surface,
                    backgroundGradientFrom: theme.surface,
                    backgroundGradientTo: theme.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => theme.success,
                    labelColor: (opacity = 1) => theme.textSecondary,
                    propsForLabels: { fontSize: 10 },
                  }}
                  style={styles.chart}
                />
              </ScrollView>
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
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1, textAlign: 'center' },
  body: { padding: Spacing.lg, gap: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, borderRadius: 14, padding: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
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

