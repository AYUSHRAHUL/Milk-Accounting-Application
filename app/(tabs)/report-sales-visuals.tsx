import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

interface SaleEntryRow {
  _id: string;
  date: string;
  quantity: number;
  totalAmount: number;
}

export default function ReportSalesVisualsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<SaleEntryRow[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sales');
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

  const chartData = useMemo(() => {
    if (!entries.length) return null;

    const byDate = new Map<
      string,
      {
        quantity: number;
        revenue: number;
      }
    >();

    for (const e of entries) {
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
  }, [entries]);

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Sales Visuals" subtitle="Daily quantity & revenue trends." onBack={() => router.back()} />

      {isLoading ? (
        <LoadingIndicator />
      ) : !chartData ? (
        <EmptyState title="No sales data" description="Add some sales entries to see visuals here." />
      ) : (
        <View style={{ gap: 24 }}>
          <Card variant="elevated" style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Daily Quantity Sold
            </ThemedText>
            <BarChart
              data={{
                labels: chartData.labels,
                datasets: [{ data: chartData.quantities }],
              }}
              width={screenWidth}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
              }}
              style={styles.chart}
            />
          </Card>

          <Card variant="elevated" style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Daily Revenue
            </ThemedText>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [{ data: chartData.revenue }],
              }}
              width={screenWidth}
              height={220}
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
              }}
              bezier
              style={styles.chart}
            />
          </Card>
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
  card: {
    padding: 16,
  },
  cardTitle: {
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
});

