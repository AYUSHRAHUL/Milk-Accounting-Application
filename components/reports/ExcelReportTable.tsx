import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { downloadCSVLocally } from '@/lib/exportHelper';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export interface ExcelReportEntry {
  date: string;
  milk: {
    ob: number;
    collections: Record<string, number>;
    sourceTotals: Record<string, number>;
    totalIn: number;
    totalAvailable: number;
    cardSales: number;
    cashSales: number;
    prod: Record<string, number>;
    cb: number;
  };
  sm: {
    ob: number;
    prod: number;
    total: number;
    sale: number;
    cb: number;
  };
  cream: {
    ob: number;
    prod: number;
    total: number;
    sale: number;
    cb: number;
  };
  mixed: {
    ob: number;
    prod: number;
    total: number;
    sale: number;
    cb: number;
  };
  products: Record<string, {
    ob: number;
    prod: number;
    total: number;
    sale: number;
    cb: number;
  }>;
}

interface Props {
  entries: ExcelReportEntry[];
}

export const ExcelReportTable: React.FC<Props> = ({ entries }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [filterMode, setFilterMode] = useState<'Date' | 'Month'>('Date');

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    if (parts.length === 2) return `${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  const processedEntries = useMemo(() => {
    if (filterMode === 'Date') return entries;

    // Month Aggregation Logic
    const monthly: Record<string, any> = {};
    entries.forEach(e => {
      const month = e.date.substring(0, 7); // YYYY-MM
      if (!monthly[month]) {
        monthly[month] = JSON.parse(JSON.stringify(e));
        monthly[month].date = month;
      } else {
        // Aggregate milk
        Object.keys(e.milk.collections).forEach(k => monthly[month].milk.collections[k] = (monthly[month].milk.collections[k] || 0) + e.milk.collections[k]);
        if (e.milk.sourceTotals) {
          if (!monthly[month].milk.sourceTotals) monthly[month].milk.sourceTotals = {};
          Object.keys(e.milk.sourceTotals).forEach(k => monthly[month].milk.sourceTotals[k] = (monthly[month].milk.sourceTotals[k] || 0) + e.milk.sourceTotals[k]);
        }
        monthly[month].milk.totalIn += e.milk.totalIn;
        monthly[month].milk.totalAvailable += e.milk.totalAvailable;
        monthly[month].milk.cardSales += e.milk.cardSales;
        monthly[month].milk.cashSales += e.milk.cashSales;
        Object.keys(e.milk.prod).forEach(k => monthly[month].milk.prod[k] = (monthly[month].milk.prod[k] || 0) + e.milk.prod[k]);

        // Aggregate sm/cream/mixed
        monthly[month].sm.prod += e.sm.prod;
        monthly[month].sm.total += e.sm.total;
        monthly[month].sm.sale += e.sm.sale;
        monthly[month].cream.prod += e.cream.prod;
        monthly[month].cream.total += e.cream.total;
        monthly[month].cream.sale += e.cream.sale;
        monthly[month].mixed.prod += e.mixed.prod;
        monthly[month].mixed.total += e.mixed.total;
        monthly[month].mixed.sale += e.mixed.sale;

        // Products
        Object.keys(e.products).forEach(p => {
          if (!monthly[month].products[p]) monthly[month].products[p] = { ob: 0, prod: 0, total: 0, sale: 0, cb: 0 };
          monthly[month].products[p].prod += e.products[p].prod;
          monthly[month].products[p].total += e.products[p].total;
          monthly[month].products[p].sale += e.products[p].sale;
        });

        // Closing Balance update (take latest)
        monthly[month].milk.cb = e.milk.cb;
        monthly[month].sm.cb = e.sm.cb;
        monthly[month].cream.cb = e.cream.cb;
        monthly[month].mixed.cb = e.mixed.cb;
        Object.keys(e.products).forEach(p => monthly[month].products[p].cb = e.products[p].cb);
      }
    });
    return Object.values(monthly);
  }, [entries, filterMode]);

  const exportCSV = async () => {
    try {
      // Collect all dynamic keys
      const allProdKeys = Array.from(new Set(entries.flatMap(e => Object.keys(e.products))));
      const allSupplierKeys = Array.from(new Set(entries.flatMap(e => Object.keys(e.milk.collections))));

      const csvHeaders = [
        'Date',
        'MILK_OB',
        ...allSupplierKeys.map(k => `MILK_COLL_${k.toUpperCase()}`),
        'MILK_COW',
        'MILK_BUFF',
        'MILK_GOAT',
        'MILK_OTHER',
        'MILK_TOTAL_IN',
        'MILK_TOTAL_AVAIL',
        'MILK_CARD_SALE',
        'MILK_CASH_SALE',
        'MILK_CB',
        'SM_PROD', 'SM_OB', 'SM_TOTAL', 'SM_SELL', 'SM_CB',
        'CREAM_PROD', 'CREAM_OB', 'CREAM_TOTAL', 'CREAM_SELL', 'CREAM_CB',
        'MIXED_PROD', 'MIXED_OB', 'MIXED_TOTAL', 'MIXED_SELL', 'MIXED_CB',
        ...allProdKeys.flatMap(k => [`${k.toUpperCase()}_PROD`, `${k.toUpperCase()}_OB`, `${k.toUpperCase()}_TOTAL`, `${k.toUpperCase()}_SELL`, `${k.toUpperCase()}_CB`])
      ];

      // Helper to escape CSV fields
      const esc = (v: any) => {
        const str = (v === null || v === undefined) ? '' : String(v);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = entries.map(e => [
        esc(formatDateDisplay(e.date)),
        esc(e.milk.ob),
        ...allSupplierKeys.map(k => esc(e.milk.collections[k] || 0)),
        esc(e.milk.sourceTotals?.['Cow'] || 0),
        esc(e.milk.sourceTotals?.['Buffalo'] || 0),
        esc(e.milk.sourceTotals?.['Goat'] || 0),
        esc(e.milk.sourceTotals?.['Other'] || 0),
        esc(e.milk.totalIn),
        esc(e.milk.totalAvailable),
        esc(e.milk.cardSales),
        esc(e.milk.cashSales),
        esc(e.milk.cb),
        esc(e.sm.prod), esc(e.sm.ob), esc(e.sm.total), esc(e.sm.sale), esc(e.sm.cb),
        esc(e.cream.prod), esc(e.cream.ob), esc(e.cream.total), esc(e.cream.sale), esc(e.cream.cb),
        esc(e.mixed.prod), esc(e.mixed.ob), esc(e.mixed.total), esc(e.mixed.sale), esc(e.mixed.cb),
        ...allProdKeys.flatMap(k => [
          esc(e.products[k]?.prod || 0),
          esc(e.products[k]?.ob || 0),
          esc(e.products[k]?.total || 0),
          esc(e.products[k]?.sale || 0),
          esc(e.products[k]?.cb || 0)
        ])
      ]);

      const csvContent = [csvHeaders.join(','), ...rows.map(r => r.join(','))].join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Detailed_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      } else {
        await downloadCSVLocally(csvContent, 'detailed_report', 'Export Detailed Report');
      }
    } catch (error: any) {
      console.error('Export Error:', error);
      Alert.alert('Export Failed', 'Details: ' + (error?.message || 'An error occurred. Make sure storage permissions are granted.'));
    }
  };

  const STANDARD_PRODUCTS = [
    'Paneer', 'Ghee', 'Butter', 'Curd', 'Khoa', 'Fl. milk', 'ST Milk', 'TD MILK', 'DTD Milk', 'Icecream', 'Yoghurt', 'Srikhand', 'Rasgolla', 'Gulabjamun', 'Rabbari', 'Other'
  ];

  const allProdKeys = useMemo(() => {
    const existingKeys = Array.from(new Set(entries.flatMap(e => Object.keys(e.products))));
    // Filter out keys that are already in STANDARD_PRODUCTS to avoid duplicates
    const all = [...STANDARD_PRODUCTS];
    existingKeys.forEach(k => {
      if (!all.find(p => p.toLowerCase() === k.toLowerCase())) {
        all.push(k);
      }
    });

    return all;
  }, [entries]);
  const allSupplierKeys = useMemo(() => Array.from(new Set(entries.flatMap(e => Object.keys(e.milk.collections)))), [entries]);
  const allProdUseKeys = useMemo(() => Array.from(new Set(entries.flatMap(e => Object.keys(e.milk.prod)))), [entries]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.title}>Excel Detailed View</ThemedText>
        <View style={styles.controls}>
          <View style={[styles.toggleGroup, { backgroundColor: theme.borderMuted }]}>
            {['Date', 'Month'].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setFilterMode(m as any)}
                style={[styles.toggleBtn, filterMode === m && { backgroundColor: theme.primary }]}
              >
                <ThemedText style={[styles.toggleText, filterMode === m && { color: '#fff' }]}>{m}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={exportCSV} style={[styles.exportBtn, { backgroundColor: theme.successMuted }]}>
            <Ionicons name="download-outline" size={18} color={theme.success} />
            <ThemedText style={[styles.exportText, { color: theme.success }]}>Export as CSV</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal persistentScrollbar>
        <View>
          {/* Row 1: Main Section Headers */}
          <View style={styles.tableHeaderRow}>
            <View style={[styles.headerCell, { width: 100 }]}><ThemedText style={styles.headerText}>DATE (2026)</ThemedText></View>
            <View style={[styles.accountHeader, { width: (allSupplierKeys.length + 9) * 60, backgroundColor: '#EFF6FF' }]}>
              <ThemedText style={[styles.headerText, { color: '#1D4ED8' }]}>MILK ACCOUNT</ThemedText>
            </View>
            <View style={[styles.accountHeader, { width: 300, backgroundColor: theme.successMuted }]}>
              <ThemedText style={[styles.headerText, { color: theme.success }]}>SKIM MILK</ThemedText>
            </View>
            <View style={[styles.accountHeader, { width: 300, backgroundColor: 'rgba(253,224,71,0.2)' }]}>
              <ThemedText style={[styles.headerText, { color: '#A16207' }]}>CREAM</ThemedText>
            </View>
            <View style={[styles.accountHeader, { width: 300, backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <ThemedText style={[styles.headerText, { color: '#10B981' }]}>MIXED MILK</ThemedText>
            </View>
            {allProdKeys.map(pk => (
              <View key={pk} style={[styles.accountHeader, { width: 300, backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                <ThemedText style={[styles.headerText, { color: '#F59E0B' }]}>{pk.toUpperCase()}</ThemedText>
              </View>
            ))}
          </View>

          {/* Row 2: Sub-column Headers */}
          <View style={styles.tableHeaderRow}>
            <View style={[styles.headerCell, { width: 100 }]}></View>

            {/* Milk Cols */}
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>O.B.</ThemedText></View>
            {allSupplierKeys.map(k => <View key={k} style={styles.subCol}><ThemedText style={styles.subHeaderText}>{k.toUpperCase().substring(0, 6)}</ThemedText></View>)}
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>COW</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>BUFF</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>GOAT</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>OTHER</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>TOTAL</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>CARD</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>CASH</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>C.B.</ThemedText></View>

            {/* SM Cols */}
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>PROD</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>O.B.</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>TOTAL</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>SELL</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>C.B.</ThemedText></View>

            {/* Cream Cols */}
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>PROD</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>O.B.</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>TOTAL</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>SELL</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>C.B.</ThemedText></View>

            {/* Mixed Cols */}
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>PROD</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>O.B.</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>TOTAL</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>SELL</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>C.B.</ThemedText></View>

            {/* Product Cols */}
            {allProdKeys.map(pk => (
              <React.Fragment key={pk}>
                <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>PROD</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>O.B.</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>TOTAL</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>SELL</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>C.B.</ThemedText></View>
              </React.Fragment>
            ))}
          </View>

          {/* Data Rows Area */}
          <ScrollView style={{ height: 400 }}>
            {processedEntries.map((e, idx) => (
              <View key={e.date} style={[styles.dataRow, { backgroundColor: idx % 2 === 0 ? theme.background : theme.borderMuted + '20' }]}>
                <View style={[styles.cell, { width: 100 }]}><ThemedText style={styles.cellText}>{formatDateDisplay(e.date)}</ThemedText></View>

                {/* Milk Data */}
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.ob.toFixed(3)}</ThemedText></View>
                {allSupplierKeys.map(k => <View key={k} style={styles.subCol}><ThemedText style={styles.cellText}>{(e.milk.collections[k] || 0).toFixed(3)}</ThemedText></View>)}
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.milk.sourceTotals?.['Cow'] || 0).toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.milk.sourceTotals?.['Buffalo'] || 0).toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.milk.sourceTotals?.['Goat'] || 0).toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.milk.sourceTotals?.['Other'] || 0).toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.totalIn.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.cardSales.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.cashSales.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{e.milk.cb.toFixed(3)}</ThemedText></View>
 
                {/* SM Data */}
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.sm.prod.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.sm.ob.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.sm.total.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.sm.sale.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{e.sm.cb.toFixed(3)}</ThemedText></View>

                {/* Cream Data */}
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.cream.prod.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.cream.ob.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.cream.total.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.cream.sale.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{e.cream.cb.toFixed(3)}</ThemedText></View>

                {/* Mixed Data */}
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.mixed.prod.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.mixed.ob.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.mixed.total.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.mixed.sale.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{e.mixed.cb.toFixed(3)}</ThemedText></View>

                {/* Product Data */}
                {allProdKeys.map(pk => (
                  <React.Fragment key={pk}>
                    <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.products[pk]?.prod || 0).toFixed(3)}</ThemedText></View>
                    <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.products[pk]?.ob || 0).toFixed(3)}</ThemedText></View>
                    <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.products[pk]?.total || 0).toFixed(3)}</ThemedText></View>
                    <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.products[pk]?.sale || 0).toFixed(3)}</ThemedText></View>
                    <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{(e.products[pk]?.cb || 0).toFixed(3)}</ThemedText></View>
                  </React.Fragment>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  exportText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
  },
  accountHeader: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCol: {
    width: 60,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 10,
    textAlign: 'center',
  },
});
