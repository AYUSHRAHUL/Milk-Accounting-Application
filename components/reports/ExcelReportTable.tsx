import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface ExcelReportEntry {
  date: string;
  milk: {
    ob: number;
    collections: Record<string, number>;
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
        monthly[month].milk.totalIn += e.milk.totalIn;
        monthly[month].milk.totalAvailable += e.milk.totalAvailable;
        monthly[month].milk.cardSales += e.milk.cardSales;
        monthly[month].milk.cashSales += e.milk.cashSales;
        Object.keys(e.milk.prod).forEach(k => monthly[month].milk.prod[k] = (monthly[month].milk.prod[k] || 0) + e.milk.prod[k]);

        // Aggregate sm/cream
        monthly[month].sm.prod += e.sm.prod;
        monthly[month].sm.total += e.sm.total;
        monthly[month].sm.sale += e.sm.sale;
        monthly[month].cream.prod += e.cream.prod;
        monthly[month].cream.total += e.cream.total;
        monthly[month].cream.sale += e.cream.sale;

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
        Object.keys(e.products).forEach(p => monthly[month].products[p].cb = e.products[p].cb);
      }
    });
    return Object.values(monthly);
  }, [entries, filterMode]);

  const exportCSV = async () => {
    // Collect all dynamic keys
    // These are already defined in useMemo below, but need to be available here.
    // For simplicity, re-calculating them or moving them outside useMemo would be options.
    // For this change, we'll assume they are available or define them locally if needed.
    // Based on the provided context, they are defined below the exportCSV function.
    // Let's define them here for the exportCSV function to work correctly.
    const allProdKeys = Array.from(new Set(entries.flatMap(e => Object.keys(e.products))));
    const allSupplierKeys = Array.from(new Set(entries.flatMap(e => Object.keys(e.milk.collections))));
    const allProdUseKeys = Array.from(new Set(entries.flatMap(e => Object.keys(e.milk.prod))));

    const csvHeaders = [
      'Date', 
      'MILK_OB', 
      ...allSupplierKeys.map(k => `MILK_COLL_${k.toUpperCase()}`),
      'MILK_TOTAL_IN',
      'MILK_TOTAL_AVAIL',
      'MILK_CARD_SALE',
      'MILK_CASH_SALE',
      'MILK_CB',
      'SM_PROD', 'SM_OB', 'SM_TOTAL', 'SM_SELL', 'SM_CB',
      'CREAM_PROD', 'CREAM_OB', 'CREAM_TOTAL', 'CREAM_SELL', 'CREAM_CB',
      ...allProdKeys.flatMap(k => [`${k.toUpperCase()}_PROD`, `${k.toUpperCase()}_OB`, `${k.toUpperCase()}_TOTAL`, `${k.toUpperCase()}_SELL`, `${k.toUpperCase()}_CB`])
    ];

    const rows = entries.map(e => [
      e.date,
      e.milk.ob, 
      ...allSupplierKeys.map(k => e.milk.collections[k] || 0),
      e.milk.totalIn,
      e.milk.totalAvailable,
      e.milk.cardSales,
      e.milk.cashSales,
      e.milk.cb,
      e.sm.prod, e.sm.ob, e.sm.total, e.sm.sale, e.sm.cb,
      e.cream.prod, e.cream.ob, e.cream.total, e.cream.sale, e.cream.cb,
      ...allProdKeys.flatMap(k => [
        e.products[k]?.prod || 0,
        e.products[k]?.ob || 0,
        e.products[k]?.total || 0,
        e.products[k]?.sale || 0,
        e.products[k]?.cb || 0
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
      const filename = `${(FileSystem as any).documentDirectory}detailed_report.csv`;
      await (FileSystem as any).writeAsStringAsync(filename, csvContent, { encoding: (FileSystem as any).EncodingType.UTF8 });
      await Sharing.shareAsync(filename);
    }
  };

  const allProdKeys = useMemo(() => Array.from(new Set(entries.flatMap(e => Object.keys(e.products)))), [entries]);
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
            <ThemedText style={[styles.exportText, { color: theme.success }]}>Export</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal persistentScrollbar>
        <View>
          {/* Row 1: Main Section Headers */}
          <View style={styles.tableHeaderRow}>
            <View style={[styles.headerCell, { width: 100 }]}><ThemedText style={styles.headerText}>DATE (2026)</ThemedText></View>
            <View style={[styles.accountHeader, { width: (allSupplierKeys.length + 5) * 60, backgroundColor: '#EFF6FF' }]}>
              <ThemedText style={[styles.headerText, { color: '#1D4ED8' }]}>MILK ACCOUNT</ThemedText>
            </View>
            <View style={[styles.accountHeader, { width: 300, backgroundColor: theme.successMuted }]}>
              <ThemedText style={[styles.headerText, { color: theme.success }]}>SKIM MILK</ThemedText>
            </View>
            <View style={[styles.accountHeader, { width: 300, backgroundColor: 'rgba(253,224,71,0.2)' }]}>
              <ThemedText style={[styles.headerText, { color: '#A16207' }]}>CREAM</ThemedText>
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
            {allSupplierKeys.map(k => <View key={k} style={styles.subCol}><ThemedText style={styles.subHeaderText}>{k.toUpperCase().substring(0,6)}</ThemedText></View>)}
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
                <View style={[styles.cell, { width: 100 }]}><ThemedText style={styles.cellText}>{e.date}</ThemedText></View>
                
                {/* Milk Data */}
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.ob.toFixed(1)}</ThemedText></View>
                {allSupplierKeys.map(k => <View key={k} style={styles.subCol}><ThemedText style={styles.cellText}>{(e.milk.collections[k] || 0).toFixed(1)}</ThemedText></View>)}
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.totalIn.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.cardSales.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.cashSales.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{e.milk.cb.toFixed(1)}</ThemedText></View>

                {/* SM Data */}
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.sm.prod.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.sm.ob.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.sm.total.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.sm.sale.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{e.sm.cb.toFixed(1)}</ThemedText></View>

                {/* Cream Data */}
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.cream.prod.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.cream.ob.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.cream.total.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.cream.sale.toFixed(1)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{e.cream.cb.toFixed(1)}</ThemedText></View>

                {/* Product Data */}
                {allProdKeys.map(pk => (
                  <React.Fragment key={pk}>
                    <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.products[pk]?.prod || 0).toFixed(1)}</ThemedText></View>
                    <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.products[pk]?.ob || 0).toFixed(1)}</ThemedText></View>
                    <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.products[pk]?.total || 0).toFixed(1)}</ThemedText></View>
                    <View style={styles.subCol}><ThemedText style={styles.cellText}>{(e.products[pk]?.sale || 0).toFixed(1)}</ThemedText></View>
                    <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{(e.products[pk]?.cb || 0).toFixed(1)}</ThemedText></View>
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
