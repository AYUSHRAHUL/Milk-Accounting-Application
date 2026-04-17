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
    // Sort all entries by date first for correct balance propagation
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    
    // Propagate balances for "Date" mode
    // We deep clone to avoid mutating the original entries prop
    const linkedEntries: ExcelReportEntry[] = JSON.parse(JSON.stringify(sorted));
    
    for (let i = 1; i < linkedEntries.length; i++) {
        const prev = linkedEntries[i-1];
        const curr = linkedEntries[i];

        // 1. Milk Account
        curr.milk.ob = prev.milk.cb;
        curr.milk.totalAvailable = curr.milk.ob + curr.milk.totalIn;
        curr.milk.cb = curr.milk.totalAvailable - (curr.milk.cardSales + curr.milk.cashSales);



        // 5. Products
        Object.keys(curr.products).forEach(pk => {
            if (prev.products[pk]) {
                curr.products[pk].ob = prev.products[pk].cb;
                curr.products[pk].total = curr.products[pk].ob + curr.products[pk].prod;
                curr.products[pk].cb = curr.products[pk].total - curr.products[pk].sale;
            }
        });
    }

    if (filterMode === 'Date') return linkedEntries;

    // Month Aggregation Logic
    const monthly: Record<string, any> = {};
    linkedEntries.forEach(e => {
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



        // Products
        Object.keys(e.products).forEach(p => {
          if (!monthly[month].products[p]) monthly[month].products[p] = { ob: 0, prod: 0, total: 0, sale: 0, cb: 0 };
          monthly[month].products[p].prod += e.products[p].prod;
          monthly[month].products[p].total += e.products[p].total;
          monthly[month].products[p].sale += e.products[p].sale;
        });

        // Closing Balance update (take latest)
        monthly[month].milk.cb = e.milk.cb;

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

        'MILK_TOTAL_IN',
        'MILK_TOTAL_AVAIL',
        'MILK_CARD_SALE',
        'MILK_CASH_SALE',
        'MILK_CB',

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

        esc(e.milk.totalIn),
        esc(e.milk.totalAvailable),
        esc(e.milk.cardSales),
        esc(e.milk.cashSales),
        esc(e.milk.cb),

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
    'Skim Milk', 'Cream', 'Mixed Milk', 'Cow Milk', 'Buffalo Milk', 'Goat Milk', 'Paneer', 'Ghee', 'Butter', 'Curd', 'Khoa', 'Fl. milk', 'Std. Milk', 'Toned Milk', 'D.Toned Milk', 'Icecream', 'Yoghurt', 'Srikhand', 'Rasgolla', 'Gulabjamun', 'Rabbari'
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
            <View style={[styles.accountHeader, { width: (allSupplierKeys.length + 8) * 60, backgroundColor: '#EFF6FF' }]}>
              <ThemedText style={[styles.headerText, { color: '#1D4ED8' }]}>MILK ACCOUNT</ThemedText>
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

            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>TOTAL</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>CARD</ThemedText></View>
            <View style={styles.subCol}><ThemedText style={styles.subHeaderText}>CASH</ThemedText></View>
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

                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.totalIn.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.cardSales.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={styles.cellText}>{e.milk.cashSales.toFixed(3)}</ThemedText></View>
                <View style={styles.subCol}><ThemedText style={[styles.cellText, { fontWeight: 'bold' }]}>{e.milk.cb.toFixed(3)}</ThemedText></View>
 


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
