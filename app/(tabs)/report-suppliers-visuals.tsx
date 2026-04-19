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

interface SupplierRow {
  _id: string;
  name: string;
  isActive: boolean;
  address: string;
  animalType: string[];
  createdAt: string;
}

export default function ReportSuppliersVisualsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<SupplierRow[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/api/suppliers?userId=${user?.id}&status=all`);
      if (!response.ok) return;

      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load suppliers for visuals', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  const stats = useMemo(() => {
    if (!entries.length) return null;

    // 1. Animal Counts
    const animalCounts: Record<string, number> = {};
    entries.forEach(e => {
      (e.animalType || []).forEach(type => {
        animalCounts[type] = (animalCounts[type] || 0) + 1;
      });
    });

    // 2. Village Counts
    const villageCounts: Record<string, number> = {};
    entries.forEach(e => {
      const village = e.address?.split(',')[0]?.trim() || 'Unknown';
      villageCounts[village] = (villageCounts[village] || 0) + 1;
    });

    // 3. Growth over months
    const growthData: Record<string, number> = {};
    entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    entries.forEach(e => {
      const date = new Date(e.createdAt);
      const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().slice(-2)}`;
      growthData[key] = (growthData[key] || 0) + 1;
    });

    const activeCount = entries.filter(e => e.isActive).length;
    const topAnimal = Object.entries(animalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      total: entries.length,
      active: activeCount,
      topAnimal,
      animalLabels: Object.keys(animalCounts),
      animalValues: Object.values(animalCounts),
      villageLabels: Object.keys(villageCounts).slice(0, 5),
      villageValues: Object.values(villageCounts).slice(0, 5),
      growthLabels: Object.keys(growthData).slice(-6),
      growthValues: Object.values(growthData).slice(-6),
    };
  }, [entries]);

  const screenWidth = Dimensions.get('window').width - 64; // Spacing.lg * 4

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Branded Centered Header ── */}
      <View style={[styles.header, { backgroundColor: '#22C55E' }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/report-suppliers')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Supplier Visuals</ThemedText>
          <ThemedText style={styles.headerSub}>Distribution & Growth Trends</ThemedText>
        </View>
        <TouchableOpacity disabled style={[styles.backBtn, { backgroundColor: 'transparent' }]}>
          <Ionicons name="people-outline" size={24} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <LoadingIndicator style={{ marginTop: 40 }} />
        ) : !stats ? (
          <EmptyState title="No supplier data found" description="Add suppliers to see detailed visualizations." />
        ) : (
          <View style={{ gap: 20, paddingBottom: 40 }}>
            
            {/* ── Summary Stats ── */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                <ThemedText style={[styles.statValue, { color: '#16A34A' }]}>{stats.total}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Suppliers</ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <ThemedText style={[styles.statValue, { color: '#2563EB' }]}>{stats.active}</ThemedText>
                <ThemedText style={styles.statLabel}>Active Now</ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                <ThemedText style={[styles.statValue, { color: '#D97706' }]}>{stats.topAnimal}</ThemedText>
                <ThemedText style={styles.statLabel}>Top Source</ThemedText>
              </View>
            </View>

            {/* ── Animal Type Distribution ── */}
            <Card variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="paw" size={18} color="#22C55E" />
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Suppliers by Animal Type</ThemedText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
                <BarChart
                  data={{
                    labels: stats.animalLabels,
                    datasets: [{ data: stats.animalValues }],
                  }}
                  width={Math.max(screenWidth, stats.animalLabels.length * 80)}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: theme.surface,
                    backgroundGradientFrom: theme.surface,
                    backgroundGradientTo: theme.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                    labelColor: (opacity = 1) => theme.textSecondary,
                    propsForLabels: { fontSize: 10 },
                  }}
                  style={styles.chart}
                />
              </ScrollView>
            </Card>

            {/* ── Registration Trend ── */}
            <Card variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="trending-up" size={18} color="#3B82F6" />
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>New Suppliers (Monthly)</ThemedText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
                <LineChart
                  data={{
                    labels: stats.growthLabels,
                    datasets: [{ data: stats.growthValues }],
                  }}
                  width={Math.max(screenWidth, stats.growthLabels.length * 70)}
                  height={220}
                  chartConfig={{
                    backgroundColor: theme.surface,
                    backgroundGradientFrom: theme.surface,
                    backgroundGradientTo: theme.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    labelColor: (opacity = 1) => theme.textSecondary,
                    propsForDots: { r: '5', strokeWidth: '2', stroke: '#3B82F6' },
                    propsForLabels: { fontSize: 10 },
                  }}
                  bezier
                  style={styles.chart}
                />
              </ScrollView>
            </Card>

            {/* ── Top Villages ── */}
            <Card variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="location" size={18} color="#F59E0B" />
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Top Supplier Villages</ThemedText>
              </View>
              <BarChart
                data={{
                  labels: stats.villageLabels,
                  datasets: [{ data: stats.villageValues }],
                }}
                width={screenWidth}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: theme.surface,
                  backgroundGradientFrom: theme.surface,
                  backgroundGradientTo: theme.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                  labelColor: (opacity = 1) => theme.textSecondary,
                  propsForLabels: { fontSize: 10 },
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
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1, textAlign: 'center' },
  body: { padding: Spacing.lg, gap: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 8 },
  statCard: { flex: 1, borderRadius: 16, padding: Spacing.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  statValue: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  statLabel: { fontSize: 10, marginTop: 4, color: 'rgba(0,0,0,0.5)', fontWeight: '700', textTransform: 'uppercase' },
  card: { padding: 16, borderRadius: 24, marginBottom: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  chart: { marginTop: 8, borderRadius: 16 },
});
