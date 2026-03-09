import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
// Note: In a real Expo project, you'd use expo-file-system for local storage before sharing
// But for this implementation, we'll focus on the UI and logic.
import * as FileSystem from 'expo-file-system';

interface ReportEntry {
    _id: string;
    date: string | Date;
    type: string;
    category: string;
    details: string;
    quantity: number;
    amount: number;
    currency: string;
    unit: string;
}

export default function DetailedReportScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [entries, setEntries] = useState<ReportEntry[]>([]);

    const fetchDetailedReports = async () => {
        try {
            const response = await apiFetch('/api/reports/detailed');
            if (response.ok) {
                const data = await response.json();
                setEntries(data);
            } else {
                Alert.alert('Error', 'Failed to fetch detailed reports');
            }
        } catch (error) {
            console.error('Fetch Detailed Error:', error);
            Alert.alert('Error', 'An error occurred while fetching reports');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDetailedReports();
    }, []);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchDetailedReports();
    };

    const formatDate = (dateValue: string | Date) => {
        const d = new Date(dateValue);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return amount > 0 ? '₹' + amount.toLocaleString('en-IN') : '-';
    };

    const downloadCSV = async () => {
        if (entries.length === 0) {
            Alert.alert('No Data', 'There is no data to export.');
            return;
        }

        const headers = ['Date', 'Type', 'Category', 'Details', 'Qty', 'Amount'];
        const rows = entries.map((e) => [
            formatDate(e.date),
            e.type,
            e.category,
            e.details.replace(/,/g, ';'), // Prevent CSV breaking
            `${e.quantity} ${e.unit}`,
            e.amount > 0 ? e.amount.toString() : '0',
        ]);

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        if (Platform.OS === 'web') {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `MilkApp_Detailed_Report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const fileName = `Detailed_Report_${Date.now()}.csv`;
            const fileUri = (FileSystem as any).documentDirectory + fileName;

            try {
                await (FileSystem as any).writeAsStringAsync(fileUri, csvContent, {
                    encoding: (FileSystem as any).EncodingType.UTF8,
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    Alert.alert('Sharing not available', 'The file was saved but sharing is not supported on this device.');
                }
            } catch (error) {
                console.error('CSV Export Error:', error);
                Alert.alert('Export Failed', 'An error occurred while exporting the report.');
            }
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.borderMuted }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Detailed Report</ThemedText>
                </View>

                <TouchableOpacity onPress={downloadCSV} style={styles.downloadBtn} activeOpacity={0.7}>
                    <Ionicons name="download-outline" size={20} color="#FFF" />
                    <ThemedText style={styles.downloadText}>Download</ThemedText>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <ThemedText style={{ marginTop: 10 }}>Loading report data...</ThemedText>
                </View>
            ) : (
                <ScrollView
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                    horizontal={true}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View>
                        {/* Table Header */}
                        <View style={[styles.tableHeader, { backgroundColor: theme.card, borderBottomColor: theme.borderMuted }]}>
                            <ThemedText style={[styles.cell, styles.headerCell, { width: 100 }]}>Date</ThemedText>
                            <ThemedText style={[styles.cell, styles.headerCell, { width: 120 }]}>Type</ThemedText>
                            <ThemedText style={[styles.cell, styles.headerCell, { width: 100 }]}>Category</ThemedText>
                            <ThemedText style={[styles.cell, styles.headerCell, { width: 180 }]}>Details</ThemedText>
                            <ThemedText style={[styles.cell, styles.headerCell, { width: 80, textAlign: 'right' }]}>Qty</ThemedText>
                            <ThemedText style={[styles.cell, styles.headerCell, { width: 100, textAlign: 'right' }]}>Amount</ThemedText>
                        </View>

                        {/* Table Content */}
                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            {entries.length > 0 ? (
                                entries.map((item, index) => (
                                    <View
                                        key={item._id}
                                        style={[
                                            styles.tableRow,
                                            {
                                                backgroundColor: index % 2 === 0 ? 'transparent' : theme.primaryMuted + '10',
                                                borderBottomColor: theme.borderMuted,
                                            },
                                        ]}
                                    >
                                        <ThemedText style={[styles.cell, { width: 100, fontSize: 13 }]}>{formatDate(item.date)}</ThemedText>
                                        <View style={[styles.cell, { width: 120 }]}>
                                            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type, theme) }]}>
                                                <ThemedText style={styles.typeText}>{item.type}</ThemedText>
                                            </View>
                                        </View>
                                        <ThemedText style={[styles.cell, { width: 100, fontSize: 13 }]}>{item.category}</ThemedText>
                                        <ThemedText style={[styles.cell, { width: 180, fontSize: 12, opacity: 0.8 }]} numberOfLines={1}>
                                            {item.details}
                                        </ThemedText>
                                        <ThemedText style={[styles.cell, { width: 80, textAlign: 'right', fontWeight: 'bold' }]}>
                                            {item.quantity} {item.unit}
                                        </ThemedText>
                                        <ThemedText
                                            style={[
                                                styles.cell,
                                                { width: 100, textAlign: 'right', fontWeight: 'bold', color: getAmountColor(item.type, theme) },
                                            ]}
                                        >
                                            {formatCurrency(item.amount)}
                                        </ThemedText>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="document-text-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                                    <ThemedText style={{ color: theme.textSecondary, marginTop: 10 }}>No entries found for the selected period.</ThemedText>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const getTypeColor = (type: string, theme: any) => {
    switch (type) {
        case 'Milk Collection':
            return theme.primary;
        case 'Sale':
            return theme.success;
        case 'Production':
            return theme.warning;
        default:
            return theme.textSecondary;
    }
};

const getAmountColor = (type: string, theme: any) => {
    switch (type) {
        case 'Milk Collection':
            return theme.error;
        case 'Sale':
            return theme.success;
        default:
            return theme.text;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    downloadText: {
        color: '#FFF',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 13,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 2,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: Spacing.md,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    cell: {
        paddingHorizontal: 4,
    },
    headerCell: {
        fontWeight: '800',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
        width: 680, // Approximate width of table to center message
    },
});
