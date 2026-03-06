import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProductionRow {
  _id: string;
  date: string;
  productType: string;
  source: string;
  fatType: string;
  milkUsedLiters: number;
  quantityProduced: number;
}

type ProductFilter = 'All' | 'Paneer' | 'Ghee' | 'Butter' | 'Curd' | 'Other';
type SourceFilter = 'All' | 'Cow' | 'Buffalo' | 'Goat' | 'Other';

export default function ReportProductsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<ProductionRow[]>([]);
  const [productFilter, setProductFilter] = useState<ProductFilter>('All');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All');
  const [exportModalVisible, setExportModalVisible] = useState(false);

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
        source: item.source,
        fatType: item.fatType,
        milkUsedLiters: item.milkUsedLiters,
        quantityProduced: item.quantityProduced,
      }));
      setEntries(mapped);
    } catch (error) {
      console.error('Failed to load production entries', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const productOk = productFilter === 'All' || e.productType === productFilter;
      const sourceOk = sourceFilter === 'All' || e.source === sourceFilter;
      return productOk && sourceOk;
    });
  }, [entries, productFilter, sourceFilter]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const handleExport = () => {
    if (!filtered.length) {
      Alert.alert('No data to export');
      return;
    }

    const header = [
      'Date',
      'Product',
      'Source',
      'Fat Type',
      'Milk Used (L)',
      'Quantity Produced',
    ];

    const rows = filtered.map((e) => [
      formatDate(e.date),
      e.productType,
      e.source,
      e.fatType,
      e.milkUsedLiters.toString(),
      e.quantityProduced.toString(),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products-report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Export', 'Export Data is currently supported on web view.');
    }

    setExportModalVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Products Report"
        subtitle="Production history with filters, export & visuals."
        onBack={() => router.back()}
      />

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <Button title="Export Data" onPress={() => setExportModalVisible(true)} style={styles.actionButton} />
        <Button
          title="See Visuals"
          onPress={() => router.push('/(tabs)/report-products-visuals')}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      {/* Filters */}
      <Card variant="elevated" style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Product</ThemedText>
          <View style={styles.filterPillsRow}>
            {(['All', 'Paneer', 'Ghee', 'Butter', 'Curd', 'Other'] as ProductFilter[]).map((value) => {
              const selected = productFilter === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setProductFilter(value)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: selected ? theme.warning : 'transparent',
                      borderColor: selected ? theme.warning : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={{ fontSize: 12, color: selected ? '#fff' : theme.textSecondary, fontWeight: '600' }}
                  >
                    {value}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Milk Source</ThemedText>
          <View style={styles.filterPillsRow}>
            {(['All', 'Cow', 'Buffalo', 'Goat', 'Other'] as SourceFilter[]).map((value) => {
              const selected = sourceFilter === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setSourceFilter(value)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: selected ? theme.warning : 'transparent',
                      borderColor: selected ? theme.warning : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={{ fontSize: 12, color: selected ? '#fff' : theme.textSecondary, fontWeight: '600' }}
                  >
                    {value}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Card>

      {/* Data table */}
      <Card variant="elevated" style={styles.tableWrapper}>
        {isLoading ? (
          <LoadingIndicator />
        ) : filtered.length === 0 ? (
          <EmptyState title="No production entries found" description="Try changing filters to see results." />
        ) : (
          <ScrollView horizontal bounces={false}>
            <View>
              <View style={[styles.row, styles.headerRow, { backgroundColor: theme.surfaceMuted }]}>
                <ThemedText style={[styles.cell, styles.headerCell]}>Date</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Product</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Source</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Fat Type</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Milk Used (L)</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Quantity Produced</ThemedText>
              </View>

              {filtered.map((entry) => (
                <View key={entry._id} style={styles.row}>
                  <ThemedText style={styles.cell}>{formatDate(entry.date)}</ThemedText>
                  <ThemedText style={styles.cell}>{entry.productType}</ThemedText>
                  <ThemedText style={styles.cell}>{entry.source}</ThemedText>
                  <ThemedText style={styles.cell}>{entry.fatType}</ThemedText>
                  <ThemedText style={styles.cell}>{entry.milkUsedLiters.toFixed(2)}</ThemedText>
                  <ThemedText style={styles.cell}>{entry.quantityProduced.toFixed(2)}</ThemedText>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </Card>

      {/* Export confirmation modal */}
      <Modal visible={exportModalVisible} transparent animationType="fade" onRequestClose={() => setExportModalVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ThemedText type="title" style={{ marginBottom: 8 }}>
              Export Data
            </ThemedText>
            <ThemedText style={{ marginBottom: 16 }}>
              Current filtered production data ko CSV file ke roop mein download karna hai?
            </ThemedText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <Button
                title="Cancel"
                onPress={() => setExportModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }]}
                textStyle={{ color: theme.text }}
              />
              <Button title="Download" onPress={handleExport} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexGrow: 1,
    marginVertical: 0,
  },
  filtersContainer: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  filterGroup: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  tableWrapper: {
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {},
  cell: {
    minWidth: 110,
    fontSize: 12,
    marginRight: Spacing.md,
  },
  headerCell: {
    fontWeight: '700',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: Spacing.xl,
  },
  modalButton: {
    minWidth: 110,
  },
});

