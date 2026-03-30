import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { ThemedText } from '../themed-text';

export interface CompleteReportEntry {
  date: string;
  openingBalance: number;
  milkCollection: number;
  availableMilk: number;
  productionUse: number;
  sales: number;
  supplierCost: number;
  closingBalance: number;
  collections?: { supplier: string; qty: number }[];
  productions?: { product: string; qty: number; usedWhole?: number }[];
  salesDetails?: { product: string; qty: number; amount: number }[];
}

interface CompleteReportTableProps {
  entries: CompleteReportEntry[];
}

export function CompleteReportTable({ entries }: CompleteReportTableProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [filterMode, setFilterMode] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const formatDateShort = (dateValue: string | Date) => {
    const d = new Date(dateValue);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount > 0 ? '₹' + amount.toLocaleString('en-IN') : '-';
  };

  const formatLiters = (amount: number) => {
    return amount > 0 ? amount.toFixed(1) + ' L' : '-';
  };

  const filteredEntries = useMemo(() => {
    if (filterMode === 'month') {
      const targetMonth = selectedDate.getMonth();
      const targetYear = selectedDate.getFullYear();
      return entries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });
    } else {
      const targetDate = selectedDate.getDate();
      const targetMonth = selectedDate.getMonth();
      const targetYear = selectedDate.getFullYear();
      return entries.filter(e => {
        const d = new Date(e.date);
        return d.getDate() === targetDate && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });
    }
  }, [entries, filterMode, selectedDate]);

  const downloadCSV = async () => {
    if (filteredEntries.length === 0) {
      Alert.alert('No Data', 'There is no data to export for this view.');
      return;
    }

    const headers = ['Date', 'Opening Bal', 'Milk Collection', 'Available Milk', 'Production', 'Sales', 'Supplier Cost', 'Closing Bal'];
    const rows = filteredEntries.map((e) => [
      formatDateShort(e.date),
      e.openingBalance.toFixed(2),
      e.milkCollection.toFixed(2),
      e.availableMilk.toFixed(2),
      e.productionUse.toFixed(2),
      e.sales > 0 ? e.sales.toString() : '0',
      e.supplierCost > 0 ? e.supplierCost.toString() : '0',
      e.closingBalance.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const isoDate = selectedDate.toISOString().split('T')[0];

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `MilkApp_Detailed_${filterMode}_${isoDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const fileName = `Detailed_${filterMode}_${Date.now()}.csv`;
      let dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
      if (dir && !dir.endsWith('/')) {
        dir += '/';
      }
      if (!dir) {
        Alert.alert('Error', 'Storage directory not available. Please ensure app has storage permissions.');
        return;
      }
      const fileUri = dir + fileName;

      try {
        await (FileSystem as any).writeAsStringAsync(fileUri, csvContent, {
          encoding: 'utf8',
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Sharing not available', 'The file was saved but sharing is not supported on this device.');
        }
      } catch (error) {
        console.error('CSV Export Error:', error);
        Alert.alert('Export Failed', 'An error occurred while exporting the report.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header and Controls */}
      <View style={styles.controlsHeader}>
        <ThemedText style={styles.sectionTitle}>Complete Analysis Details</ThemedText>

        <View style={styles.controlsRight}>
          <TouchableOpacity onPress={downloadCSV} style={styles.downloadBtn} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={16} color="#FFF" />
            <ThemedText style={styles.downloadText}>Export</ThemedText>
          </TouchableOpacity>

          <View style={[styles.toggleGroup, { borderColor: theme.borderMuted }]}>
            <TouchableOpacity
              style={[styles.toggleBtn, filterMode === 'day' && { backgroundColor: theme.primary, borderRightColor: theme.borderMuted }]}
              onPress={() => setFilterMode('day')}
            >
              <ThemedText style={[styles.toggleText, filterMode === 'day' && styles.toggleTextActive]}>Day</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, filterMode === 'month' && { backgroundColor: theme.primary }]}
              onPress={() => setFilterMode('month')}
            >
              <ThemedText style={[styles.toggleText, filterMode === 'month' && styles.toggleTextActive]}>Month</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Navigator */}
      <View style={styles.dateNavigatorRow}>
        <TouchableOpacity onPress={handlePrevDay} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Ionicons name="calendar-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
        <ThemedText style={styles.dateText}>
          {filterMode === 'day'
            ? selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
            : selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
          }
        </ThemedText>
        <TouchableOpacity onPress={handleNextDay} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Table Area */}
      <View style={[styles.tableWrapper, { backgroundColor: theme.card, borderColor: theme.borderMuted, borderWidth: 1 }]}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View>
            {/* Table Header Row */}
            <View style={[styles.tableHeader, { backgroundColor: theme.primaryMuted + '40', borderBottomColor: theme.borderMuted }]}>
              <ThemedText style={[styles.cell, styles.headerCell, { width: 90 }]}>Date</ThemedText>
              <ThemedText style={[styles.cell, styles.headerCell, { width: 100, textAlign: 'right' }]}>Opening Bal</ThemedText>
              <ThemedText style={[styles.cell, styles.headerCell, { width: 120, textAlign: 'right' }]}>Milk Collection</ThemedText>
              <ThemedText style={[styles.cell, styles.headerCell, { width: 100, textAlign: 'right', color: theme.primary }]}>Total Mlk</ThemedText>
              <ThemedText style={[styles.cell, styles.headerCell, { width: 100, textAlign: 'right', color: '#F59E0B' }]}>Production</ThemedText>
              <ThemedText style={[styles.cell, styles.headerCell, { width: 100, textAlign: 'right', color: theme.success }]}>Sales</ThemedText>
              <ThemedText style={[styles.cell, styles.headerCell, { width: 110, textAlign: 'right', color: '#9333EA' }]}>Supplier Costs</ThemedText>
              <ThemedText style={[styles.cell, styles.headerCell, { width: 100, textAlign: 'right', color: theme.primary }]}>Closing Bal</ThemedText>
            </View>

            {/* Table Body */}
            {filteredEntries.length > 0 ? (
              filteredEntries.map((item, index) => (
                <View
                  key={item.date}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                      borderBottomColor: theme.borderMuted,
                    },
                  ]}
                >
                  <ThemedText style={[styles.cell, { width: 90, fontSize: 13, fontWeight: 'bold' }]}>{formatDateShort(item.date)}</ThemedText>

                  <View style={[styles.cell, { width: 100 }]}>
                    <ThemedText style={{ textAlign: 'right', color: theme.textSecondary }}>{formatLiters(item.openingBalance)}</ThemedText>
                  </View>

                  <View style={[styles.cell, { width: 120 }]}>
                    <ThemedText style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatLiters(item.milkCollection)}</ThemedText>
                  </View>

                  <View style={[styles.cell, { width: 100, alignItems: 'flex-end', justifyContent: 'center' }]}>
                    <View style={{ backgroundColor: theme.primaryMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <ThemedText style={{ color: theme.primary, fontWeight: '800' }}>{formatLiters(item.availableMilk)}</ThemedText>
                    </View>
                  </View>

                  <View style={[styles.cell, { width: 100 }]}>
                    <ThemedText style={{ textAlign: 'right', color: '#F59E0B', fontWeight: 'bold' }}>{formatLiters(item.productionUse)}</ThemedText>
                  </View>

                  <View style={[styles.cell, { width: 100 }]}>
                    <ThemedText style={{ textAlign: 'right', color: theme.success, fontWeight: 'bold' }}>{formatCurrency(item.sales)}</ThemedText>
                  </View>

                  <View style={[styles.cell, { width: 110 }]}>
                    <ThemedText style={{ textAlign: 'right', color: '#9333EA', fontWeight: 'bold' }}>{formatCurrency(item.supplierCost)}</ThemedText>
                  </View>

                  <View style={[styles.cell, { width: 100 }]}>
                    <ThemedText style={{ textAlign: 'right', fontWeight: '900', color: theme.text }}>{formatLiters(item.closingBalance)}</ThemedText>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={40} color={theme.textSecondary} style={{ opacity: 0.4 }} />
                <ThemedText style={{ color: theme.textSecondary, marginTop: 8, fontSize: 13 }}>No entries for this period.</ThemedText>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xl,
  },
  controlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  toggleGroup: {
    flexDirection: 'row',
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'transparent',
    borderRightWidth: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  toggleTextActive: {
    color: '#FFF',
    opacity: 1,
  },
  dateNavigatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navBtn: {
    padding: Spacing.xs,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  tableWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 150,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  cell: {
    paddingHorizontal: 4,
  },
  headerCell: {
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minWidth: 700,
  },
});
