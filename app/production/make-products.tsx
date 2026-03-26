import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { DatePicker } from '@/components/ui/DatePicker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ── CONFIG ── */
const PRODUCT_LIST = [
    { name: 'Paneer', color: '#10B981', icon: '🧀' },
    { name: 'Ghee', color: '#F59E0B', icon: '🫙' },
    { name: 'Butter', color: '#FCD34D', icon: '🧈' },
    { name: 'Curd', color: '#3B82F6', icon: '🥛' },
    { name: 'Khoa', color: '#8B5CF6', icon: '🍮' },
    { name: 'Fl. milk', color: '#EC4899', icon: '🧃' },
    { name: 'Icecream', color: '#F472B6', icon: '🍨' },
    { name: 'Yoghurt', color: '#A78BFA', icon: '🍧' },
    { name: 'Srikhand', color: '#FDE047', icon: '🥣' },
    { name: 'Rasgolla', color: '#9CA3AF', icon: '⚪' },
    { name: 'Gulabjamun', color: '#78350F', icon: '🧆' },
    { name: 'Rabbari', color: '#FBBF24', icon: '🥘' },
    { name: 'Other', color: '#64748B', icon: '📦' },
];

const PAGE_PADDING = 24;

export default function MakeProductsScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingInventory, setIsFetchingInventory] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    // Form State
    const [inventory, setInventory] = useState({ wholeMilk: 0, skimMilk: 0, creamMilk: 0 });
    const [date, setDate] = useState(() => {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    });

    useFocusEffect(
        useCallback(() => {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            const today = `${dd}-${mm}-${yyyy}`;
            setDate(today);
        }, [])
    );
    const [selectedProduct, setSelectedProduct] = useState('Ghee');
    const [qtyProduced, setQtyProduced] = useState('');
    const [unit, setUnit] = useState('kg');
    const [useWhole, setUseWhole] = useState('');
    const [useSkim, setUseSkim] = useState('');
    const [useCream, setUseCream] = useState('');
    const [showAllProducts, setShowAllProducts] = useState(false);

    const fetchInventory = useCallback(async () => {
        if (!user?.id) return;
        setIsFetchingInventory(true);
        try {
            const res = await apiFetch(`/api/production/inventory?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setInventory(data);
            }
        } catch (error) {
            console.error('Fetch Inventory Error:', error);
        } finally {
            setIsFetchingInventory(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleProduce = async () => {
        if (!user?.id) return;
        if (!qtyProduced || (!useWhole && !useSkim && !useCream)) {
            Alert.alert('Missing Information', 'Please provide the quantity produced and the milk used.');
            return;
        }

        const wholeUsed = parseFloat(useWhole) || 0;
        const skimUsed = parseFloat(useSkim) || 0;
        const creamUsed = parseFloat(useCream) || 0;

        if (wholeUsed > inventory.wholeMilk + 0.01) {
            Alert.alert('Low Balance', `Whole Milk balance is ${inventory.wholeMilk.toFixed(1)}L`); return;
        }
        if (skimUsed > inventory.skimMilk + 0.01) {
            Alert.alert('Low Balance', `Skim Milk balance is ${inventory.skimMilk.toFixed(1)}L`); return;
        }
        if (creamUsed > inventory.creamMilk + 0.01) {
            Alert.alert('Low Balance', `Cream Milk balance is ${inventory.creamMilk.toFixed(1)}L`); return;
        }

        const [dd, mm, yyyy] = date.split('-').map(Number);
        const prodDate = new Date(Date.UTC(yyyy, mm - 1, dd));

        setIsLoading(true);
        try {
            const res = await apiFetch('/api/production/make-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    date: prodDate.toISOString(),
                    productName: selectedProduct,
                    quantityProduced: parseFloat(qtyProduced),
                    unit,
                    milkUsed: { wholeMilk: wholeUsed, skimMilk: skimUsed, creamMilk: creamUsed }
                })
            });

            if (res.ok) {
                setShowSuccess(true);
                setQtyProduced(''); setUseWhole(''); setUseSkim(''); setUseCream('');
                fetchInventory();
            }
        } catch (error) {
            console.error('Save Product Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentProductColor = useMemo(() => {
        return PRODUCT_LIST.find(p => p.name === selectedProduct)?.color || '#16A34A';
    }, [selectedProduct]);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.container}>
                {/* ── HEADER ── */}
                <View style={[styles.header, { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
                    >
                        <Ionicons name="arrow-back" size={20} color={isDark ? '#F8FAFC' : '#0F172A'} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <ThemedText style={styles.headerTitle}>Make Products</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Production Data Entry</ThemedText>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80} // Offset for header
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        ref={scrollRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                    {/* ── INVENTORY OVERVIEW ── */}
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Raw Materials Available</ThemedText>
                    </View>
                    <View style={styles.inventoryGrid}>
                        <InventoryCard label="Whole Milk" value={inventory.wholeMilk} color="#22C55E" isDark={isDark} loading={isFetchingInventory} />
                        <InventoryCard label="Skim Milk" value={inventory.skimMilk} color="#3B82F6" isDark={isDark} loading={isFetchingInventory} />
                        <InventoryCard label="Cream" value={inventory.creamMilk} color="#F59E0B" isDark={isDark} loading={isFetchingInventory} />
                    </View>

                    <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                        <ThemedText style={styles.sectionTitle}>Production Date</ThemedText>
                    </View>
                    <View style={{ paddingHorizontal: PAGE_PADDING, marginBottom: 8 }}>
                        <DatePicker
                            value={date}
                            onChange={setDate}
                            format="DD-MM-YYYY"
                        />
                    </View>

                    {/* ── PRODUCT SELECTION TALL PILLS ── */}
                    <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                        <ThemedText style={styles.sectionTitle}>Product to Produce</ThemedText>
                    </View>
                    
                    {/* Box-type grid view for products */}
                    <View style={styles.productGridContainer}>
                        {(() => {
                            const displayList = showAllProducts 
                                ? [...PRODUCT_LIST, { name: 'Less', color: '#64748B', icon: '⬆️' }] 
                                : [...PRODUCT_LIST.slice(0, 7), { name: 'More', color: '#64748B', icon: '➡️' }];
                                
                            return displayList.map((item) => {
                                if (item.name === 'More' || item.name === 'Less') {
                                    return (
                                        <TouchableOpacity
                                            key={item.name}
                                            onPress={() => setShowAllProducts(item.name === 'More')}
                                            style={[
                                                styles.boxProductChip,
                                                { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0', justifyContent: 'center' }
                                            ]}
                                        >
                                            <ThemedText style={{ fontSize: 14, marginBottom: 2 }}>{item.icon}</ThemedText>
                                            <ThemedText style={[styles.boxProductName, { color: isDark ? '#F8FAFC' : '#334155' }]}>{item.name === 'More' ? 'More...' : 'Show Less'}</ThemedText>
                                        </TouchableOpacity>
                                    );
                                }

                                const isSelected = selectedProduct === item.name;
                                return (
                                    <TouchableOpacity
                                        key={item.name}
                                        onPress={() => setSelectedProduct(item.name)}
                                        style={[
                                            styles.boxProductChip,
                                            { backgroundColor: isSelected ? item.color : (isDark ? '#1E293B' : '#FFFFFF') },
                                            { borderColor: isSelected ? item.color : (isDark ? '#334155' : '#E2E8F0') }
                                        ]}
                                    >
                                        <ThemedText style={{ fontSize: 14, marginBottom: 2 }}>{item.icon}</ThemedText>
                                        <ThemedText style={[
                                            styles.boxProductName,
                                            { color: isSelected ? '#FFFFFF' : (isDark ? '#F8FAFC' : '#334155') }
                                        ]}>
                                            {item.name}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            });
                        })()}
                    </View>

                        
                        {/* ── CONSUMPTION SECTION ── */}
                        <View style={[styles.formCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
                            
                            <ThemedText style={[styles.formSectionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Consumption</ThemedText>
                            
                            <View style={styles.usageGrid}>
                                <UsageInputCol label="Whole" value={useWhole} onChange={setUseWhole} color="#22C55E" isDark={isDark} onFocus={() => scrollRef.current?.scrollTo({ y: 400, animated: true })} />
                                <UsageInputCol label="Skim" value={useSkim} onChange={setUseSkim} color="#3B82F6" isDark={isDark} onFocus={() => scrollRef.current?.scrollTo({ y: 400, animated: true })} />
                                <UsageInputCol label="Cream" value={useCream} onChange={setUseCream} color="#F59E0B" isDark={isDark} onFocus={() => scrollRef.current?.scrollTo({ y: 400, animated: true })} />
                            </View>

                            {/* ── PRODUCTION YIELD SECTION ── */}
                            <View style={[styles.sectionDivider, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} />
                            <ThemedText style={[styles.formSectionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Production Yield</ThemedText>
                            
                            <View style={styles.yieldContainer}>
                                <YieldInputRow 
                                    label="Quantity Produced" 
                                    value={qtyProduced} 
                                    onChange={setQtyProduced} 
                                    color={currentProductColor} 
                                    isDark={isDark} 
                                    placeholder="0.00"
                                    flex={2.5}
                                    onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                                />
                                <View style={{ width: 12 }} />
                                <YieldInputRow 
                                    label="Unit" 
                                    value={unit} 
                                    onChange={setUnit} 
                                    color={currentProductColor} 
                                    isDark={isDark} 
                                    placeholder="kg"
                                    flex={1}
                                    isText
                                    onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                                />
                            </View>

                        </View>

                        {/* ── SUBMIT BUTTON ── */}
                        <TouchableOpacity onPress={handleProduce} disabled={isLoading} style={styles.submitWrapper}>
                            <View style={[styles.submitButton, { backgroundColor: currentProductColor }]}>
                                {isLoading ? <ActivityIndicator color="#FFF" /> : (
                                    <ThemedText style={styles.buttonText}>Complete Production</ThemedText>
                                )}
                            </View>
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Success Modal */}
            <Modal transparent visible={showSuccess} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.successModal, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name="checkmark" size={32} color="#10B981" />
                        </View>
                        <ThemedText style={[styles.successTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Saved Successfully</ThemedText>
                        <ThemedText style={styles.successMessage}>Production entry has been recorded.</ThemedText>
                        
                        <TouchableOpacity 
                            onPress={() => {
                                setShowSuccess(false);
                                router.replace('/(tabs)');
                            }}
                            style={[
                                styles.okButton, 
                                { 
                                    backgroundColor: '#10B981', 
                                    marginTop: 16,
                                    ...Platform.select({
                                        web: { boxShadow: '0px 4px 5px rgba(16, 185, 129, 0.3)' } as any,
                                        default: {
                                            shadowColor: '#10B981',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 5,
                                            elevation: 6
                                        }
                                    })
                                }
                            ]}
                        >
                            <Text style={styles.okButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ── CUSTOM COMPONENTS ──

const InventoryCard = React.memo(({ label, value, color, isDark, loading }: any) => (
    <View style={[styles.invCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
        <View style={styles.invHeader}>
            <View style={[styles.invDot, { backgroundColor: color }]} />
            <ThemedText style={styles.invLabel} numberOfLines={1}>{label}</ThemedText>
        </View>
        <ThemedText style={[styles.invValue, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
            {loading ? '--' : value.toFixed(1)}<ThemedText style={styles.invUnit}> L</ThemedText>
        </ThemedText>
    </View>
));

const UsageInputCol = React.memo(({ label, value, onChange, color, isDark, onFocus }: any) => {
    const [isFocused, setIsFocused] = React.useState(false);
    return (
        <View style={styles.usageCol}>
            <View style={styles.usageColHeader}>
                <View style={[styles.invDot, { backgroundColor: color }]} />
                <ThemedText style={styles.usageColLabel}>{label}</ThemedText>
            </View>
            <View style={[
                styles.inputBoxCol,
                { backgroundColor: isDark ? '#0F172A' : '#FAFCFF', borderColor: isFocused ? color : (isDark ? '#334155' : '#F1F5F9') }
            ]}>
                <TextInput
                    style={[styles.baseInput, { color: isDark ? '#F8FAFC' : '#1E293B' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => {
                        setIsFocused(true);
                        onFocus?.();
                    }}
                    onBlur={() => setIsFocused(false)}
                />
            </View>
        </View>
    );
});

const YieldInputRow = React.memo(({ label, value, onChange, color, isDark, placeholder, flex = 1, isText = false, onFocus }: any) => {
    const [isFocused, setIsFocused] = React.useState(false);
    return (
        <View style={[styles.yieldCol, { flex }]}>
            <ThemedText style={styles.yieldLabelText}>{label}</ThemedText>
            <View style={[
                styles.inputBoxYield,
                { backgroundColor: isDark ? '#0F172A' : '#FAFCFF', borderColor: isFocused ? color : (isDark ? '#334155' : '#F1F5F9') }
            ]}>
                <TextInput
                    style={[styles.baseInputYield, { color: isDark ? '#F8FAFC' : '#1E293B' }, isText && { fontWeight: '700' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder={placeholder}
                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                    keyboardType={isText ? 'default' : 'numeric'}
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => {
                        setIsFocused(true);
                        onFocus?.();
                    }}
                    onBlur={() => setIsFocused(false)}
                />
            </View>
        </View>
    );
});

/* ── STYLES ── */
const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: PAGE_PADDING,
        height: 52,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
    
    scrollContent: { paddingVertical: 16, paddingBottom: 40 },

    sectionHeader: { marginBottom: 12, paddingHorizontal: PAGE_PADDING },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#647A90', textTransform: 'uppercase', letterSpacing: 0.5 },

    /* Inventory Grid */
    inventoryGrid: { flexDirection: 'row', gap: 8, paddingHorizontal: PAGE_PADDING },
    invCard: {
        flex: 1,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    invHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    invDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    invLabel: { fontSize: 12, fontWeight: '500', color: '#64748B', flexShrink: 1 },
    invValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    invUnit: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },

    /* Product Selection (Box Container) */
    productGridContainer: { 
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: PAGE_PADDING, 
        gap: 6, 
        paddingTop: 4,
        paddingBottom: 4
    },
    boxProductChip: {
        width: '23.5%',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
    },
    boxProductName: { 
        fontSize: 10, 
        fontWeight: '600',
        letterSpacing: 0.1,
        textAlign: 'center',
    },

    /* formCard is inside the standard Page Padding */
    formCard: {
        marginHorizontal: PAGE_PADDING,
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    formSectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12 },
    
    verticalList: { gap: 0 },
    usageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    usageLabelGroup: { flexDirection: 'row', alignItems: 'center' },
    colorIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    usageLabelText: { fontSize: 13, fontWeight: '500' },
    inputBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        width: 100, 
        height: 42, 
        borderWidth: 1, 
        borderRadius: 10, 
        paddingHorizontal: 14 
    },
    baseInput: { 
        flex: 1, 
        fontSize: 14, 
        fontWeight: '600', 
        height: '100%',
        padding: 0,
        textAlignVertical: 'center',
    },
    listDivider: { height: 1.5, marginVertical: 0 },

    /* Usage Grid Column Styles */
    usageGrid: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    usageCol: { flex: 1 },
    usageColHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    usageColLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
    inputBoxCol: { 
        height: 40, 
        borderWidth: 1, 
        borderRadius: 8, 
        paddingHorizontal: 12,
        justifyContent: 'center'
    },

    sectionDivider: { height: 1.5, marginVertical: 10 },
    
    yieldContainer: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
    yieldCol: { flexDirection: 'column' },
    yieldLabelText: { fontSize: 13, fontWeight: '500', color: '#64748B', marginBottom: 8 },
    inputBoxYield: { 
        height: 48, 
        borderWidth: 1, 
        borderRadius: 10, 
        paddingHorizontal: 14,
        justifyContent: 'center'
    },
    baseInputYield: { 
        flex: 1, 
        fontSize: 15, 
        fontWeight: '600', 
        height: '100%',
        padding: 0,
        textAlignVertical: 'center',
    },

    submitWrapper: { marginTop: 16, paddingHorizontal: PAGE_PADDING },
    submitButton: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    successModal: { width: '100%', maxWidth: 320, borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1 },
    successIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B98115', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    successTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    successMessage: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 24 },
    okButton: {
        width: '100%',
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    okButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});