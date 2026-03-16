import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
    Keyboard,
    TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRODUCT_LIST = [
    { name: 'Ghee', color: '#F59E0B' },
    { name: 'Paneer', color: '#10B981' },
    { name: 'Curd', color: '#3B82F6' },
    { name: 'Butter', color: '#FCD34D' },
    { name: 'Khoa', color: '#8B5CF6' },
    { name: 'Flavoured Milk', color: '#EC4899' },
    { name: 'Icecream', color: '#06B6D4' },
    { name: 'Yoghurt', color: '#D946EF' },
    { name: 'Srikhand', color: '#F97316' },
    { name: 'Rasagolla', color: '#FFFFFF' },
    { name: 'Gulabjamun', color: '#78350F' },
    { name: 'Rabbari', color: '#BE123C' },
    { name: 'Other', color: '#64748B' },
];

export default function MakeProductsScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const isDark = colorScheme === 'dark';
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingInventory, setIsFetchingInventory] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Inventory State
    const [inventory, setInventory] = useState({
        wholeMilk: 0,
        skimMilk: 0,
        creamMilk: 0
    });

    // Form State
    const [date, setDate] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    const [selectedProduct, setSelectedProduct] = useState('Ghee');
    const [qtyProduced, setQtyProduced] = useState('');
    const [unit, setUnit] = useState('kg');
    
    // Milk Usage State
    const [useWhole, setUseWhole] = useState('');
    const [useSkim, setUseSkim] = useState('');
    const [useCream, setUseCream] = useState('');

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

        // Validation logic...
        if (wholeUsed > inventory.wholeMilk + 0.01) {
            Alert.alert('Low Balance', `Whole Milk balance is ${inventory.wholeMilk.toFixed(1)}L`); return;
        }
        if (skimUsed > inventory.skimMilk + 0.01) {
            Alert.alert('Low Balance', `Skim Milk balance is ${inventory.skimMilk.toFixed(1)}L`); return;
        }
        if (creamUsed > inventory.creamMilk + 0.01) {
            Alert.alert('Low Balance', `Cream Milk balance is ${inventory.creamMilk.toFixed(1)}L`); return;
        }

        setIsLoading(true);
        try {
            const res = await apiFetch('/api/production/make-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    date,
                    productName: selectedProduct,
                    quantityProduced: parseFloat(qtyProduced),
                    unit,
                    milkUsed: {
                        wholeMilk: wholeUsed,
                        skimMilk: skimUsed,
                        creamMilk: creamUsed
                    }
                })
            });

            if (res.ok) {
                setShowSuccess(true);
                setQtyProduced(''); setUseWhole(''); setUseSkim(''); setUseCream('');
                fetchInventory();
                setTimeout(() => setShowSuccess(false), 2500);
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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <View style={styles.container}>
                {/* ── HEADER ── */}
                <View style={[styles.header, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0', height: 72 }]}>
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        style={[styles.backButton, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }]}
                    >
                        <Ionicons name="arrow-back" size={22} color={isDark ? '#F8FAFC' : '#1E293B'} />
                    </TouchableOpacity>
                    
                    <View style={styles.headerCenter}>
                        <ThemedText style={styles.headerTitle}>Make Products</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Production Workshop</ThemedText>
                    </View>

                    <View style={{ width: 44 }} /> 
                </View>

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                    enabled={Platform.OS !== 'web'}
                >
                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                    
                    {/* ── STOCK DASHBOARD ── */}
                    <View style={styles.stockSection}>
                        <ThemedText style={styles.sectionLabel}>Available Raw Materials</ThemedText>
                        <View style={styles.stockGrid}>
                            <InventoryCard 
                                label="Whole" 
                                value={inventory.wholeMilk} 
                                color="#22C55E" 
                                icon="water" 
                                isDark={isDark} 
                                loading={isFetchingInventory}
                            />
                            <InventoryCard 
                                label="Skim" 
                                value={inventory.skimMilk} 
                                color="#3B82F6" 
                                icon="color-filter" 
                                isDark={isDark} 
                                loading={isFetchingInventory}
                            />
                            <InventoryCard 
                                label="Cream" 
                                value={inventory.creamMilk} 
                                color="#F59E0B" 
                                icon="layers" 
                                isDark={isDark} 
                                loading={isFetchingInventory}
                            />
                        </View>
                    </View>

                    {/* ── PRODUCT SELECTION ── */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionLabel}>Select Product to Produce</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
                            {PRODUCT_LIST.map((item) => (
                                <TouchableOpacity 
                                    key={item.name}
                                    onPress={() => setSelectedProduct(item.name)}
                                    style={[
                                        styles.productCard,
                                        { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                                        selectedProduct === item.name && { borderColor: item.color, borderWidth: 1.5, transform: [{ scale: 1.02 }] }
                                    ]}
                                >
                                    <ThemedText style={[styles.productName, selectedProduct === item.name && { color: item.color, fontWeight: '900' }]}>{item.name}</ThemedText>
                                    {selectedProduct === item.name && (
                                        <View style={[styles.checkMark, { backgroundColor: item.color }]}>
                                            <Ionicons name="checkmark" size={10} color="#FFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                        {/* ── MAIN FORM ── */}
                        <View style={[styles.mainCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                            
                            <ThemedText style={styles.cardSectionTitle}>Consumption (Liters)</ThemedText>
                            <View style={styles.usageRow}>
                                <UsageInput label="Whole" value={useWhole} onChange={setUseWhole} color="#22C55E" isDark={isDark} />
                                <UsageInput label="Skim" value={useSkim} onChange={setUseSkim} color="#3B82F6" isDark={isDark} />
                                <UsageInput label="Cream" value={useCream} onChange={setUseCream} color="#F59E0B" isDark={isDark} />
                            </View>

                            <View style={styles.divider} />

                            <ThemedText style={styles.cardSectionTitle}>Production Yield</ThemedText>
                            <View style={styles.yieldRow}>
                                <YieldInput 
                                    label="Total Quantity"
                                    value={qtyProduced}
                                    onChange={setQtyProduced}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                    color={currentProductColor}
                                    isDark={isDark}
                                />
                                <YieldInput 
                                    label="Unit"
                                    value={unit}
                                    onChange={setUnit}
                                    placeholder="kg"
                                    flex={0.6}
                                    color={currentProductColor}
                                    isDark={isDark}
                                />
                            </View>

                            <TouchableOpacity 
                                onPress={handleProduce}
                                disabled={isLoading}
                                style={styles.buttonShadow}
                            >
                                <LinearGradient
                                    colors={[currentProductColor, currentProductColor + 'CC']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.submitButton}
                                >
                                    {isLoading ? <ActivityIndicator color="#FFF" /> : (
                                        <ThemedText style={styles.buttonText}>Complete {selectedProduct} Production</ThemedText>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                </ScrollView>
                </KeyboardAvoidingView>
            </View>

            {/* Premium Success Modal */}
            <Modal transparent visible={showSuccess} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.successModal, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.successIconCircle}
                        >
                            <Ionicons name="checkmark-done" size={32} color="#FFF" />
                        </LinearGradient>
                        <ThemedText style={[styles.successTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Production Completed!</ThemedText>
                        <ThemedText style={styles.successMessage}>Your products have been recorded successfully which you can access anytime.</ThemedText>
                        
                        <TouchableOpacity onPress={() => setShowSuccess(false)} style={styles.closeModalBtn}>
                            <ThemedText style={[styles.closeModalText, { color: '#10B981' }]}>Continue</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ── CUSTOM COMPONENTS ──

const InventoryCard = React.memo(({ label, value, color, icon, isDark, loading }: any) => (
    <View style={[styles.invCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        <View style={[styles.invIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={16} color={color} />
        </View>
        <ThemedText style={styles.invLabel}>{label}</ThemedText>
        <ThemedText style={[styles.invValue, { color: color }]}>{loading ? '--' : value.toFixed(1)}<ThemedText style={styles.invUnit}>L</ThemedText></ThemedText>
    </View>
));

const UsageInput = React.memo(({ label, value, onChange, color, isDark }: any) => {
    const [isFocused, setIsFocused] = React.useState(false);
    return (
        <View style={styles.usageItem}>
            <ThemedText style={styles.usageLabel}>{label}</ThemedText>
            <View style={[
                styles.usageInput, 
                { borderColor: isFocused ? color : (isDark ? '#334155' : '#E2E8F0') },
                isFocused && { shadowColor: color, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
            ]}>
                <TextInput 
                    style={[styles.uInput, { color: isDark ? '#F8FAFC' : '#1E293B', height: 44 }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder="0"
                    placeholderTextColor="#475569"
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    value={value}
                    onChangeText={(t) => onChange(t.replace(/,/g, '.'))}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </View>
        </View>
    );
});

const YieldInput = React.memo(({ label, value, onChange, placeholder, keyboardType = 'default', flex = 1, color, isDark }: any) => {
    const [isFocused, setIsFocused] = React.useState(false);
    return (
        <View style={[styles.inputWrapper, { flex }]}>
            <ThemedText style={styles.inputLabel}>{label}</ThemedText>
            <View style={[
                styles.actionInput, 
                { borderColor: isFocused ? color : (isDark ? '#334155' : '#E2E8F0') },
                isFocused && styles.inputFocused
            ]}>
                <TextInput 
                    style={[styles.textInput, { color: isDark ? '#F8FAFC' : '#1E293B' }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder={placeholder}
                    placeholderTextColor="#64748B"
                    value={value}
                    onChangeText={(t) => onChange(t.replace(/,/g, '.'))}
                    keyboardType={keyboardType as any}
                    inputMode={keyboardType === 'decimal-pad' ? 'decimal' : 'none'}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F020',
    },
    headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
    headerSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '700', textAlign: 'center', marginTop: -2 },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateChip: {
        marginLeft: 'auto',
        backgroundColor: '#E2E8F030',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    dateText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    
    scrollContent: { padding: 16 },

    stockSection: { marginBottom: 16 },
    sectionLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
    stockGrid: { flexDirection: 'row', gap: 10 },
    invCard: {
        flex: 1,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    invIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    invLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 2 },
    invValue: { fontSize: 16, fontWeight: '900' },
    invUnit: { fontSize: 11, fontWeight: '700', opacity: 0.7 },

    section: { marginBottom: 16 },
    productScroll: { paddingVertical: 2 },
    productCard: {
        width: 85,
        height: 45,
        borderRadius: 12,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    productName: { fontSize: 13, fontWeight: '800', color: '#64748B' },
    checkMark: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },

    mainCard: {
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    cardSectionTitle: { fontSize: 14, fontWeight: '800', color: '#64748B', marginBottom: 12 },
    usageRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    usageItem: { flex: 1 },
    usageLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 4, textAlign: 'center' },
    usageInput: { height: 44, borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
    uInput: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800' },
    
    divider: { height: 1.5, backgroundColor: '#E2E8F030', marginBottom: 16 },

    yieldRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    inputWrapper: { flex: 1 },
    inputLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 4 },
    actionInput: { height: 48, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
    textInput: { flex: 1, fontSize: 16, fontWeight: '800', height: 44 },
    inputFocused: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },

    buttonShadow: { borderRadius: 14, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    submitButton: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },

    // Success Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    successModal: { width: '100%', maxWidth: 320, borderRadius: 28, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    successIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
    successTitle: { fontSize: 22, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
    successMessage: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24, fontWeight: '500' },
    closeModalBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 14, backgroundColor: '#10B98115' },
    closeModalText: { fontSize: 16, fontWeight: '800' },
});
