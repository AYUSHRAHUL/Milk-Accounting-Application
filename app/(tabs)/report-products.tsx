import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
type SourceFilter  = 'All' | 'Cow' | 'Buffalo' | 'Goat' | 'Other';

// Product type → badge colour
const PRODUCT_COLORS: Record<string, { bg: string; text: string }> = {
  Paneer: { bg: 'rgba(245,158,11,0.13)',  text: '#D97706' },
  Ghee:   { bg: 'rgba(234,179,8,0.13)',   text: '#A16207' },
  Butter: { bg: 'rgba(249,115,22,0.13)',  text: '#C2410C' },
  Curd:   { bg: 'rgba(34,197,94,0.13)',   text: '#15803D' },
  Other:  { bg: 'rgba(107,114,128,0.13)', text: '#374151' },
};

export default function ReportProductsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading]             = useState(true);
  const [entries, setEntries]                 = useState<ProductionRow[]>([]);
  const [productFilter, setProductFilter]     = useState<ProductFilter>('All');
  const [sourceFilter, setSourceFilter]       = useState<SourceFilter>('All');
  const [exportModalVisible, setExportModal]  = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/products/production');
      if (!res.ok) return;
      const data = await res.json();
      setEntries(
        data.map((item: any) => ({
          _id: item._id,
          date: item.date,
          productType: item.productType,
          source: item.source,
          fatType: item.fatType,
          milkUsedLiters: item.milkUsedLiters,
          quantityProduced: item.quantityProduced,
        })),
      );
    } catch (e) {
      console.error('Failed to load production entries', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchEntries(); }, [fetchEntries]));

  const filtered = useMemo(() =>
    entries.filter((e) => {
      const pOk = productFilter === 'All' || e.productType === productFilter;
      const sOk = sourceFilter  === 'All' || e.source       === sourceFilter;
      return pOk && sOk;
    }),
  [entries, productFilter, sourceFilter]);

  // ── Summary stats ──────────────────────────────────────────
  const totalBatches   = filtered.length;
  const totalMilkUsed  = filtered.reduce((s, e) => s + e.milkUsedLiters,   0);
  const totalProduced  = filtered.reduce((s, e) => s + e.quantityProduced,  0);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

  const handleExport = () => {
    if (!filtered.length) { Alert.alert('No data to export'); return; }
    const header = ['Date','Product','Source','Fat Type','Milk Used (L)','Qty Produced'];
    const rows   = filtered.map((e) => [
      formatDate(e.date), e.productType, e.source, e.fatType,
      e.milkUsedLiters.toString(), e.quantityProduced.toString(),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.setAttribute('download', 'products-report.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Export', 'Export is currently supported on web only.');
    }
    setExportModal(false);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Products Report</ThemedText>
          <ThemedText style={styles.headerSub}>Production Batches &amp; Yield</ThemedText>
        </View>
        <Ionicons name="cube-outline" size={28} color="rgba(255,255,255,0.35)" />
      </View>

      <View style={styles.body}>

        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="layers-outline" size={18} color={theme.primary} style={{ marginBottom: 4 }} />
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>{totalBatches}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Batches</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="water-outline" size={18} color={theme.primary} style={{ marginBottom: 4 }} />
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {totalMilkUsed.toFixed(1)} L
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Milk Used</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.successMuted }]}>
            <Ionicons name="cube-outline" size={18} color={theme.success} style={{ marginBottom: 4 }} />
            <ThemedText style={[styles.statValue, { color: theme.success }]}>
              {totalProduced.toFixed(1)}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Units Out</ThemedText>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => setExportModal(true)}
            style={[styles.actionBtn, { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: 'transparent' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={17} color={theme.primary} />
            <ThemedText style={[styles.actionBtnText, { color: theme.primary }]}>Export CSV</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/report-products-visuals')}
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

          {/* Product type */}
          <View style={styles.filterGroup}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>Product</ThemedText>
            <View style={styles.pillsRow}>
              {(['All','Paneer','Ghee','Butter','Curd','Other'] as ProductFilter[]).map((val) => {
                const active = productFilter === val;
                const col    = val !== 'All' ? PRODUCT_COLORS[val]?.text : theme.primary;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setProductFilter(val)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active
                          ? (val !== 'All' ? PRODUCT_COLORS[val]?.bg : theme.primaryMuted)
                          : theme.surfaceMuted,
                        borderColor: active ? col : theme.borderMuted,
                      },
                    ]}
                  >
                    <ThemedText style={[styles.pillText, { color: active ? col : theme.text }]}>
                      {val}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Milk source */}
          <View style={[styles.filterGroup, { marginBottom: 0 }]}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>Milk Source</ThemedText>
            <View style={styles.pillsRow}>
              {(['All','Cow','Buffalo','Goat','Other'] as SourceFilter[]).map((val) => {
                const active = sourceFilter === val;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setSourceFilter(val)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active ? theme.primaryMuted : theme.surfaceMuted,
                        borderColor: active ? theme.primary : theme.borderMuted,
                      },
                    ]}
                  >
                    <ThemedText style={[styles.pillText, { color: active ? theme.primary : theme.text }]}>
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
            <ThemedText style={styles.tableHeaderTitle}>Production Records</ThemedText>
            <ThemedText style={styles.tableHeaderCount}>{totalBatches} rows</ThemedText>
          </View>

          {isLoading ? (
            <LoadingIndicator style={{ padding: Spacing.xl }} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No production entries found" description="Try changing filters to see results." />
          ) : (
            <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
              <View>
                {/* Column headers */}
                <View style={[styles.tableRow, { backgroundColor: theme.surfaceMuted }]}>
                  {['Date','Product','Source','Fat Type','Milk (L)','Produced'].map((h) => (
                    <ThemedText key={h} style={[styles.cell, styles.colHeader, { color: theme.text }]}>
                      {h}
                    </ThemedText>
                  ))}
                </View>

                {/* Data rows */}
                {filtered.map((entry, idx) => {
                  const isEven = idx % 2 === 0;
                  const rowBg  = isEven
                    ? theme.background
                    : colorScheme === 'dark'
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(245,158,11,0.04)';
                  const badge  = PRODUCT_COLORS[entry.productType] ?? { bg: theme.surfaceMuted, text: theme.textSecondary };
                  return (
                    <View
                      key={entry._id}
                      style={[styles.tableRow, { backgroundColor: rowBg, borderBottomColor: theme.borderMuted }]}
                    >
                      <ThemedText style={styles.cell}>{formatDate(entry.date)}</ThemedText>
                      {/* Product badge */}
                      <View style={styles.cell}>
                        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                          <ThemedText style={[styles.badgeText, { color: badge.text }]}>
                            {entry.productType}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={styles.cell}>{entry.source}</ThemedText>
                      <ThemedText style={styles.cell}>{entry.fatType}</ThemedText>
                      <ThemedText style={[styles.cell, { color: theme.primary, fontWeight: '700' }]}>
                        {entry.milkUsedLiters.toFixed(2)}
                      </ThemedText>
                      <ThemedText style={[styles.cell, { color: theme.primary, fontWeight: '700' }]}>
                        {entry.quantityProduced.toFixed(2)}
                      </ThemedText>
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
        onRequestClose={() => setExportModal(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalIconBox, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="document-text-outline" size={30} color={theme.primary} />
            </View>
            <ThemedText style={styles.modalTitle}>Export as CSV</ThemedText>
            <ThemedText style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Download {totalBatches} filtered production records as a CSV file.
            </ThemedText>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setExportModal(false)}
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
  container: { flexGrow: 1 },
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  body: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, borderRadius: 14, padding: Spacing.md, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  // Action Buttons
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
    paddingVertical: 12, paddingHorizontal: Spacing.md, borderRadius: 12,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  // Filters
  filtersCard: { padding: Spacing.lg },
  filtersTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.md },
  filtersTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  filterGroup: { marginBottom: Spacing.md },
  filterLabel: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: '600' },
  // Table
  tableCard: { padding: 0, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  tableHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  tableHeaderCount: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: { minWidth: 90, fontSize: 12, marginRight: Spacing.sm },
  colHeader: { fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, minWidth: 90 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  // Modal
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { width: '100%', maxWidth: 380, borderRadius: 24, padding: Spacing.xl, alignItems: 'center' },
  modalIconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle:   { fontSize: 20, fontWeight: '800', marginBottom: Spacing.sm, textAlign: 'center' },
  modalDesc:    { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: Spacing.xl },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  modalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12 },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
});
