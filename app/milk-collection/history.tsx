import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

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
                        } catch (e) {
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
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 16 }}>👤</ThemedText>
                    <ThemedText style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: '#333' }}>{item.supplier}</ThemedText>
                </View>
                <ThemedText style={{ fontSize: 13, color: '#666', fontWeight: '500' }}>
                    {formatDate(item.date)} | {item.shift}
                </ThemedText>
            </View>

            <View style={styles.gridContainer}>
                <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>QTY</ThemedText>
                    <ThemedText style={[styles.gridValue, { color: '#0084ff' }]}>{item.quantity.toFixed(2)} Ltr</ThemedText>
                </View>
                <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>FAT</ThemedText>
                    <ThemedText style={[styles.gridValue, { color: '#0084ff' }]}>{!isNaN(parseFloat(item.fatType)) ? parseFloat(item.fatType).toFixed(1) : (item.fatType || '0.0')}</ThemedText>
                </View>
                <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>SNF/CLR</ThemedText>
                    <ThemedText style={[styles.gridValue, { color: '#0084ff' }]}>{item.snf || 0} / {item.clr || 0}</ThemedText>
                </View>
                <View style={styles.gridItem}>
                    <ThemedText style={styles.gridLabel}>RATE (₹)</ThemedText>
                    <ThemedText style={[styles.gridValue, { color: '#0084ff' }]}>₹{item.costPerLiter.toFixed(2)}</ThemedText>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText style={{ fontSize: 16 }}>💳</ThemedText>
                    <ThemedText style={{ fontSize: 14, fontWeight: 'bold', marginLeft: 6, color: '#001b3a' }}>
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
        </View>
    );

    const filterChips = ['Today', 'This Month', 'Morning', 'Evening'];
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

    return (
        <View style={styles.container}>
            {/* Header Area */}
            <LinearGradient
                colors={[theme.primary, '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topHeader}
            >
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <ThemedText type="title" style={{ color: '#FFF', fontSize: 24, marginLeft: 8 }}>
                    View Collections
                </ThemedText>
            </LinearGradient>

            <View style={styles.content}>
                {/* Search Bar Row */}
                <View style={styles.searchRow}>
                    <TouchableOpacity style={styles.allFarmersBtn}>
                        <ThemedText style={{ color: '#003366', fontWeight: 'bold', fontSize: 14 }}>All Suppliers</ThemedText>
                    </TouchableOpacity>
                    <View style={styles.searchInputContainer}>
                        <ThemedText style={{ marginLeft: 8, fontSize: 16 }}>🔍</ThemedText>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Enter Supplier"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                {/* Date Filters Row */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    <View style={styles.dateBox}>
                        <ThemedText style={styles.dateLabel}>From Date</ThemedText>
                        <ThemedText style={styles.dateValue}>01-11-2025</ThemedText>
                    </View>
                    <View style={styles.dateBox}>
                        <ThemedText style={styles.dateLabel}>To Date</ThemedText>
                        <ThemedText style={styles.dateValue}>30-11-2025</ThemedText>
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
                                    activeChip === chip && styles.activeChip
                                ]}
                            >
                                <ThemedText style={[
                                    styles.chipText,
                                    activeChip === chip && styles.activeChipText
                                ]}>
                                    {activeChip === chip ? '✓ ' : ''}{chip}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <ThemedText style={styles.summaryLabel}>Total Milk Qty</ThemedText>
                            <ThemedText style={styles.summaryValueQty}>{summary.totalQty.toFixed(2)} Ltr</ThemedText>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                            <ThemedText style={styles.summaryLabel}>Avg FAT/SNF-CLR</ThemedText>
                            <ThemedText style={styles.summaryValueQty}>{summary.avgFat} / {summary.avgSnf}</ThemedText>
                        </View>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText style={styles.summaryLabel}>Total Milk Amount</ThemedText>
                        <ThemedText style={styles.summaryValueAmount}>₹ {summary.totalAmount.toFixed(2)}</ThemedText>
                    </View>
                </View>

                {/* Ledger List */}
                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#0084ff" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredEntries}
                        keyExtractor={(item) => item._id}
                        renderItem={renderEntry}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingTop: 40 }}>
                                <ThemedText style={{ color: '#999', fontSize: 16 }}>No collections found.</ThemedText>
                            </View>
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
        backgroundColor: '#eef6fc',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    content: {
        flex: 1,
        padding: 16,
        marginTop: -10, // Pulls the content up slightly over the curved header edge
    },
    searchRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    allFarmersBtn: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    dateBox: {
        flex: 1,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 8,
        position: 'relative',
    },
    dateLabel: {
        position: 'absolute',
        top: -10,
        left: 10,
        backgroundColor: '#eef6fc',
        paddingHorizontal: 4,
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
    },
    dateValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginTop: 4,
        marginLeft: 4,
    },
    chip: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D0D0D0',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
    },
    activeChip: {
        backgroundColor: '#e0efff',
        borderColor: '#b3d8ff',
    },
    chipText: {
        color: '#666',
        fontWeight: '500',
    },
    activeChipText: {
        color: '#005bb5',
        fontWeight: 'bold',
    },
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    summaryLabel: {
        color: '#333',
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summaryValueQty: {
        color: '#16a2d9',
        fontSize: 16,
        fontWeight: 'bold',
    },
    summaryValueAmount: {
        color: '#16a2d9',
        fontSize: 24,
        fontWeight: '900',
    },
    listContainer: {
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    gridContainer: {
        flexDirection: 'row',
        padding: 12,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    gridItem: {
        alignItems: 'center',
        flex: 1,
    },
    gridLabel: {
        fontSize: 12,
        color: '#2a4269',
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
        backgroundColor: '#fbfdfd',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
});
