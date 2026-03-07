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

// ── Green palette (consistent with all other report pages) ──
const PURPLE       = '#22C55E';
const PURPLE_BG    = 'rgba(34,197,94,0.12)';
const PURPLE_LIGHT = 'rgba(34,197,94,0.05)';

interface SupplierRow {
  _id: string;
  supplierId: string;
  name: string;
  phone: string;
  address: string;
  animalType: string[];
  isActive: boolean;
  createdAt: string;
}

type ActiveFilter = 'All' | 'Active' | 'Inactive';
type AnimalFilter = 'All' | 'Cow' | 'Buffalo' | 'Goat' | 'Other';

export default function ReportSuppliersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading]           = useState(true);
  const [entries, setEntries]               = useState<SupplierRow[]>([]);
  const [activeFilter, setActiveFilter]     = useState<ActiveFilter>('All');
  const [animalFilter, setAnimalFilter]     = useState<AnimalFilter>('All');
  const [exportModalVisible, setExportModal] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/suppliers');
      if (!res.ok) return;
      const data = await res.json();
      setEntries(
        data.map((item: any) => ({
          _id: item._id,
          supplierId: item.supplierId,
          name: item.name,
          phone: item.phone,
          address: item.address,
          animalType: item.animalType || [],
          isActive: item.isActive,
          createdAt: item.createdAt,
        })),
      );
    } catch (e) {
      console.error('Failed to load suppliers for report', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchEntries(); }, [fetchEntries]));

  const filtered = useMemo(() =>
    entries.filter((e) => {
      const activeOk =
        activeFilter === 'All' ||
        (activeFilter === 'Active' && e.isActive) ||
        (activeFilter === 'Inactive' && !e.isActive);
      const animalOk =
        animalFilter === 'All' || (e.animalType || []).includes(animalFilter);
      return activeOk && animalOk;
    }),
  [entries, activeFilter, animalFilter]);

  // ── Summary stats ────────────────────────────────────────
  const totalSuppliers = filtered.length;
  const activeCount    = filtered.filter((e) => e.isActive).length;
  const inactiveCount  = filtered.filter((e) => !e.isActive).length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

  const handleExport = () => {
    if (!filtered.length) { Alert.alert('No data to export'); return; }
    const header = ['Supplier ID', 'Name', 'Phone', 'Address', 'Animal Types', 'Status', 'Joined On'];
    const rows   = filtered.map((e) => [
      e.supplierId, e.name, e.phone, e.address,
      (e.animalType || []).join(' / '),
      e.isActive ? 'Active' : 'Inactive',
      formatDate(e.createdAt),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.setAttribute('download', 'suppliers-report.csv');
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
      <View style={[styles.header, { backgroundColor: PURPLE }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Supplier Report</ThemedText>
          <ThemedText style={styles.headerSub}>Directory &amp; Status Overview</ThemedText>
        </View>
        <Ionicons name="people-outline" size={28} color="rgba(255,255,255,0.35)" />
      </View>

      <View style={styles.body}>

        {/* ── Summary Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: PURPLE_BG }]}>
            <Ionicons name="people" size={18} color={PURPLE} style={{ marginBottom: 4 }} />
            <ThemedText style={[styles.statValue, { color: PURPLE }]}>{totalSuppliers}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.successMuted }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={theme.success} style={{ marginBottom: 4 }} />
            <ThemedText style={[styles.statValue, { color: theme.success }]}>{activeCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Active</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.errorMuted }]}>
            <Ionicons name="close-circle-outline" size={18} color={theme.error} style={{ marginBottom: 4 }} />
            <ThemedText style={[styles.statValue, { color: theme.error }]}>{inactiveCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Inactive</ThemedText>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => setExportModal(true)}
            style={[styles.actionBtn, { borderColor: PURPLE, borderWidth: 1.5, backgroundColor: 'transparent' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={17} color={PURPLE} />
            <ThemedText style={[styles.actionBtnText, { color: PURPLE }]}>Export CSV</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/report-suppliers-visuals')}
            style={[styles.actionBtn, { backgroundColor: PURPLE }]}
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

          {/* Status */}
          <View style={styles.filterGroup}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>Status</ThemedText>
            <View style={styles.pillsRow}>
              {(['All', 'Active', 'Inactive'] as ActiveFilter[]).map((val) => {
                const active = activeFilter === val;
                const pillColor =
                  val === 'Active'   ? theme.success :
                  val === 'Inactive' ? theme.error   : PURPLE;
                const pillBg =
                  val === 'Active'   ? theme.successMuted :
                  val === 'Inactive' ? theme.errorMuted   : PURPLE_BG;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setActiveFilter(val)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active ? pillBg : theme.surfaceMuted,
                        borderColor: active ? pillColor : theme.borderMuted,
                      },
                    ]}
                  >
                    <ThemedText style={[styles.pillText, { color: active ? pillColor : theme.text }]}>
                      {val === 'Active' ? '✅ ' : val === 'Inactive' ? '⛔ ' : ''}{val}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Animal Type */}
          <View style={[styles.filterGroup, { marginBottom: 0 }]}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>Animal Type</ThemedText>
            <View style={styles.pillsRow}>
              {(['All', 'Cow', 'Buffalo', 'Goat', 'Other'] as AnimalFilter[]).map((val) => {
                const active = animalFilter === val;
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setAnimalFilter(val)}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: active ? PURPLE_BG : theme.surfaceMuted,
                        borderColor: active ? PURPLE : theme.borderMuted,
                      },
                    ]}
                  >
                    <ThemedText style={[styles.pillText, { color: active ? PURPLE : theme.text }]}>
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
          <View style={[styles.tableHeader, { backgroundColor: PURPLE }]}>
            <ThemedText style={styles.tableHeaderTitle}>Supplier Directory</ThemedText>
            <ThemedText style={styles.tableHeaderCount}>{totalSuppliers} rows</ThemedText>
          </View>

          {isLoading ? (
            <LoadingIndicator style={{ padding: Spacing.xl }} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No suppliers found" description="Try changing filters to see results." />
          ) : (
            <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
              <View>
                {/* Column headers */}
                <View style={[styles.tableRow, { backgroundColor: theme.surfaceMuted }]}>
                  {['ID', 'Name', 'Phone', 'Address', 'Animals', 'Status', 'Joined'].map((h) => (
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
                    : PURPLE_LIGHT;

                  const statusBg   = entry.isActive ? theme.successMuted : theme.errorMuted;
                  const statusText = entry.isActive ? theme.success : theme.error;

                  return (
                    <View
                      key={entry._id}
                      style={[styles.tableRow, { backgroundColor: rowBg, borderBottomColor: theme.borderMuted }]}
                    >
                      <ThemedText style={[styles.cell, { color: PURPLE, fontWeight: '700' }]}>
                        {entry.supplierId}
                      </ThemedText>
                      <ThemedText style={[styles.cell, { fontWeight: '600' }]} numberOfLines={1}>
                        {entry.name}
                      </ThemedText>
                      <ThemedText style={styles.cell}>{entry.phone}</ThemedText>
                      <ThemedText style={styles.cell} numberOfLines={1}>{entry.address}</ThemedText>
                      <ThemedText style={styles.cell}>
                        {(entry.animalType || []).join(' / ') || '—'}
                      </ThemedText>
                      {/* Status badge */}
                      <View style={styles.cell}>
                        <View style={[styles.badge, { backgroundColor: statusBg }]}>
                          <ThemedText style={[styles.badgeText, { color: statusText }]}>
                            {entry.isActive ? 'Active' : 'Inactive'}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={styles.cell}>{formatDate(entry.createdAt)}</ThemedText>
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
            <View style={[styles.modalIconBox, { backgroundColor: PURPLE_BG }]}>
              <Ionicons name="document-text-outline" size={30} color={PURPLE} />
            </View>
            <ThemedText style={styles.modalTitle}>Export as CSV</ThemedText>
            <ThemedText style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Download {totalSuppliers} filtered supplier records as a CSV file.
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
                style={[styles.modalBtn, { backgroundColor: PURPLE }]}
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
  statValue: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
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
