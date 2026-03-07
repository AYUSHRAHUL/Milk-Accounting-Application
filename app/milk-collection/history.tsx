import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { 
    Alert, 
    FlatList, 
    Platform,
    RefreshControl, 
    ScrollView, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MilkEntryData {
    _id: string;
    date: string;
    shift: string;
    supplier: string;
    source: string;
    fatType: string;
    snf?: number;
    clr?: number;
    quantity: number;
    costPerLiter: number;
    totalCost: number;
}

export default function MilkCollectionHistoryScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [entries, setEntries] = useState<MilkEntryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChip, setActiveChip] = useState('This Month');

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/milk/collection');
            if (response.ok) {
                const data = await response.json();
                setEntries(data);
            }
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchHistory();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).replace(/\//g, '-');
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Entry",
            "Are you sure you want to delete this milk collection record?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`/api/milk/collection/${id}`, { method: 'DELETE' });
                            if (response.ok) {
                                fetchHistory(); // Refresh
                            } else {
                                Alert.alert("Error", "Failed to delete record.");
                            }
                        } catch {
                            Alert.alert("Error", "An unexpected error occurred.");
                        }
                    }
                }
            ]
        );
    };

    const handlePrint = (item: MilkEntryData) => {
        Alert.alert("Print Receipt", `Printing receipt for ${item.supplier}...`);
    };

    // Derived State
    const filteredEntries = useMemo(() => {
        let filtered = entries;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e => 
                (e.supplier?.toLowerCase() || '').includes(query)
            );
        }
        if (activeChip === 'Morning') {
            filtered = filtered.filter(e => e.shift === 'Morning');
        } else if (activeChip === 'Evening') {
            filtered = filtered.filter(e => e.shift === 'Evening');
        }
        // In a real app we would use full Date range filtering here based on From/To.
        return filtered;
    }, [entries, searchQuery, activeChip]);

    const summary = useMemo(() => {
        let totalQty = 0;
        let totalAmount = 0;
        let sumFat = 0;
        let sumSnf = 0;
        let sumClr = 0;
        let count = filteredEntries.length;

        filteredEntries.forEach(e => {
            totalQty += e.quantity;
            totalAmount += e.totalCost;
            sumFat += parseFloat(e.fatType) || 0;
            sumSnf += e.snf || 0;
            sumClr += e.clr || 0;
        });

        return {
            totalQty,
            totalAmount,
            avgFat: count ? (sumFat / count).toFixed(1) : '0.0',
            avgSnf: count ? (sumSnf / count).toFixed(1) : '0.0',
            avgClr: count ? (sumClr / count).toFixed(1) : '0.0'
        };
    }, [filteredEntries]);

    const renderEntry = ({ item }: { item: MilkEntryData }) => (
        <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.supplierBrand}>
                    <View style={styles.supplierIconBg}>
                        <Ionicons name="person" size={16} color="#4338CA" />
                    </View>
                    <ThemedText style={styles.supplierName}>{item.supplier || 'Unknown Supplier'}</ThemedText>
                </View>
                <View style={styles.dateTimeBadge}>
                    <Ionicons name="calendar-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                    <ThemedText style={styles.dateTimeText}>
                        {formatDate(item.date)} • {item.shift}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.gridContainer}>
                <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>QTY</ThemedText>
                    <ThemedText style={styles.gridValue}>{item.quantity?.toFixed(2) || '0.00'} L</ThemedText>
                </View>
                <View style={[styles.gridItem, styles.gridBorder]}>
                    <ThemedText style={styles.gridLabel}>FAT</ThemedText>
                    <ThemedText style={styles.gridValue}>
                        {!isNaN(parseFloat(item.fatType)) ? parseFloat(item.fatType).toFixed(1) : (item.fatType || '0.0')}
                    </ThemedText>
                </View>
                <View style={[styles.gridItem, styles.gridBorder]}>
                    <ThemedText style={styles.gridLabel}>SNF/CLR</ThemedText>
                    <ThemedText style={styles.gridValue}>{item.snf || 0} / {item.clr || 0}</ThemedText>
                </View>
                <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>RATE</ThemedText>
                    <ThemedText style={styles.gridValue}>₹{item.costPerLiter?.toFixed(2) || '0.00'}</ThemedText>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.totalBadge}>
                    <Ionicons name="wallet-outline" size={16} color="#166534" style={{ marginRight: 6 }} />
                    <ThemedText style={styles.totalText}>
                        Total: ₹ {item.totalCost?.toFixed(2) || '0.00'}
                    </ThemedText>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handlePrint(item)}>
                        <Ionicons name="print-outline" size={18} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert("Edit", "Edit feature coming soon!")}>
                        <Ionicons name="pencil-outline" size={18} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item._id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    const filterChips = ['Today', 'This Month', 'Morning', 'Evening'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>History</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {/* Search Bar Row */}
                <View style={styles.filterSection}>
                    <View style={styles.searchRow}>
                        <TouchableOpacity style={styles.allSuppliersChip}>
                            <ThemedText style={styles.allSuppliersText}>All Suppliers</ThemedText>
                        </TouchableOpacity>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <TextInput
                                style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                placeholder="Search supplier..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Date Filters Row */}
                    <View style={styles.dateRow}>
                        <View style={styles.dateInputWrapper}>
                            <ThemedText style={styles.dateLabel}>From Date</ThemedText>
                            <View style={styles.dateInput}>
                                <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                                <ThemedText style={styles.dateValue}>01-11-2025</ThemedText>
                            </View>
                        </View>
                        <View style={styles.dateInputWrapper}>
                            <ThemedText style={styles.dateLabel}>To Date</ThemedText>
                            <View style={styles.dateInput}>
                                <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                                <ThemedText style={styles.dateValue}>30-11-2025</ThemedText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    <View style={styles.chipsContainer}>
                        {filterChips.map(chip => (
                            <TouchableOpacity
                                key={chip}
                                onPress={() => setActiveChip(chip)}
                                style={[
                                    styles.chip,
                                    activeChip === chip && styles.chipActive
                                ]}
                            >
                                <ThemedText style={[
                                    styles.chipText,
                                    activeChip === chip && styles.chipTextActive
                                ]}>
                                    {chip}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryBox}>
                            <ThemedText style={styles.summaryLabel}>Total Milk Qty</ThemedText>
                            <ThemedText style={styles.summaryValue}>{summary.totalQty.toFixed(2)} Ltr</ThemedText>
                        </View>
                        <View style={[styles.summaryBox, styles.summaryBorder]}>
                            <ThemedText style={styles.summaryLabel}>Avg FAT / SNF</ThemedText>
                            <ThemedText style={styles.summaryValue}>{summary.avgFat} / {summary.avgSnf}</ThemedText>
                        </View>
                    </View>
                    <View style={styles.summaryTotalBox}>
                        <ThemedText style={styles.totalLabel}>Total Milk Amount</ThemedText>
                        <ThemedText style={styles.totalAmount}>₹ {summary.totalAmount.toFixed(2)}</ThemedText>
                    </View>
                </View>

                {/* Ledger List */}
                {isLoading ? (
                    <LoadingIndicator />
                ) : (
                    <FlatList
                        data={filteredEntries}
                        keyExtractor={(item) => item._id}
                        renderItem={renderEntry}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={
                            <EmptyState title="No collections found" description="No records match the current filters." />
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    filterSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    allSuppliersChip: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    allSuppliersText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#111827',
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateInputWrapper: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 10,
        height: 40,
        gap: 8,
    },
    dateValue: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    chipsScroll: {
        marginBottom: 16,
        flexGrow: 0,
    },
    chipsContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 4,
    },
    chip: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
    },
    chipActive: {
        backgroundColor: '#E0E7FF',
        borderColor: '#4338CA',
    },
    chipText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#4338CA',
        fontWeight: '700',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    summaryGrid: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 16,
        marginBottom: 16,
    },
    summaryBox: {
        flex: 1,
        alignItems: 'center',
    },
    summaryBorder: {
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#22C55E',
    },
    summaryTotalBox: {
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: '#22C55E',
    },
    listContainer: {
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    supplierBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    supplierIconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    supplierName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    dateTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    dateTimeText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    gridContainer: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    gridItem: {
        alignItems: 'center',
        flex: 1,
    },
    gridBorder: {
        borderLeftWidth: 1,
        borderLeftColor: '#E2E8F0',
    },
    gridLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    gridValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    totalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    totalText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#166534',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    deleteBtn: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FEE2E2',
    },
});
