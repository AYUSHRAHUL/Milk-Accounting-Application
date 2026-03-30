import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors } from '@/constants/theme';
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

interface SeparationEntry {
  _id: string;
  date: string;
  separationMilk: number;
  skimMilk: number;
  creamMilk: number;
  loss: number;
}

interface ProductEntry {
  _id: string;
  date: string;
  productName: string;
  quantityProduced: number;
  unit: string;
  milkUsed: {
    wholeMilk: number;
    skimMilk: number;
    creamMilk: number;
  };
}

type TabType = 'Products' | 'Separation';
type PeriodFilter = 'All' | 'Today' | '7D' | '30D';

export default function ReportProductionScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Products');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('All');
  const [separationEntries, setSeparationEntries] = useState<SeparationEntry[]>([]);
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sepRes, prodRes] = await Promise.all([
        apiFetch(`/api/production/separation-history?userId=${user?.id}`),
        apiFetch(`/api/production/product-history?userId=${user?.id}`)
      ]);

      if (sepRes.ok) setSeparationEntries(await sepRes.json());
      if (prodRes.ok) setProductEntries(await prodRes.json());
    } catch (error) {
      console.error('Failed to load production data', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const filteredSeparation = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = today - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;

    return separationEntries.filter((e) => {
      const entryDate = new Date(e.date).getTime();
      if (periodFilter === 'Today') return entryDate >= today;
      if (periodFilter === '7D') return entryDate >= sevenDaysAgo;
      if (periodFilter === '30D') return entryDate >= thirtyDaysAgo;
      return true;
    });
  }, [separationEntries, periodFilter]);

  const filteredProducts = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = today - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = today - 30 * 24 * 60 * 60 * 1000;

    return productEntries.filter((e) => {
      const entryDate = new Date(e.date).getTime();
      if (periodFilter === 'Today') return entryDate >= today;
      if (periodFilter === '7D') return entryDate >= sevenDaysAgo;
      if (periodFilter === '30D') return entryDate >= thirtyDaysAgo;
      return true;
    });
  }, [productEntries, periodFilter]);

  // --- Stats ---
  const totalProduced = filteredProducts.reduce((s, e) => s + e.quantityProduced, 0);
  const totalMilkUsed = filteredProducts.reduce((s, e) => s + e.milkUsed.wholeMilk + e.milkUsed.skimMilk + e.milkUsed.creamMilk, 0);
  const totalSeparated = filteredSeparation.reduce((s, e) => s + e.separationMilk, 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const handleExport = async () => {
    const data = activeTab === 'Products' ? filteredProducts : filteredSeparation;
    if (!data.length) {
      Alert.alert('No data to export');
      return;
    }

    let csv = '';
    if (activeTab === 'Products') {
      const header = ['Date', 'Product', 'Quantity', 'Whole Milk used', 'Skim used', 'Cream used'];
      const rows = filteredProducts.map(e =>
        [formatDate(e.date), e.productName, `${e.quantityProduced} ${e.unit}`,
        e.milkUsed.wholeMilk.toString(), e.milkUsed.skimMilk.toString(), e.milkUsed.creamMilk.toString()]
      );
      csv = [header, ...rows].map(r => r.join(',')).join('\n');
    } else {
      const header = ['Date', 'Separated (L)', 'Skim Produced (L)', 'Cream Produced (L)', 'Loss'];
      const rows = filteredSeparation.map(e =>
        [formatDate(e.date), e.separationMilk.toString(), e.skimMilk.toString(), e.creamMilk.toString(), e.loss.toString()]
      );
      csv = [header, ...rows].map(r => r.join(',')).join('\n');
    }

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab.toLowerCase()}-report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      try {
        await downloadCSVLocally(csv, activeTab.toLowerCase() + '_report', `Export ${activeTab} Report`);
      } catch (error: any) {
        console.error('Export Error:', error);
        Alert.alert('Export Failed', 'Details: ' + (error?.message || 'An error occurred during export.'));
      }
    }
    setExportModalVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#F59E0B' }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/reports')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Production Report</ThemedText>
          <ThemedText style={styles.headerSub}>Milk Usage & Yield Analysis</ThemedText>
        </View>
        <TouchableOpacity disabled style={[styles.backBtn, { backgroundColor: 'transparent' }]}>
          <Ionicons name="flask-outline" size={24} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['Products', 'Separation'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: '#F59E0B', borderBottomWidth: 3 }
              ]}
            >
              <ThemedText style={[styles.tabText, activeTab === tab && { color: '#F59E0B', fontWeight: '800' }]}>
                {tab}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => setExportModalVisible(true)}
            style={[styles.actionBtn, { borderColor: '#F59E0B', borderWidth: 1.5 }]}
          >
            <Ionicons name="download-outline" size={17} color="#F59E0B" />
            <ThemedText style={[styles.actionBtnText, { color: '#F59E0B' }]}>Export CSV</ThemedText>
          </TouchableOpacity>

          <View style={[styles.periodFilter, { backgroundColor: theme.surfaceMuted }]}>
            {(['All', 'Today', '7D', '30D'] as PeriodFilter[]).map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriodFilter(p)}
                style={[styles.periodPill, periodFilter === p && { backgroundColor: '#F59E0B' }]}
              >
                <ThemedText style={[styles.periodText, periodFilter === p && { color: '#fff' }]}>{p}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
            <ThemedText style={[styles.statValue, { color: '#F59E0B' }]}>
              {activeTab === 'Products' ? totalProduced.toFixed(1) : totalSeparated.toFixed(1)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>
              {activeTab === 'Products' ? 'Products (kg/L)' : 'Separated (L)'}
            </ThemedText>
          </View>
          {activeTab === 'Products' && (
            <View style={[styles.statCard, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
              <ThemedText style={[styles.statValue, { color: '#3B82F6' }]}>{totalMilkUsed.toFixed(1)} L</ThemedText>
              <ThemedText style={styles.statLabel}>Milk Usage</ThemedText>
            </View>
          )}
        </View>

        {/* DataTable */}
        <Card variant="elevated" style={styles.tableCard}>
          <View style={[styles.tableHeader, { backgroundColor: '#F59E0B' }]}>
            <ThemedText style={styles.tableHeaderTitle}>
              {activeTab === 'Products' ? 'Production History' : 'Separation Log'}
            </ThemedText>
            <ThemedText style={styles.tableHeaderCount}>
              {activeTab === 'Products' ? filteredProducts.length : filteredSeparation.length} items
            </ThemedText>
          </View>

          {isLoading ? (
            <LoadingIndicator style={{ padding: 40 }} />
          ) : (activeTab === 'Products' ? filteredProducts.length : filteredSeparation.length) === 0 ? (
            <EmptyState title="No records found" description="No entries match selected filter." />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={[styles.tableRow, { backgroundColor: theme.surfaceMuted }]}>
                  {activeTab === 'Products'
                    ? ['Date', 'Product', 'Yield', 'Whole Used', 'Skim Used', 'Cream Used'].map(h => <ThemedText key={h} style={styles.cellHeader}>{h}</ThemedText>)
                    : ['Date', 'Separated', 'Skim Out', 'Cream Out', 'Loss'].map(h => <ThemedText key={h} style={styles.cellHeader}>{h}</ThemedText>)
                  }
                </View>

                {activeTab === 'Products' ? filteredProducts.map((e, idx) => (
                  <View key={e._id} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? theme.background : 'rgba(0,0,0,0.02)' }]}>
                    <ThemedText style={styles.cell}>{formatDate(e.date)}</ThemedText>
                    <ThemedText style={[styles.cell, { fontWeight: '700' }]}>{e.productName}</ThemedText>
                    <ThemedText style={[styles.cell, { color: '#F59E0B', fontWeight: '800' }]}>{e.quantityProduced} {e.unit}</ThemedText>
                    <ThemedText style={styles.cell}>{e.milkUsed.wholeMilk} L</ThemedText>
                    <ThemedText style={styles.cell}>{e.milkUsed.skimMilk} L</ThemedText>
                    <ThemedText style={styles.cell}>{e.milkUsed.creamMilk} L</ThemedText>
                  </View>
                )) : filteredSeparation.map((e, idx) => (
                  <View key={e._id} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? theme.background : 'rgba(0,0,0,0.02)' }]}>
                    <ThemedText style={styles.cell}>{formatDate(e.date)}</ThemedText>
                    <ThemedText style={[styles.cell, { fontWeight: '800' }]}>{e.separationMilk} L</ThemedText>
                    <ThemedText style={styles.cell}>{e.skimMilk} L</ThemedText>
                    <ThemedText style={styles.cell}>{e.creamMilk} L</ThemedText>
                    <ThemedText style={[styles.cell, { color: theme.error }]}>{e.loss} L</ThemedText>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </Card>
      </View>

      <Modal visible={exportModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Ionicons name="document-text" size={48} color="#F59E0B" style={{ marginBottom: 12 }} />
            <ThemedText style={styles.modalTitle}>Download Report</ThemedText>
            <ThemedText style={styles.modalDesc}>Download {activeTab} history as CSV file for offline use.</ThemedText>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setExportModalVisible(false)} style={styles.modalBtnSec}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExport} style={[styles.modalBtn, { backgroundColor: '#F59E0B' }]}>
                <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Download</ThemedText>
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
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  body: { padding: 20, gap: 20 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  periodFilter: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  periodPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  periodText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  tableCard: { padding: 0, overflow: 'hidden', borderRadius: 20 },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  tableHeaderTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  tableHeaderCount: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  cellHeader: { minWidth: 100, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: '#6B7280' },
  cell: { minWidth: 100, fontSize: 13, color: '#374151' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 28, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalBtnSec: { flex: 1, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
});
