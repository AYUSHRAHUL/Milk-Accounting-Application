import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { getCLRCorrection } from '@/lib/milkCalculations';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { DatePicker } from '@/components/ui/DatePicker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ── INTERFACES ── */
interface MilkEntryData {
    _id: string;
    date: string;
    shift: string;
    supplier: string;
    supplierId?: string;
    source: string;
    fatType: string;
    snf?: number;
    clr?: number;
    lr?: number;
    temp?: number;
    ts?: number;
    quantity: number;
    mbrt?: string;
    mbrtTime?: string;
    cob?: string;
    protein?: number;
    lactose?: number;
    ash?: number;
    addedWater?: number;
    tsMachine?: number;
    tsDiff?: number;
}

export default function QualityParametersScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [entries, setEntries] = useState<MilkEntryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedShift, setSelectedShift] = useState('All');
    const [selectedSource, setSelectedSource] = useState('All');
    const [timeFilter, setTimeFilter] = useState('All');
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [showShiftDropdown, setShowShiftDropdown] = useState(false);
    const [showSourceDropdown, setShowSourceDropdown] = useState(false);

    /* ── EDIT STATE ── */
    const [editingEntry, setEditingEntry] = useState<MilkEntryData | null>(null);
    const [editFat, setEditFat] = useState('');
    const [editLR, setEditLR] = useState('');
    const [editTemp, setEditTemp] = useState('');
    const [editCLR, setEditCLR] = useState('');
    const [editSNF, setEditSNF] = useState('');
    const [editTS, setEditTS] = useState('');
    const [editMBRT, setEditMBRT] = useState('');
    const [editMBRTTimeHrs, setEditMBRTTimeHrs] = useState('');
    const [editMBRTTimeMins, setEditMBRTTimeMins] = useState('');
    const [editCOB, setEditCOB] = useState('');

    // New Parameters
    const [editProtein, setEditProtein] = useState('');
    const [editLactose, setEditLactose] = useState('');
    const [editAsh, setEditAsh] = useState('');
    const [editWater, setEditWater] = useState('');
    const [editTSMachine, setEditTSMachine] = useState('');
    const [editTSDiff, setEditTSDiff] = useState('');

    const fetchHistory = async () => {
        try {
            const response = await apiFetch(`/api/milk/collection?userId=${user?.id}`);
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

    /* ── CALCULATIONS ── */
    useEffect(() => {
        const lr = parseFloat(editLR) || 0;
        const temp = parseFloat(editTemp) || 0;
        const fat = parseFloat(editFat) || 0;
        const protein = parseFloat(editProtein) || 0;
        const lactose = parseFloat(editLactose) || 0;
        const ash = parseFloat(editAsh) || 0;

        let calculatedTS = 0;

        if (lr > 0 && temp > 0) {
            const clrVal = lr + getCLRCorrection(temp);
            setEditCLR(clrVal.toFixed(1));

            const snfVal = (clrVal / 4) + (0.2 * fat) + 0.7;
            setEditSNF(snfVal.toFixed(2));

            calculatedTS = fat + snfVal;
            setEditTS(calculatedTS.toFixed(2));
        }

        // TS (Machine) = Protein + Lactose + Ash + Fat (%)
        const tsMachine = protein + lactose + ash + fat;
        setEditTSMachine(tsMachine.toFixed(2));

        // Diff = TS - TS(Machine)
        if (calculatedTS > 0) {
            const diff = calculatedTS - tsMachine;
            setEditTSDiff(diff.toFixed(2));
        } else {
            setEditTSDiff('0.00');
        }
    }, [editLR, editTemp, editFat, editProtein, editLactose, editAsh]);

    // MBRT Status Logic
    useEffect(() => {
        const hrs = parseInt(editMBRTTimeHrs) || 0;
        const mins = parseInt(editMBRTTimeMins) || 0;
        const totalMinutes = hrs * 60 + mins;

        if (!editMBRTTimeHrs && !editMBRTTimeMins) {
            setEditMBRT('---');
            return;
        }

        if (totalMinutes >= 360) { // 6 hrs
            setEditMBRT('Very good');
        } else if (totalMinutes >= 120) { // 2 hrs to 5 hrs 59 mins
            setEditMBRT('Fair');
        } else if (totalMinutes >= 30) { // 30 mins to 1 hr 59 mins
            setEditMBRT('Poor');
        } else { // < 30 mins
            setEditMBRT('very Poor');
        }
    }, [editMBRTTimeHrs, editMBRTTimeMins]);

    const handleEditPress = (entry: MilkEntryData) => {
        setEditingEntry(entry);
        setEditFat(entry.fatType || '');
        setEditLR(entry.lr?.toString() || '');
        setEditTemp(entry.temp?.toString() || '');
        setEditCLR(entry.clr?.toString() || '');
        setEditSNF(entry.snf?.toString() || '');
        setEditTS(entry.ts?.toString() || '');
        setEditMBRT(entry.mbrt || '---');
        setEditCOB(entry.cob || '---');
        
        // New values
        setEditProtein(entry.protein?.toString() || '');
        setEditLactose(entry.lactose?.toString() || '');
        setEditAsh(entry.ash?.toString() || '');
        setEditWater(entry.addedWater?.toString() || '');
        setEditTSMachine(entry.tsMachine?.toString() || '');
        setEditTSDiff(entry.tsDiff?.toString() || '');

        if (entry.mbrtTime && entry.mbrtTime !== ':') {
            const parts = entry.mbrtTime.split(':');
            setEditMBRTTimeHrs(parts[0] || '');
            setEditMBRTTimeMins(parts[1] || '');
        } else {
            setEditMBRTTimeHrs('');
            setEditMBRTTimeMins('');
        }
        setIsEditingMode(true);
    };

    const handleBackToList = () => {
        setIsEditingMode(false);
        setEditingEntry(null);
    };

    const handleSave = async () => {
        if (!editingEntry) return;

        const updatedData = {
            ...editingEntry,
            fatType: editFat,
            lr: parseFloat(editLR),
            temp: parseFloat(editTemp),
            clr: parseFloat(editCLR),
            snf: parseFloat(editSNF),
            ts: parseFloat(editTS),
            mbrt: editMBRT,
            mbrtTime: (editMBRTTimeHrs || editMBRTTimeMins) ? `${editMBRTTimeHrs}:${editMBRTTimeMins}` : '',
            cob: editCOB,

            // New fields
            protein: parseFloat(editProtein),
            lactose: parseFloat(editLactose),
            ash: parseFloat(editAsh),
            addedWater: parseFloat(editWater),
            tsMachine: parseFloat(editTSMachine),
            tsDiff: parseFloat(editTSDiff),
        };

        try {
            const res = await apiFetch(`/api/milk/collection/${editingEntry._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (res.ok) {
                Alert.alert('Success', 'Quality parameters updated');
                handleBackToList();
                fetchHistory();
            } else {
                Alert.alert('Error', 'Failed to update quality parameters');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error');
        }
    };

    const filteredEntries = entries.filter(e => {
        const matchesShift = selectedShift === 'All' || e.shift === selectedShift;
        const matchesSource = selectedSource === 'All' || e.source === selectedSource;
        
        if (!e.date) return false;
        const entryDate = new Date(e.date);
        const today = new Date();

        let matchesDate = true;
        
        if (timeFilter !== 'All') {
            if (timeFilter === 'Today') {
                // toDateString() is the most robust way to compare calendar days
                matchesDate = entryDate.toDateString() === today.toDateString();
            } else if (timeFilter === '7D') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setHours(0, 0, 0, 0);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                matchesDate = entryDate >= sevenDaysAgo;
            } else if (timeFilter === '30D') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setHours(0, 0, 0, 0);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                matchesDate = entryDate >= thirtyDaysAgo;
            }
        }

        return matchesShift && matchesSource && matchesDate;
    });



    const renderItem = ({ item }: { item: MilkEntryData }) => (
        <TouchableOpacity 
            style={[styles.entryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleEditPress(item)}
        >
            <View style={styles.cardHeader}>
                <View>
                    <ThemedText style={styles.supplierName}>{item.supplier}</ThemedText>
                    <ThemedText style={styles.supplierId}>ID: {item.supplierId || 'N/A'} • {item.source || 'Cow'}</ThemedText>
                </View>
                <View style={styles.dateInfo}>
                    <ThemedText style={styles.dateText}>
                        {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                    <View style={[styles.shiftTag, { backgroundColor: item.shift === 'Morning' ? '#FEF3C7' : '#DBEAFE' }]}>
                        <ThemedText style={[styles.shiftText, { color: item.shift === 'Morning' ? '#92400E' : '#1E40AF' }]}>
                            {item.shift}
                        </ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.paramGrid}>
                <ParamBox label="Fat %" value={item.fatType || '0.0'} />
                <ParamBox label="LR" value={item.lr?.toString() || '0'} />
                <ParamBox label="SNF" value={item.snf?.toFixed(2) || '0.00'} />
                <ParamBox label="Qty" value={`${item.quantity.toFixed(1)}L`} />
            </View>

            <View style={styles.editHint}>
                <Ionicons name="create-outline" size={14} color="#6B7280" />
                <ThemedText style={styles.editHintText}>Tap to update parameters</ThemedText>
            </View>
        </TouchableOpacity>
    );

    if (isEditingMode && editingEntry) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <Stack.Screen options={{ headerShown: false }} />

                {/* Custom Header */}
                <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <TouchableOpacity
                        style={styles.backBtnCompact}
                        onPress={handleBackToList}
                    >
                        <Ionicons name="arrow-back" size={20} color={theme.text} />
                    </TouchableOpacity>
                    
                    <View style={styles.topBarCenter}>
                        <ThemedText style={styles.topBarTitle}>Edit Quality</ThemedText>
                        <ThemedText style={styles.topBarSub}>Update Parameters</ThemedText>
                    </View>

                    <View style={[styles.headerIconBox, { backgroundColor: '#DBEAFE' }]}>
                        <Ionicons name="create" size={18} color="#2563EB" />
                    </View>
                </View>
                
                <KeyboardAvoidingView 
                    style={{ flex: 1 }} 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView contentContainerStyle={styles.editPageContent} showsVerticalScrollIndicator={true}>
                    <View style={[styles.editHeader, { borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.editSupplierName}>{editingEntry.supplier}</ThemedText>
                            <ThemedText style={styles.editSupplierInfo}>
                                ID: {editingEntry.supplierId || 'N/A'} • {editingEntry.source || 'Cow'} • {new Date(editingEntry.date).toLocaleDateString()}
                            </ThemedText>
                        </View>
                        <View style={styles.headerQtyBox}>
                            <ThemedText style={styles.headerQtyLabel}>Quantity</ThemedText>
                            <ThemedText style={styles.headerQtyValue}>{editingEntry.quantity.toFixed(1)}L</ThemedText>
                        </View>
                    </View>

                    {/* Basic Grid */}
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionDot} />
                        <ThemedText style={styles.sectionTitle}>Physical Parameters</ThemedText>
                    </View>
                    
                    <View style={styles.formGrid}>
                        <InputGroup label="LR" value={editLR} setter={setEditLR} placeholder="28" />
                        <InputGroup label="Temp (°C)" value={editTemp} setter={setEditTemp} placeholder="4" />
                        <InputGroup label="Fat (%)" value={editFat} setter={setEditFat} placeholder="4.5" />
                    </View>

                    <View style={[styles.autoGrid, { backgroundColor: theme.surfaceMuted, marginBottom: 24 }]}>
                        <ReadOnlyGroup label="CLR" value={editCLR} />
                        <ReadOnlyGroup label="SNF (%)" value={editSNF} />
                        <ReadOnlyGroup label="TS (%)" value={editTS} />
                    </View>

                    {/* Machine Parameters */}
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionDot, { backgroundColor: '#3B82F6' }]} />
                        <ThemedText style={[styles.sectionTitle, { color: '#3B82F6' }]}>Machine Analysis</ThemedText>
                    </View>

                    <View style={styles.formGrid}>
                        <InputGroup label="Protein" value={editProtein} setter={setEditProtein} placeholder="e.g. 3.2" />
                        <InputGroup label="Lactose" value={editLactose} setter={setEditLactose} placeholder="e.g. 4.5" />
                        <InputGroup label="Ash" value={editAsh} setter={setEditAsh} placeholder="e.g. 0.7" />
                    </View>

                    <View style={styles.formGrid}>
                        <InputGroup label="Added Water(L)" value={editWater} setter={setEditWater} placeholder="e.g. 0.0" />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.inputLabel}>TS (Machine)</ThemedText>
                            <View style={styles.machineQtyBox}>
                                <ThemedText style={styles.machineQtyValue}>{editTSMachine}</ThemedText>
                            </View>
                        </View>
                        <View style={{ flex: 1 }} />
                    </View>

                    <View style={[styles.autoGrid, { backgroundColor: '#EFF6FF', marginBottom: 24 }]}>
                        <ReadOnlyGroup label="Diff in TS values" value={editTSDiff} color="#DC2626" />
                    </View>

                    {/* Microbiology */}
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionDot, { backgroundColor: '#8B5CF6' }]} />
                        <ThemedText style={[styles.sectionTitle, { color: '#8B5CF6' }]}>Microbiology & COB</ThemedText>
                    </View>

                    <View style={styles.formGrid}>
                        <View style={{ flex: 1.5 }}>
                            <ThemedText style={styles.inputLabel}>MBRT Time</ThemedText>
                            <View style={styles.timeInputRow}>
                                <TextInput
                                    style={[styles.timeInput, { backgroundColor: theme.surfaceMuted, color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                    value={editMBRTTimeHrs}
                                    onChangeText={setEditMBRTTimeHrs}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                                <ThemedText style={{ marginHorizontal: 4, fontSize: 16, fontWeight: '700', color: theme.text }}>:</ThemedText>
                                <TextInput
                                    style={[styles.timeInput, { backgroundColor: theme.surfaceMuted, color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                    value={editMBRTTimeMins}
                                    onChangeText={setEditMBRTTimeMins}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.inputLabel}>Status</ThemedText>
                            <View style={[styles.selectBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                                <ThemedText style={styles.selectText}>{editMBRT}</ThemedText>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.inputLabel}>COB</ThemedText>
                            <TouchableOpacity 
                                style={[styles.selectBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                                onPress={() => {
                                    const options = ['---', 'Negative', 'Positive'];
                                    const current = options.indexOf(editCOB);
                                    setEditCOB(options[(current + 1) % 3]);
                                }}
                            >
                                <ThemedText style={styles.selectText}>{editCOB}</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <ThemedText style={styles.saveButtonText}>Save Parameters</ThemedText>
                    </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={styles.backBtnCompact}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                </TouchableOpacity>
                
                <View style={styles.topBarCenter}>
                    <ThemedText style={styles.topBarTitle}>Quality parameters</ThemedText>
                    <ThemedText style={styles.topBarSub}>Milk testing records</ThemedText>
                </View>

                <View style={[styles.headerIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="flask" size={18} color="#16A34A" />
                </View>
            </View>
            
            <View style={[styles.searchContainer, { zIndex: 1000, overflow: 'visible' }]}>
                {/* Unified Filter Bar */}
                <View style={[styles.filterSection, { zIndex: 1000, overflow: 'visible' }]}>
                    <View style={styles.filterBarRow}>
                        {/* Shift Dropdown */}
                        <View style={styles.dropdownWrapper}>
                            <TouchableOpacity 
                                onPress={() => {
                                    setShowShiftDropdown(!showShiftDropdown);
                                    setShowSourceDropdown(false);
                                }}
                                style={[styles.dropBox, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}
                            >
                                <ThemedText style={styles.dropText}>{selectedShift === 'All' ? 'All Shifts' : selectedShift}</ThemedText>
                                <Ionicons name={showShiftDropdown ? "chevron-up" : "chevron-down"} size={14} color="#6B7280" />
                            </TouchableOpacity>
                            {showShiftDropdown && (
                                <View style={[styles.dropOptions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    {['All', 'Morning', 'Evening'].map(opt => (
                                        <TouchableOpacity key={opt} style={styles.dropOption} onPress={() => { setSelectedShift(opt); setShowShiftDropdown(false); }}>
                                            <ThemedText style={[styles.dropOptionText, selectedShift === opt && { color: '#22C55E', fontWeight: '800' }]}>{opt}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Source Dropdown */}
                        <View style={styles.dropdownWrapper}>
                            <TouchableOpacity 
                                onPress={() => {
                                    setShowSourceDropdown(!showSourceDropdown);
                                    setShowShiftDropdown(false);
                                }}
                                style={[styles.dropBox, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}
                            >
                                <ThemedText style={styles.dropText}>{selectedSource === 'All' ? 'All Sources' : selectedSource}</ThemedText>
                                <Ionicons name={showSourceDropdown ? "chevron-up" : "chevron-down"} size={14} color="#6B7280" />
                            </TouchableOpacity>
                            {showSourceDropdown && (
                                <View style={[styles.dropOptions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    {['All', 'Cow', 'Buffalo', 'Goat', 'Other'].map(opt => (
                                        <TouchableOpacity key={opt} style={styles.dropOption} onPress={() => { setSelectedSource(opt); setShowSourceDropdown(false); }}>
                                            <ThemedText style={[styles.dropOptionText, selectedSource === opt && { color: '#3B82F6', fontWeight: '800' }]}>{opt}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Time Ranges (placed below) */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterBar, { marginTop: 8 }]}>
                        {['All', 'Today', '7D', '30D'].map((range) => (
                            <TouchableOpacity
                                key={range}
                                onPress={() => setTimeFilter(range)}
                                style={[
                                    styles.filterChip,
                                    { 
                                        backgroundColor: timeFilter === range ? '#6366F1' : theme.surfaceMuted,
                                        borderColor: timeFilter === range ? '#4F46E5' : theme.border
                                    }
                                ]}
                            >
                                <ThemedText style={[
                                    styles.filterChipText,
                                    { color: timeFilter === range ? '#FFF' : '#6B7280' }
                                ]}>
                                    {range}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#22C55E" />
                </View>
            ) : (
                <FlatList
                    data={filteredEntries}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="flask-outline" size={48} color="#CBD5E1" />
                            <ThemedText style={styles.emptyText}>No collections found</ThemedText>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

function ParamBox({ label, value }: { label: string, value: string }) {
    return (
        <View style={styles.paramBox}>
            <ThemedText style={styles.paramLabel}>{label}</ThemedText>
            <ThemedText style={styles.paramValue}>{value}</ThemedText>
        </View>
    );
}

function InputGroup({ label, value, setter, placeholder }: any) {
    const isDark = useColorScheme() === 'dark';
    return (
        <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>{label}</ThemedText>
            <TextInput
                style={[
                    styles.textInput, 
                    { backgroundColor: isDark ? '#334155' : '#F8FAFC', color: isDark ? '#F8FAFC' : '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                ]}
                value={value}
                onChangeText={setter}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
            />
        </View>
    );
}

function ReadOnlyGroup({ label, value, color }: any) {
    return (
        <View style={styles.readOnlyGroup}>
            <ThemedText style={styles.readOnlyLabel}>{label}</ThemedText>
            <ThemedText style={[styles.readOnlyValue, color && { color }]}>{value || '0.00'}</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        height: 60,
    },
    backBtnCompact: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarCenter: { flex: 1, alignItems: 'center' },
    topBarTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
    topBarSub: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: -2 },
    headerIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 14,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
    listContent: { padding: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    entryCard: {
        borderRadius: 14,
        padding: 10,
        marginBottom: 8,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    supplierName: { fontSize: 15, fontWeight: '800' },
    supplierId: { fontSize: 12, color: '#6B7280', marginTop: 1, fontWeight: '500' },
    dateInfo: { alignItems: 'flex-end' },
    dateText: { fontSize: 13, color: '#94A3B8' },
    shiftTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
    shiftText: { fontSize: 11, fontWeight: '800' },
    paramGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    paramBox: { flex: 1, alignItems: 'center' },
    paramLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 1, fontWeight: '600' },
    paramValue: { fontSize: 14, fontWeight: '800' },
    editHint: { flexDirection: 'row', alignItems: 'center', marginTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 6, justifyContent: 'center' },
    editHintText: { fontSize: 11, color: '#94A3B8', marginLeft: 6, fontWeight: '600' },
    filterBar: { flexDirection: 'row', marginTop: 12 },
    filterBarRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 4, zIndex: 3000 },
    dropdownWrapper: { flex: 1, position: 'relative', zIndex: 3000 },
    dropBox: { height: 40, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
    dropText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
    dropOptions: { position: 'absolute', top: 44, left: 0, right: 0, borderRadius: 12, borderWidth: 1, zIndex: 5000, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
    dropOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    dropOptionText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, height: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    filterChipText: { fontSize: 11, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 16 },

    /* EDIT PAGE */
    editPageContent: { padding: 16, paddingBottom: 100 },
    editHeader: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1 },
    editSupplierName: { fontSize: 22, fontWeight: '800' },
    editSupplierInfo: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '600' },
    headerQtyBox: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center', minWidth: 80 },
    headerQtyLabel: { fontSize: 10, color: '#166534', fontWeight: '700', textTransform: 'uppercase' },
    headerQtyValue: { fontSize: 18, color: '#166534', fontWeight: '800' },
    machineQtyBox: { backgroundColor: '#DBEAFE', height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    machineQtyValue: { fontSize: 16, color: '#1E40AF', fontWeight: '800' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#22C55E' },
    formGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
    textInput: { height: 44, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, fontWeight: '700' },
    autoGrid: { flexDirection: 'row', gap: 6, padding: 10, borderRadius: 12, marginBottom: 16 },
    readOnlyGroup: { flex: 1, alignItems: 'center' },
    readOnlyLabel: { fontSize: 10, color: '#6B7280', marginBottom: 2, fontWeight: '600' },
    readOnlyValue: { fontSize: 15, fontWeight: '800', color: '#10B981' },
    timeInputRow: { flexDirection: 'row', alignItems: 'center', height: 44 },
    timeInput: { width: 44, height: 44, borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '800', borderWidth: 1, borderColor: '#E2E8F0' },
    selectBox: { width: '100%', height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    selectText: { fontSize: 14, fontWeight: '700' },
    saveButton: { backgroundColor: '#22C55E', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
    saveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
