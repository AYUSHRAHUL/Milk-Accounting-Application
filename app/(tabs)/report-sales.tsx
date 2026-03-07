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

interface SaleEntryRow {
  _id: string;
  date: string;
  customerName?: string;
  productType: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  paymentMode: string;
}

type ProductFilter = 'All' | 'Paneer' | 'Ghee' | 'Butter' | 'Curd' | 'Other';
type PaymentFilter = 'All' | 'Cash' | 'UPI' | 'Credit';

// Payment mode → color mapping
const PAYMENT_COLORS: Record<string, { bg: string; text: string }> = {
  Cash:   { bg: 'rgba(34,197,94,0.12)',   text: '#16A34A' },
  UPI:    { bg: 'rgba(99,102,241,0.12)',  text: '#6366F1' },
  Credit: { bg: 'rgba(245,158,11,0.12)',  text: '#D97706' },
};

export default function ReportSalesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<SaleEntryRow[]>([]);
  const [productFilter, setProductFilter] = useState<ProductFilter>('All');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('All');
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sales');
      if (!response.ok) return;
      const data = await response.json();
      const mapped: SaleEntryRow[] = data.map((item: any) => ({
        _id: item._id,
        date: item.date,
        customerName: item.customerName,
        productType: item.productType,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        totalAmount: item.totalAmount,
        paymentMode: item.paymentMode,
      }));
      setEntries(mapped);
    } catch (error) {
      console.error('Failed to load sales entries', error);
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
      const paymentOk = paymentFilter === 'All' || e.paymentMode === paymentFilter;
      return productOk && paymentOk;
    });
  }, [entries, productFilter, paymentFilter]);

  // ── Summary stats ──────────────────────────────────────────
  const totalRevenue  = filtered.reduce((s, e) => s + e.totalAmount, 0);
  const totalQty      = filtered.reduce((s, e) => s + e.quantity, 0);
  const totalEntries  = filtered.length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const formatCurrency = (amount: number) =>
    '₹ ' + (amount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const handleExport = () => {
    if (!filtered.length) {
      Alert.alert('No data to export');
      return;
    }
    const header = ['Date', 'Customer', 'Product', 'Qty', 'Price / Unit', 'Total Amount', 'Payment'];
    const rows = filtered.map((e) => [
      formatDate(e.date),
      e.customerName || '-',
      e.productType,
      e.quantity.toString(),
      e.pricePerUnit.toString(),
      e.totalAmount.toString(),
      e.paymentMode,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales-report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Export', 'Export is currently supported on web only.');
    }
    setExportModalVisible(false);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.success }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Sales Report</ThemedText>
          <ThemedText style={styles.headerSub}>Revenue &amp; Transactions</ThemedText>
        </View>
        <Ionicons name="cash-outline" size={28} color="rgba(255,255,255,0.35)" />
      </View>

      <View style={styles.body}>

        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.successMuted }]}>
            <Ionicons name="cash" size={18} color={theme.success} style={{ marginBottom: 4 }} />
            <ThemedText style={[styles.statValue, { color: theme.success }]}>
              {formatCurrency(totalRevenue)}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Revenue</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.warningMuted }]}>
            <Ionicons name="cube-outline" size={18} color={theme.warning} style={{ marginBottom: 4 }} />
            <ThemedText style={[styles.statValue, { color: theme.warning }]}>
              {totalQty.toFixed(1)}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Units Sold</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="receipt-outline" size={18} color={theme.primary} style={{ marginBottom: 4 }} />
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>{totalEntries}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Transactions</ThemedText>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => setExportModalVisible(true)}
            style={[styles.actionBtn, { borderColor: theme.success, borderWidth: 1.5, backgroundColor: 'transparent' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={17} color={theme.success} />
            <ThemedText style={[styles.actionBtnText, { color: theme.success }]}>Export CSV</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/report-sales-visuals')}
            style={[styles.actionBtn, { backgroundColor: theme.success }]}
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

          {/* Product */}
          <View style={styles.filterGroup}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>Product</ThemedText>
            <View style={styles.pillsRow}>
              {(['All', 'Paneer', 'Ghee', 'Butter', 'Curd', 'Other'] as ProductFilter[]).map((val) => {
                const active = productFilter === val;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setProductFilter(val)}
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
          </View>

          {/* Payment Mode */}
          <View style={[styles.filterGroup, { marginBottom: 0 }]}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>Payment Mode</ThemedText>
            <View style={styles.pillsRow}>
              {(['All', 'Cash', 'UPI', 'Credit'] as PaymentFilter[]).map((val) => {
                const active = paymentFilter === val;
                const color = val !== 'All' ? PAYMENT_COLORS[val]?.text : theme.success;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setPaymentFilter(val)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active
                          ? (val !== 'All' ? PAYMENT_COLORS[val]?.bg : theme.successMuted)
                          : theme.surfaceMuted,
                        borderColor: active
                          ? (val !== 'All' ? color : theme.success)
                          : theme.borderMuted,
                      },
                    ]}
                  >
                    <ThemedText style={[styles.pillText, { color: active ? (val !== 'All' ? color : theme.success) : theme.text }]}>
                      {val === 'Cash' ? '💵 ' : val === 'UPI' ? '📱 ' : val === 'Credit' ? '💳 ' : ''}{val}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* ── Data Table ── */}
        <Card variant="elevated" style={styles.tableCard}>
          <View style={[styles.tableHeader, { backgroundColor: theme.success }]}>
            <ThemedText style={styles.tableHeaderTitle}>Sale Records</ThemedText>
            <ThemedText style={styles.tableHeaderCount}>{totalEntries} rows</ThemedText>
          </View>

          {isLoading ? (
            <LoadingIndicator style={{ padding: Spacing.xl }} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No sales found" description="Try changing filters to see results." />
          ) : (
            <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
              <View>
                {/* Column headers */}
                <View style={[styles.tableRow, { backgroundColor: theme.surfaceMuted }]}>
                  {['Date', 'Customer', 'Product', 'Qty', '₹/Unit', 'Total', 'Payment'].map((h) => (
                    <ThemedText key={h} style={[styles.cell, styles.colHeader, { color: theme.text }]}>
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
                  const pm = PAYMENT_COLORS[entry.paymentMode] ?? { bg: theme.surfaceMuted, text: theme.textSecondary };
                  return (
                    <View
                      key={entry._id}
                      style={[styles.tableRow, { backgroundColor: rowBg, borderBottomColor: theme.borderMuted }]}
                    >
                      <ThemedText style={styles.cell}>{formatDate(entry.date)}</ThemedText>
                      <ThemedText style={styles.cell} numberOfLines={1}>{entry.customerName || '—'}</ThemedText>
                      <ThemedText style={[styles.cell, { color: theme.primary, fontWeight: '700' }]}>
                        {entry.productType}
                      </ThemedText>
                      <ThemedText style={styles.cell}>{entry.quantity.toFixed(2)}</ThemedText>
                      <ThemedText style={styles.cell}>{formatCurrency(entry.pricePerUnit)}</ThemedText>
                      <ThemedText style={[styles.cell, { color: theme.success, fontWeight: '700' }]}>
                        {formatCurrency(entry.totalAmount)}
                      </ThemedText>
                      {/* Payment badge */}
                      <View style={styles.cell}>
                        <View style={[styles.badge, { backgroundColor: pm.bg }]}>
                          <ThemedText style={[styles.badgeText, { color: pm.text }]}>
                            {entry.paymentMode}
                          </ThemedText>
                        </View>
                      </View>
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
            <View style={[styles.modalIconBox, { backgroundColor: theme.successMuted }]}>
              <Ionicons name="document-text-outline" size={30} color={theme.success} />
            </View>
            <ThemedText style={styles.modalTitle}>Export as CSV</ThemedText>
            <ThemedText style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Download {totalEntries} filtered sales records as a CSV file.
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
                style={[styles.modalBtn, { backgroundColor: theme.success }]}
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
  body: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  // Action Buttons
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
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
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  // Filters
  filtersCard: { padding: Spacing.lg },
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
  filterGroup: { marginBottom: Spacing.md },
  filterLabel: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
  // Table
  tableCard: { padding: 0, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  tableHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  tableHeaderCount: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: { minWidth: 90, fontSize: 12, marginRight: Spacing.sm },
  colHeader: {
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    minWidth: 90,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
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
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: Spacing.sm, textAlign: 'center' },
  modalDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: Spacing.xl },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
});
