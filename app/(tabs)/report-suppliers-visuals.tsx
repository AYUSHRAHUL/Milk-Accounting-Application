import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { BarChart } from 'react-native-chart-kit';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

interface SupplierRow {
  _id: string;
  animalType: string[];
  createdAt: string;
}

export default function ReportSuppliersVisualsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<SupplierRow[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/suppliers');
      if (!response.ok) return;

      const data = await response.json();
      const mapped: SupplierRow[] = data.map((item: any) => ({
        _id: item._id,
        animalType: item.animalType || [],
        createdAt: item.createdAt,
      }));
      setEntries(mapped);
    } catch (error) {
      console.error('Failed to load suppliers for visuals', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  const animalChart = useMemo(() => {
    if (!entries.length) return null;

    const counts: Record<string, number> = {
      Cow: 0,
      Buffalo: 0,
      Goat: 0,
      Other: 0,
    };

    for (const e of entries) {
      for (const type of e.animalType || []) {
        if (counts[type] !== undefined) {
          counts[type] += 1;
        } else {
          counts.Other += 1;
        }
      }
    }

    const labels = Object.keys(counts);
    const values = labels.map((l) => counts[l]);
    return { labels, values };
  }, [entries]);

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Supplier Visuals"
        subtitle="Distribution of suppliers by animal type."
        onBack={() => router.back()}
      />

      {isLoading ? (
        <LoadingIndicator />
      ) : !animalChart ? (
        <EmptyState title="No supplier data" description="Add suppliers to see visuals here." />
      ) : (
        <View style={{ gap: 24 }}>
          <Card variant="elevated" style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Suppliers by Animal Type
            </ThemedText>
            <BarChart
              data={{
                labels: animalChart.labels,
                datasets: [{ data: animalChart.values }],
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
                color: (opacity = 1) => `rgba(192, 132, 252, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
              }}
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

