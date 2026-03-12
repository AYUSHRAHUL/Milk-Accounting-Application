import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { router, Stack, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
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
    const [activeChip, setActiveChip] = useState('All');

    const fetchHistory = async () => {
        try {
            const response = await apiFetch('/api/milk/collection');
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
                            const response = await apiFetch(`/api/milk/collection/${id}`, { method: 'DELETE' });
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

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<MilkEntryData | null>(null);
    const [editForm, setEditForm] = useState({
        quantity: '',
        fatType: '',
        snf: '',
        clr: '',
        costPerLiter: ''
    });

    const openEditModal = (item: MilkEntryData) => {
        setEditingItem(item);
        setEditForm({
            quantity: item.quantity.toString(),
            fatType: item.fatType.toString(),
            snf: (item.snf || '').toString(),
            clr: (item.clr || '').toString(),
            costPerLiter: item.costPerLiter.toString()
        });
        setIsEditModalVisible(true);
    };

    const handleUpdate = async () => {
        if (!editingItem) return;

        const updatedData = {
            quantity: parseFloat(editForm.quantity),
            fatType: editForm.fatType,
            snf: parseFloat(editForm.snf) || 0,
            clr: parseFloat(editForm.clr) || 0,
            costPerLiter: parseFloat(editForm.costPerLiter),
            totalCost: parseFloat(editForm.quantity) * parseFloat(editForm.costPerLiter)
        };

        try {
            const response = await apiFetch(`/api/milk/collection/${editingItem._id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                setIsEditModalVisible(false);
                fetchHistory(); // Refresh
                Alert.alert("Success", "Record updated successfully.");
            } else {
                Alert.alert("Error", "Failed to update record.");
            }
        } catch (error) {
            Alert.alert("Error", "An unexpected error occurred.");
        }
    };

    const handlePrint = async (item: MilkEntryData) => {
        const html = `
            <html>
                <body style="font-family: sans-serif; padding: 40px; color: #333;">
                    <div style="text-align: center; border: 2px solid #4338CA; padding: 20px; border-radius: 10px;">
                        <h1 style="color: #4338CA; margin-bottom: 5px;">Milk Receipt</h1>
                        <p style="margin-top: 0; font-weight: bold;">Milk Accounting Application</p>
                        <hr style="border: 1px solid #eee;"/>
                        
                        <div style="display: flex; justify-content: space-between; text-align: left; margin-top: 20px;">
                            <div>
                                <p><strong>Supplier:</strong> ${item.supplier}</p>
                                <p><strong>Source:</strong> ${item.source}</p>
                            </div>
                            <div style="text-align: right;">
                                <p><strong>Date:</strong> ${formatDate(item.date)}</p>
                                <p><strong>Shift:</strong> ${item.shift}</p>
                            </div>
                        </div>

                        <table style="width: 100%; border-collapse: collapse; margin-top: 30px; border: 1px solid #ddd;">
                            <thead style="background: #EEF2FF;">
                                <tr>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Qty (Ltrs)</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Fat %</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">SNF/CLR</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Rate (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.quantity.toFixed(2)}</td>
                                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.fatType}</td>
                                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.snf || 0} / ${item.clr || 0}</td>
                                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.costPerLiter.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style="margin-top: 40px; text-align: center; background: #DCFCE7; padding: 15px; border-radius: 8px;">
                            <h2 style="color: #166534; margin: 0;">Total Amount: ₹ ${item.totalCost.toFixed(2)}</h2>
                        </div>
                        
                        <div style="margin-top: 40px; font-size: 10px; color: #9a9a9a; border-top: 1px solid #eee; padding-top: 10px;">
                            <p>Thank you for your business!</p>
                            <p>Generated on ${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error("Print error:", error);
            Alert.alert("Error", "Failed to generate receipt.");
        }
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
        if (activeChip === 'Today') {
            const today = new Date().toDateString();
            filtered = filtered.filter(e => new Date(e.date).toDateString() === today);
        } else if (activeChip === 'Yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            filtered = filtered.filter(e => new Date(e.date).toDateString() === yesterdayStr);
        } else if (activeChip === 'This Week') {
            const now = new Date();
            const startOfWeek = new Date(now);
            const day = now.getDay(); // 0 is Sunday, 1 is Monday...
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);
            filtered = filtered.filter(e => new Date(e.date) >= startOfWeek);
        } else if (activeChip === 'This Month') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            filtered = filtered.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
        } else if (activeChip === 'Morning') {
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
        let weightedFat = 0;
        let weightedSnf = 0;
        let weightedClr = 0;

        filteredEntries.forEach(e => {
            const qty = e.quantity || 0;
            totalQty += qty;
            totalAmount += e.totalCost || 0;
            weightedFat += (parseFloat(e.fatType) || 0) * qty;
            weightedSnf += (e.snf || 0) * qty;
            weightedClr += (e.clr || 0) * qty;
        });

        return {
            totalQty,
            totalAmount,
            avgFat: totalQty > 0 ? (weightedFat / totalQty).toFixed(1) : '0.0',
            avgSnf: totalQty > 0 ? (weightedSnf / totalQty).toFixed(1) : '0.0',
            avgClr: totalQty > 0 ? (weightedClr / totalQty).toFixed(1) : '0.0'
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
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                        <Ionicons name="pencil-outline" size={18} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item._id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    const filterChips = ['All', 'Today', 'Yesterday', 'This Week', 'This Month', 'Morning', 'Evening'];

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
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                            placeholder="Search by supplier name..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9CA3AF"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.filterGrid}>
                        {/* Date Filters Group */}
                        <View style={styles.dateRangeContainer}>
                            <View style={styles.dateField}>
                                <ThemedText style={styles.fieldLabel}>From</ThemedText>
                                <TouchableOpacity style={styles.datePickerToggle}>
                                    <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                                    <ThemedText style={styles.dateText}>01-11-2025</ThemedText>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.dateField}>
                                <ThemedText style={styles.fieldLabel}>To</ThemedText>
                                <TouchableOpacity style={styles.datePickerToggle}>
                                    <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                                    <ThemedText style={styles.dateText}>30-11-2025</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Quick Filters */}
                        <View style={styles.quickFiltersContainer}>
                            <ThemedText style={styles.fieldLabel}>Quick Filters</ThemedText>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
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
                            </ScrollView>
                        </View>
                    </View>
                </View>

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

            {/* Edit Modal */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Edit Milk Entry</ThemedText>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <ThemedText style={styles.inputLabel}>Quantity (Liters)</ThemedText>
                            <TextInput
                                style={styles.modalInput}
                                value={editForm.quantity}
                                onChangeText={(t) => setEditForm(prev => ({ ...prev, quantity: t }))}
                                keyboardType="numeric"
                            />

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <ThemedText style={styles.inputLabel}>FAT %</ThemedText>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={editForm.fatType}
                                        onChangeText={(t) => setEditForm(prev => ({ ...prev, fatType: t }))}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <ThemedText style={styles.inputLabel}>Rate (₹/L)</ThemedText>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={editForm.costPerLiter}
                                        onChangeText={(t) => setEditForm(prev => ({ ...prev, costPerLiter: t }))}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <ThemedText style={styles.inputLabel}>SNF</ThemedText>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={editForm.snf}
                                        onChangeText={(t) => setEditForm(prev => ({ ...prev, snf: t }))}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <ThemedText style={styles.inputLabel}>CLR</ThemedText>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={editForm.clr}
                                        onChangeText={(t) => setEditForm(prev => ({ ...prev, clr: t }))}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleUpdate}
                                activeOpacity={0.8}
                            >
                                <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        height: 52,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    filterGrid: {
        gap: 20,
    },
    dateRangeContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    dateField: {
        flex: 1,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    datePickerToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 12,
        height: 44,
        gap: 10,
    },
    dateText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    quickFiltersContainer: {
        marginTop: 4,
    },
    chipsRow: {
        gap: 10,
        paddingBottom: 4,
    },
    chip: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4338CA',
    },
    chipText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#4338CA',
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalBody: {
        gap: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 6,
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
        fontSize: 15,
        color: '#111827',
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    saveBtn: {
        backgroundColor: '#4338CA',
        borderRadius: 12,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
