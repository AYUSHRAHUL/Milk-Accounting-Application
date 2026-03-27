import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { ThemedText } from '../themed-text';
import { Colors, Spacing } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
export interface DailyReportData {
  milkCollection: {
    totalLiters: number;
    numberOfFarmers: number;
  };
  sales: {
    totalMilkSold: number;
    totalRevenue: number;
  };
  production: {
    totalProductsProduced: number;
    wastage: number;
  };
  suppliers: {
    totalActiveSuppliers: number;
    totalAmountPaid: number;
  };
}

interface DailyReportCardProps {
  data: DailyReportData;
  dateStr: string;
}

export function DailyReportCard({ data, dateStr }: DailyReportCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const formatCurrency = (amount: number) => {
    return '₹ ' + (amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const { milkCollection, sales, production, suppliers } = data;

  return (
    <Card variant="elevated" style={styles.cardContainer}>
      <View style={[styles.cardHeader, { borderBottomColor: theme.borderMuted }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text" size={20} color={theme.primary} />
          <ThemedText style={styles.cardTitle}>Daily Combined Report</ThemedText>
        </View>
        <ThemedText style={[styles.headerDate, { color: theme.textSecondary }]}>{dateStr}</ThemedText>
      </View>

      <View style={styles.cardBody}>
        {/* Milk Collection Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Ionicons name="water" size={18} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>Milk Collection</ThemedText>
          </View>
          <View style={styles.sectionRow}>
            <View style={styles.statColumn}>
              <ThemedText style={[styles.statValue, { color: theme.primary }]}>{milkCollection.totalLiters.toFixed(1)} L</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Collected</ThemedText>
            </View>
            <View style={styles.statColumn}>
              <ThemedText style={styles.statValue}>{milkCollection.numberOfFarmers}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Farmers</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.borderMuted }]} />

        {/* Sales Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={18} color={theme.success} />
            <ThemedText style={styles.sectionTitle}>Sales Summary</ThemedText>
          </View>
          <View style={styles.sectionRow}>
            <View style={styles.statColumn}>
              <ThemedText style={styles.statValue}>{sales.totalMilkSold.toFixed(1)} Units</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Sold</ThemedText>
            </View>
            <View style={styles.statColumn}>
              <ThemedText style={[styles.statValue, { color: theme.success }]}>{formatCurrency(sales.totalRevenue)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Revenue</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.borderMuted }]} />

        {/* Production Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flask" size={18} color="#F59E0B" />
            <ThemedText style={styles.sectionTitle}>Production Summary</ThemedText>
          </View>
          <View style={styles.sectionRow}>
            <View style={styles.statColumn}>
              <ThemedText style={styles.statValue}>{production.totalProductsProduced.toFixed(1)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Products Output</ThemedText>
            </View>
            <View style={styles.statColumn}>
              <ThemedText style={styles.statValue}>{production.wastage}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Wastage (Est)</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.borderMuted }]} />

        {/* Supplier Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={18} color={theme.secondary} />
            <ThemedText style={styles.sectionTitle}>Suppliers Tracker</ThemedText>
          </View>
          <View style={styles.sectionRow}>
            <View style={styles.statColumn}>
              <ThemedText style={styles.statValue}>{suppliers.totalActiveSuppliers}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Active Suppliers</ThemedText>
            </View>
            <View style={styles.statColumn}>
              <ThemedText style={[styles.statValue, { color: theme.error }]}>{formatCurrency(suppliers.totalAmountPaid)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total Supplier Cost</ThemedText>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 0,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardBody: {
    padding: Spacing.lg,
  },
  sectionBlock: {
    marginVertical: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statColumn: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.md,
    opacity: 0.5,
  },
});
