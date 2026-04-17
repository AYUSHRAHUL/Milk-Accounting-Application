import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { downloadCSVLocally } from '@/lib/exportHelper';
import { Ionicons } from '@expo/vector-icons';
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

interface MilkEntryRow {
  _id: string;
  date: string;
  supplier: string;
  supplierId: string;
  shift: string;
  source: string;
  fatType: string;
  quantity: number;
  costPerLiter: number;
  totalCost: number;
  snf?: number;
  clr?: number;
  lr?: number;
  temp?: number;
  ts?: number;
  mbrt?: string;
  mbrtTime?: string;
  cob?: string;
  protein?: number;
  lactose?: number;
  ash?: number;
  addedWater?: number;
  tsMachine?: number;
  tsDiff?: number;
}

type ShiftFilter = 'All' | 'Morning' | 'Evening';
type SourceFilter = 'All' | 'Cow' | 'Buffalo' | 'Goat' | 'Other';
type PeriodFilter = 'All' | 'Today' | '7D' | '30D';

export default function ReportMilkScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<MilkEntryRow[]>([]);
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('All');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('All');
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/api/milk/collection?userId=${user?.id}`);
      if (!response.ok) return;
      const data = await response.json();
      const mapped: MilkEntryRow[] = data.map((item: any) => ({
        _id: item._id,
        date: item.date,
        supplier: item.supplier,
        supplierId: item.supplierId || 'N/A',
        shift: item.shift,
        source: item.source,
        fatType: item.fatType,
        quantity: item.quantity,
        costPerLiter: item.costPerLiter,
        totalCost: item.totalCost,
        snf: item.snf,
        clr: item.clr,
        lr: item.lr,
        temp: item.temp,
        ts: item.ts,
        mbrt: item.mbrt,
        mbrtTime: item.mbrtTime,
        cob: item.cob,
        protein: item.protein,
        lactose: item.lactose,
        ash: item.ash,
        addedWater: item.addedWater,
        tsMachine: item.tsMachine,
        tsDiff: item.tsDiff,
      }));
      setEntries(mapped);
    } catch (error) {
      console.error('Failed to load milk entries', error);
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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = today - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;

    return entries.filter((e) => {
      const shiftOk = shiftFilter === 'All' || e.shift === shiftFilter;
      const sourceOk = sourceFilter === 'All' || e.source === sourceFilter;

      const entryDate = new Date(e.date).getTime();
      let periodOk = true;
      if (periodFilter === 'Today') periodOk = entryDate >= today;
      else if (periodFilter === '7D') periodOk = entryDate >= sevenDaysAgo;
      else if (periodFilter === '30D') periodOk = entryDate >= thirtyDaysAgo;

      return shiftOk && sourceOk && periodOk;
    });
  }, [entries, shiftFilter, sourceFilter, periodFilter]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatCurrency = (amount: number) =>
    '₹ ' + (amount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const handleExport = async () => {
    if (!filtered.length) {
      Alert.alert('No data to export');
      return;
    }
    const header = ['Date', 'Time', 'Supplier Name', 'Supplier ID', 'Shift', 'Source', 'Fat %', 'Quantity (L)', 'Cost / Litre', 'Total Cost', 'LR', 'Temperature', 'CLR', 'SNF', 'TS', 'MBRT Status', 'MBRT Time', 'COB'];

    // Helper to escape CSV fields
    const esc = (v: any) => {
      const str = (v === null || v === undefined) ? '' : String(v);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filtered.map((e) => [
      esc(formatDate(e.date)),
      esc(formatTime(e.date)),
      esc(e.supplier),
      esc(e.supplierId),
      esc(e.shift),
      esc(e.source),
      esc(e.fatType),
      esc(e.quantity),
      esc(e.costPerLiter),
      esc(e.totalCost),
      esc(e.lr || 0),
      esc(e.temp || 0),
      esc(e.clr || 0),
      esc(e.snf || 0),
      esc(e.ts || 0),
      esc(e.mbrt || ''),
      esc(e.mbrtTime || ''),
      esc(e.cob || ''),
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.body.appendChild(document.createElement('a'));
        link.href = url;
        link.setAttribute('download', 'milk-collection-report.csv');
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        await downloadCSVLocally(csv, 'milk_report', 'Export Milk Collection Report');
      }
    } catch (error: any) {
      console.error('Export Error:', error);
      Alert.alert('Export Failed', 'Details: ' + (error?.message || 'An error occurred during export.'));
    }
    setExportModalVisible(false);
  };

  // ── Shift icon helper ────────────────────────────────────
  const shiftIcon = (shift: string) =>
    shift === 'Morning' ? '🌅' : shift === 'Evening' ? '🌙' : '⏰';

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/reports')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Milk Collection</ThemedText>
          <ThemedText style={styles.headerSub}>Report &amp; Analysis</ThemedText>
        </View>
        <TouchableOpacity disabled style={[styles.backBtn, { backgroundColor: 'transparent' }]}>
          <Ionicons name="water-outline" size={24} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => setExportModalVisible(true)}
            style={[styles.actionBtn, { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: 'transparent' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={17} color={theme.primary} />
            <ThemedText style={[styles.actionBtnText, { color: theme.primary }]}>Export CSV</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/report-milk-visuals')}
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="bar-chart-outline" size={17} color="#fff" />
            <ThemedText style={[styles.actionBtnText, { color: '#fff' }]}>See Visuals</ThemedText>
          </TouchableOpacity>
        </View>

        {/* ── Filters ── */}
        <Card variant="elevated" style={styles.filtersCard}>
          <View style={styles.filtersTitleRow}>
            <Ionicons name="filter" size={15} color={theme.textSecondary} />
            <ThemedText style={[styles.filtersTitle, { color: theme.textSecondary }]}>Filters</ThemedText>
          </View>

          {/* Period */}
          <View style={styles.filterGroup}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>Period</ThemedText>
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
          </View>

          {/* Shift */}
          <View style={styles.filterGroup}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>Shift</ThemedText>
            <View style={styles.pillsRow}>
              {(['All', 'Morning', 'Evening'] as ShiftFilter[]).map((val) => {
                const active = shiftFilter === val;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setShiftFilter(val)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active ? theme.primary : theme.surfaceMuted,
                        borderColor: active ? theme.primary : theme.borderMuted,
                      },
                    ]}
                  >
                    <ThemedText style={[styles.pillText, { color: active ? '#fff' : theme.text }]}>
                      {val === 'Morning' ? '🌅 ' : val === 'Evening' ? '🌙 ' : ''}{val}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Source */}
          <View style={[styles.filterGroup, { marginBottom: 0 }]}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>Source</ThemedText>
            <View style={styles.pillsRow}>
              {(['All', 'Cow', 'Buffalo', 'Goat', 'Other'] as SourceFilter[]).map((val) => {
                const active = sourceFilter === val;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setSourceFilter(val)}
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
          </View>
        </Card>

        {/* ── Data Table ── */}
        <Card variant="elevated" style={styles.tableCard}>
          <View style={[styles.tableHeader, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.tableHeaderTitle}>Collection Records</ThemedText>
            <ThemedText style={styles.tableHeaderCount}>{filtered.length} rows</ThemedText>
          </View>

          {isLoading ? (
            <LoadingIndicator style={{ padding: Spacing.xl }} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No records found" description="Try changing filters to see results." />
          ) : (
            <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
              <View>
                {/* Column headers */}
                <View style={[styles.tableRow, { backgroundColor: theme.surfaceMuted }]}>
                  {['Date', 'Time', 'Supplier', 'ID', 'Shift', 'Source', 'Fat %', 'Qty', 'LR', 'T', 'CLR', 'SNF', 'TS', 'Prot', 'Lact', 'Ash', 'Water', 'TS(M)', 'Diff', 'MBRT', 'Time', 'COB'].map((h) => (
                    <ThemedText key={h} style={[styles.cell, styles.colHeader, { color: theme.text, minWidth: (h === 'Supplier' ? 120 : (h === 'Date' || h === 'Time' ? 80 : 60)) }]}>
                      {h}
                    </ThemedText>
                  ))}
                </View>

                {/* Data rows */}
                {filtered.map((entry, idx) => {
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven
                    ? theme.background
                    : colorScheme === 'dark'
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(34,197,94,0.04)';
                  return (
                    <View
                      key={entry._id}
                      style={[styles.tableRow, { backgroundColor: rowBg, borderBottomColor: theme.borderMuted }]}
                    >
                      <ThemedText style={[styles.cell, { minWidth: 80 }]}>{formatDate(entry.date)}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 80 }]}>{formatTime(entry.date)}</ThemedText>
                      <ThemedText style={[styles.cell, { fontWeight: '600', minWidth: 120 }]} numberOfLines={1}>{entry.supplier}</ThemedText>
                      <ThemedText style={[styles.cell, { color: theme.textSecondary, fontSize: 11, minWidth: 60 }]}>{entry.supplierId}</ThemedText>
                      <View style={[styles.cell, { minWidth: 60 }]}>
                        <View style={[
                          styles.shiftBadge,
                          { backgroundColor: entry.shift === 'Morning' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)' }
                        ]}>
                          <ThemedText style={[
                            styles.shiftBadgeText,
                            { color: entry.shift === 'Morning' ? '#D97706' : '#6366F1' }
                          ]}>
                            {shiftIcon(entry.shift)} {entry.shift}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.source}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.fatType}</ThemedText>
                      <ThemedText style={[styles.cell, { color: theme.primary, fontWeight: '700', minWidth: 60 }]}>
                        {entry.quantity.toFixed(1)}
                      </ThemedText>
                      
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.lr || '0'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.temp ? `${entry.temp}°` : '0'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.clr || '0'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.snf || '0'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.ts || '0'}</ThemedText>
                      
                      {/* Machine Analysis Columns */}
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.protein || '0'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.lactose || '0'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.ash || '0'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.addedWater || '0'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60, color: '#2563EB', fontWeight: '700' }]}>{entry.tsMachine || '0'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60, color: '#DC2626', fontWeight: '700' }]}>{entry.tsDiff || '0'}</ThemedText>
                      
                      {/* Microbiology Columns */}
                      <ThemedText style={[styles.cell, { minWidth: 80 }]}>{entry.mbrt || 'N/A'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.mbrtTime || 'N/A'}</ThemedText>
                      <ThemedText style={[styles.cell, { minWidth: 60 }]}>{entry.cob || 'N/A'}</ThemedText>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </Card>

      </View>

      {/* ── Export Modal ── */}
      <Modal
        visible={exportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            {/* Modal header */}
            <View style={[styles.modalIconBox, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="document-text-outline" size={30} color={theme.primary} />
            </View>
            <ThemedText style={styles.modalTitle}>Export as CSV</ThemedText>
            <ThemedText style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Download {filtered.length} filtered milk collection records as a CSV file.
            </ThemedText>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setExportModalVisible(false)}
                style={[styles.modalBtn, { borderWidth: 1.5, borderColor: theme.borderMuted, backgroundColor: 'transparent' }]}
              >
                <ThemedText style={[styles.modalBtnText, { color: theme.text }]}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExport}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="download-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <ThemedText style={[styles.modalBtnText, { color: '#fff' }]}>Download</ThemedText>
              </TouchableOpacity>
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
  },
  // Header
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
  body: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  // Action buttons
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Filters
  filtersCard: {
    padding: Spacing.lg,
  },
  filtersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.md,
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterGroup: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Table
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  tableHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  tableHeaderCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    minWidth: 90,
    fontSize: 12,
    marginRight: Spacing.sm,
  },
  colHeader: {
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    minWidth: 90,
  },
  shiftBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  shiftBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
