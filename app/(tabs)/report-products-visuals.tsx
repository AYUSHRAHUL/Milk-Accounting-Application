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

interface ProductionRow {
  _id: string;
  date: string;
  productType: string;
  quantityProduced: number;
  milkUsedLiters: number;
}

export default function ReportProductsVisualsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<ProductionRow[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products/production');
      if (!response.ok) return;

      const data = await response.json();
      const mapped: ProductionRow[] = data.map((item: any) => ({
        _id: item._id,
        date: item.date,
        productType: item.productType,
        quantityProduced: item.quantityProduced,
        milkUsedLiters: item.milkUsedLiters,
      }));
      setEntries(mapped);
    } catch (error) {
      console.error('Failed to load production entries for visuals', error);
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
        produced: number;
        milkUsed: number;
      }
    >();

    for (const e of entries) {
      const key = new Date(e.date).toISOString().slice(0, 10);
      const current = byDate.get(key) ?? { produced: 0, milkUsed: 0 };
      current.produced += e.quantityProduced ?? 0;
      current.milkUsed += e.milkUsedLiters ?? 0;
      byDate.set(key, current);
    }

    const sortedKeys = Array.from(byDate.keys()).sort();
    const lastKeys = sortedKeys.slice(-10);

    const labels = lastKeys.map((k) => {
      const d = new Date(k);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    });

    const produced = lastKeys.map((k) => byDate.get(k)!.produced);
    const milkUsed = lastKeys.map((k) => byDate.get(k)!.milkUsed);

    return { labels, produced, milkUsed };
  }, [entries]);

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Products Visuals" subtitle="Daily production & milk usage." onBack={() => router.back()} />

      {isLoading ? (
        <LoadingIndicator />
      ) : !chartData ? (
        <EmptyState title="No production data" description="Add production entries to see visuals here." />
      ) : (
        <View style={{ gap: 24 }}>
          <Card variant="elevated" style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Daily Quantity Produced
            </ThemedText>
            <BarChart
              data={{
                labels: chartData.labels,
                datasets: [{ data: chartData.produced }],
              }}
              width={screenWidth}
              height={220}
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
              }}
              style={styles.chart}
            />
          </Card>

          <Card variant="elevated" style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Daily Milk Used (L)
            </ThemedText>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [{ data: chartData.milkUsed }],
              }}
              width={screenWidth}
              height={220}
              yAxisSuffix="L"
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`,
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

