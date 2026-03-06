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

  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<SupplierRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('All');
  const [animalFilter, setAnimalFilter] = useState<AnimalFilter>('All');
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/suppliers');
      if (!response.ok) return;

      const data = await response.json();
      const mapped: SupplierRow[] = data.map((item: any) => ({
        _id: item._id,
        supplierId: item.supplierId,
        name: item.name,
        phone: item.phone,
        address: item.address,
        animalType: item.animalType || [],
        isActive: item.isActive,
        createdAt: item.createdAt,
      }));
      setEntries(mapped);
    } catch (error) {
      console.error('Failed to load suppliers for report', error);
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
      const activeOk =
        activeFilter === 'All' ||
        (activeFilter === 'Active' && e.isActive) ||
        (activeFilter === 'Inactive' && !e.isActive);

      const animalOk =
        animalFilter === 'All' || (e.animalType || []).includes(animalFilter);

      return activeOk && animalOk;
    });
  }, [entries, activeFilter, animalFilter]);

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
      'Supplier ID',
      'Name',
      'Phone',
      'Address',
      'Animal Types',
      'Status',
      'Joined On',
    ];

    const rows = filtered.map((e) => [
      e.supplierId,
      e.name,
      e.phone,
      e.address,
      (e.animalType || []).join(' / '),
      e.isActive ? 'Active' : 'Inactive',
      formatDate(e.createdAt),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'suppliers-report.csv');
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
        title="Supplier Report"
        subtitle="Supplier list with filters, export & visuals."
        onBack={() => router.back()}
      />

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <Button title="Export Data" onPress={() => setExportModalVisible(true)} style={styles.actionButton} />
        <Button
          title="See Visuals"
          onPress={() => router.push('/(tabs)/report-suppliers-visuals')}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>

      {/* Filters */}
      <Card variant="elevated" style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Status</ThemedText>
          <View style={styles.filterPillsRow}>
            {(['All', 'Active', 'Inactive'] as ActiveFilter[]).map((value) => {
              const selected = activeFilter === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setActiveFilter(value)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: selected ? theme.primary : 'transparent',
                      borderColor: selected ? theme.primary : theme.border,
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
          <ThemedText style={styles.filterLabel}>Animal Type</ThemedText>
          <View style={styles.filterPillsRow}>
            {(['All', 'Cow', 'Buffalo', 'Goat', 'Other'] as AnimalFilter[]).map((value) => {
              const selected = animalFilter === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setAnimalFilter(value)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: selected ? theme.primary : 'transparent',
                      borderColor: selected ? theme.primary : theme.border,
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
          <EmptyState title="No suppliers found" description="Try changing filters to see results." />
        ) : (
          <ScrollView horizontal bounces={false}>
            <View>
              <View style={[styles.row, styles.headerRow, { backgroundColor: theme.surfaceMuted }]}>
                <ThemedText style={[styles.cell, styles.headerCell]}>ID</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Name</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Phone</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Address</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Animal Type</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Status</ThemedText>
                <ThemedText style={[styles.cell, styles.headerCell]}>Joined On</ThemedText>
              </View>

              {filtered.map((entry) => (
                <View key={entry._id} style={styles.row}>
                  <ThemedText style={styles.cell}>{entry.supplierId}</ThemedText>
                  <ThemedText style={styles.cell}>{entry.name}</ThemedText>
                  <ThemedText style={styles.cell}>{entry.phone}</ThemedText>
                  <ThemedText style={styles.cell}>{entry.address}</ThemedText>
                  <ThemedText style={styles.cell}>{(entry.animalType || []).join(' / ')}</ThemedText>
                  <ThemedText style={styles.cell}>{entry.isActive ? 'Active' : 'Inactive'}</ThemedText>
                  <ThemedText style={styles.cell}>{formatDate(entry.createdAt)}</ThemedText>
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
              Current filtered suppliers list ko CSV file ke roop mein download karna hai?
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

