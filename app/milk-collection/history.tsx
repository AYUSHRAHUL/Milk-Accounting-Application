import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
            filtered = filtered.filter(e => e.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
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
            <View style={[styles.cardHeader, { borderBottomColor: theme.borderMuted }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 16 }}>👤</ThemedText>
                    <ThemedText style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: theme.text }}>{item.supplier}</ThemedText>
                </View>
                <ThemedText style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '500' }}>
                    {formatDate(item.date)} | {item.shift}
                </ThemedText>
            </View>

            <View style={[styles.gridContainer, { borderBottomColor: theme.borderMuted }]}>
                <View style={styles.gridItem}>
                    <ThemedText style={[styles.gridLabel, { color: theme.textSecondary }]}>QTY</ThemedText>
                    <ThemedText style={[styles.gridValue, { color: theme.primary }]}>{item.quantity.toFixed(2)} Ltr</ThemedText>
                </View>
                <View style={styles.gridItem}>
                    <ThemedText style={[styles.gridLabel, { color: theme.textSecondary }]}>FAT</ThemedText>
                    <ThemedText style={[styles.gridValue, { color: theme.primary }]}>{!isNaN(parseFloat(item.fatType)) ? parseFloat(item.fatType).toFixed(1) : (item.fatType || '0.0')}</ThemedText>
                </View>
                <View style={styles.gridItem}>
                    <ThemedText style={[styles.gridLabel, { color: theme.textSecondary }]}>SNF/CLR</ThemedText>
                    <ThemedText style={[styles.gridValue, { color: theme.primary }]}>{item.snf || 0} / {item.clr || 0}</ThemedText>
                </View>
                <View style={styles.gridItem}>
                    <ThemedText style={[styles.gridLabel, { color: theme.textSecondary }]}>RATE (₹)</ThemedText>
                    <ThemedText style={[styles.gridValue, { color: theme.primary }]}>₹{item.costPerLiter.toFixed(2)}</ThemedText>
                </View>
            </View>

            <View style={[styles.cardFooter, { backgroundColor: theme.surfaceMuted }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 16 }}>💳</ThemedText>
                    <ThemedText style={{ fontSize: 14, fontWeight: 'bold', marginLeft: 6, color: theme.text }}>
                        Total: ₹ {item.totalCost.toFixed(2)}
                    </ThemedText>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={() => handlePrint(item)}>
                        <ThemedText style={{ fontSize: 20 }}>�️</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert("Edit", "Edit feature coming soon!")}>
                        <ThemedText style={{ fontSize: 20 }}>✏️</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item._id)}>
                        <ThemedText style={{ fontSize: 20 }}>🗑️</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    const filterChips = ['Today', 'This Month', 'Morning', 'Evening'];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <ScreenHeader title="View Collections" subtitle="Milk collection history & summary" onBack={() => router.back()} />
                {/* Search Bar Row */}
                <View style={styles.searchRow}>
                    <TouchableOpacity style={[styles.allFarmersBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <ThemedText style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>All Suppliers</ThemedText>
                    </TouchableOpacity>
                    <View style={[styles.searchInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <ThemedText style={{ marginLeft: 8, fontSize: 16 }}>🔍</ThemedText>
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Enter Supplier"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={theme.icon}
                        />
                    </View>
                </View>

                {/* Date Filters Row */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    <View style={[styles.dateBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <ThemedText style={[styles.dateLabel, { backgroundColor: theme.background, color: theme.textSecondary }]}>From Date</ThemedText>
                        <ThemedText style={[styles.dateValue, { color: theme.text }]}>01-11-2025</ThemedText>
                    </View>
                    <View style={[styles.dateBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <ThemedText style={[styles.dateLabel, { backgroundColor: theme.background, color: theme.textSecondary }]}>To Date</ThemedText>
                        <ThemedText style={[styles.dateValue, { color: theme.text }]}>30-11-2025</ThemedText>
                    </View>
                </View>

                {/* Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, flexGrow: 0 }}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                        {filterChips.map(chip => (
                            <TouchableOpacity
                                key={chip}
                                onPress={() => setActiveChip(chip)}
                                style={[
                                    styles.chip,
                                    { backgroundColor: theme.surface, borderColor: theme.border },
                                    activeChip === chip && { backgroundColor: theme.primaryMuted, borderColor: theme.primary + '59' }
                                ]}
                            >
                                <ThemedText style={[
                                    styles.chipText,
                                    { color: theme.textSecondary },
                                    activeChip === chip && { color: theme.primary, fontWeight: '700' }
                                ]}>
                                    {activeChip === chip ? '✓ ' : ''}{chip}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Summary Card */}
                <Card variant="elevated" style={styles.summaryCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Milk Qty</ThemedText>
                            <ThemedText style={[styles.summaryValueQty, { color: theme.primary }]}>{summary.totalQty.toFixed(2)} Ltr</ThemedText>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Avg FAT/SNF-CLR</ThemedText>
                            <ThemedText style={[styles.summaryValueQty, { color: theme.primary }]}>{summary.avgFat} / {summary.avgSnf}</ThemedText>
                        </View>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Milk Amount</ThemedText>
                        <ThemedText style={[styles.summaryValueAmount, { color: theme.primary }]}>₹ {summary.totalAmount.toFixed(2)}</ThemedText>
                    </View>
                </Card>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    allFarmersBtn: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    dateBox: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        position: 'relative',
    },
    dateLabel: {
        position: 'absolute',
        top: -10,
        left: 10,
        paddingHorizontal: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    dateValue: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 4,
        marginLeft: 4,
    },
    chip: {
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
    },
    chipText: {
        fontWeight: '500',
    },
    summaryCard: {
        marginBottom: 16,
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summaryValueQty: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    summaryValueAmount: {
        fontSize: 24,
        fontWeight: '900',
    },
    listContainer: {
        paddingBottom: 40,
    },
    card: {
        marginBottom: 12,
        padding: 0,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: undefined,
    },
    gridContainer: {
        flexDirection: 'row',
        padding: 12,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: undefined,
    },
    gridItem: {
        alignItems: 'center',
        flex: 1,
    },
    gridLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    gridValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
});
