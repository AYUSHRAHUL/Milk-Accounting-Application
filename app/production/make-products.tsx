import { ThemedText } from '@/components/themed-text';
import { DatePicker } from '@/components/ui/DatePicker';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
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
    { name: 'Paneer', color: '#10B981', icon: '🧀', idealUnit: 'kg' },
    { name: 'Ghee', color: '#F59E0B', icon: '🫙', idealUnit: 'ltr' },
    { name: 'Butter', color: '#FCD34D', icon: '🧈', idealUnit: 'kg' },
    { name: 'Curd', color: '#3B82F6', icon: '🥛', idealUnit: 'kg' },
    { name: 'Khoa', color: '#8B5CF6', icon: '🍮', idealUnit: 'kg' },
    { name: 'Fl. milk', color: '#EC4899', icon: '🧃', idealUnit: 'ltr' },
    { name: 'ST Milk', color: '#2563EB', icon: '🥛', idealUnit: 'ltr' },
    { name: 'TD MILK', color: '#0EA5E9', icon: '🥛', idealUnit: 'ltr' },
    { name: 'DTD MIlk', color: '#38BDF8', icon: '🥛', idealUnit: 'ltr' },
    { name: 'Icecream', color: '#F472B6', icon: '🍨', idealUnit: 'ltr' },
    { name: 'Yoghurt', color: '#A78BFA', icon: '🍧', idealUnit: 'kg' },
    { name: 'Srikhand', color: '#FDE047', icon: '🥣', idealUnit: 'kg' },
    { name: 'Rasgolla', color: '#9CA3AF', icon: '⚪', idealUnit: 'units' },
    { name: 'Gulabjamun', color: '#78350F', icon: '🧆', idealUnit: 'units' },
    { name: 'Rabbari', color: '#FBBF24', icon: '🥘', idealUnit: 'kg' },
    { name: 'Other', color: '#64748B', icon: '📦', idealUnit: 'kg' },
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
    const [inventory, setInventory] = useState({
        mixedMilk: 0,
        skimMilk: 0,
        creamMilk: 0,
        sepMixed: 0,
        sourceAvailable: { Cow: 0, Buffalo: 0, Goat: 0, Other: 0 }
    });
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
    const [useCow, setUseCow] = useState('');
    const [useBuff, setUseBuff] = useState('');
    const [useGoat, setUseGoat] = useState('');
    const [useOther, setUseOther] = useState('');
    const [useSkim, setUseSkim] = useState('');
    const [useCream, setUseCream] = useState('');
    const [useMixed, setUseMixed] = useState('');
    const [useSkimPowder, setUseSkimPowder] = useState('');
    const [useSugar, setUseSugar] = useState('');
    const [useStabilizer, setUseStabilizer] = useState('');
    const [showAllProducts, setShowAllProducts] = useState(false);

    const fetchInventory = useCallback(async () => {
        if (!user?.id) return;
        setIsFetchingInventory(true);
        try {
            const res = await apiFetch(`/api/production/inventory?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setInventory({
                    mixedMilk: data.wholeMilk || 0,
                    skimMilk: data.skimMilk || 0,
                    creamMilk: data.creamMilk || 0,
                    sepMixed: data.mixedMilk || 0,
                    sourceAvailable: data.sourceAvailable || { Cow: 0, Buffalo: 0, Goat: 0, Other: 0 }
                });
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

    // Auto-update unit based on selected product
    useEffect(() => {
        const prod = PRODUCT_LIST.find(p => p.name === selectedProduct);
        if (prod?.idealUnit) {
            setUnit(prod.idealUnit);
        }
    }, [selectedProduct]);

    // Live Balance Alerts (Real-time check)
    useEffect(() => {
        const cVal = parseFloat(useCow) || 0;
        const bVal = parseFloat(useBuff) || 0;
        const gVal = parseFloat(useGoat) || 0;
        const oVal = parseFloat(useOther) || 0;
        const sVal = parseFloat(useSkim) || 0;
        const rVal = parseFloat(useCream) || 0;
        const mVal = parseFloat(useMixed) || 0;

        if (cVal > (inventory.sourceAvailable.Cow || 0) + 0.001) {
            Alert.alert('Low Balance', `Cow Milk balance is only ${inventory.sourceAvailable.Cow.toFixed(3)}L`);
            setUseCow((inventory.sourceAvailable.Cow || 0).toString());
        }
        if (bVal > (inventory.sourceAvailable.Buffalo || 0) + 0.001) {
            Alert.alert('Low Balance', `Buffalo Milk balance is only ${inventory.sourceAvailable.Buffalo.toFixed(3)}L`);
            setUseBuff((inventory.sourceAvailable.Buffalo || 0).toString());
        }
        if (gVal > (inventory.sourceAvailable.Goat || 0) + 0.001) {
            Alert.alert('Low Balance', `Goat Milk balance is only ${inventory.sourceAvailable.Goat.toFixed(3)}L`);
            setUseGoat((inventory.sourceAvailable.Goat || 0).toString());
        }
        if (oVal > (inventory.sourceAvailable.Other || 0) + 0.001) {
            Alert.alert('Low Balance', `Other Milk balance is only ${inventory.sourceAvailable.Other.toFixed(3)}L`);
            setUseOther((inventory.sourceAvailable.Other || 0).toString());
        }
        if (sVal > (inventory.skimMilk || 0) + 0.001) {
            Alert.alert('Low Balance', `Skim Milk balance is only ${inventory.skimMilk.toFixed(3)}L`);
            setUseSkim((inventory.skimMilk || 0).toString());
        }
        if (rVal > (inventory.creamMilk || 0) + 0.001) {
            Alert.alert('Low Balance', `Cream balance is only ${inventory.creamMilk.toFixed(3)}L`);
            setUseCream((inventory.creamMilk || 0).toString());
        }
        if (mVal > (inventory.sepMixed || 0) + 0.001) {
            Alert.alert('Low Balance', `Mixed Milk balance is only ${inventory.sepMixed.toFixed(3)}L`);
            setUseMixed((inventory.sepMixed || 0).toString());
        }
    }, [useCow, useBuff, useGoat, useOther, useSkim, useCream, useMixed, inventory]);

    const handleProduce = async () => {
        if (!user?.id) return;
        const cUsed = parseFloat(useCow) || 0;
        const bUsed = parseFloat(useBuff) || 0;
        const gUsed = parseFloat(useGoat) || 0;
        const oUsed = parseFloat(useOther) || 0;
        const skimUsed = parseFloat(useSkim) || 0;
        const creamUsed = parseFloat(useCream) || 0;
        const sepMixedUsed = parseFloat(useMixed) || 0;
        const sPowder = parseFloat(useSkimPowder) || 0;
        const sSugar = parseFloat(useSugar) || 0;
        const sStab = parseFloat(useStabilizer) || 0;
        const mixedRawUsed = cUsed + bUsed + gUsed + oUsed;

        if (!qtyProduced || (mixedRawUsed === 0 && skimUsed === 0 && creamUsed === 0 && sepMixedUsed === 0 && sPowder === 0)) {
            Alert.alert('Missing Information', 'Please provide the quantity produced and the milk used.');
            return;
        }

        if (cUsed > (inventory.sourceAvailable.Cow || 0) + 0.01) {
            Alert.alert('Low Balance', `Cow Milk balance is ${inventory.sourceAvailable.Cow.toFixed(3)}L`); return;
        }
        if (bUsed > (inventory.sourceAvailable.Buffalo || 0) + 0.01) {
            Alert.alert('Low Balance', `Buffalo Milk balance is ${inventory.sourceAvailable.Buffalo.toFixed(3)}L`); return;
        }
        if (gUsed > (inventory.sourceAvailable.Goat || 0) + 0.01) {
            Alert.alert('Low Balance', `Goat Milk balance is ${inventory.sourceAvailable.Goat.toFixed(3)}L`); return;
        }
        if (oUsed > (inventory.sourceAvailable.Other || 0) + 0.01) {
            Alert.alert('Low Balance', `Other Milk balance is ${inventory.sourceAvailable.Other.toFixed(3)}L`); return;
        }
        if (skimUsed > inventory.skimMilk + 0.01) {
            Alert.alert('Low Balance', `Skim Milk balance is ${inventory.skimMilk.toFixed(3)}L`); return;
        }
        if (creamUsed > inventory.creamMilk + 0.01) {
            Alert.alert('Low Balance', `Cream Milk balance is ${inventory.creamMilk.toFixed(3)}L`); return;
        }
        if (sepMixedUsed > inventory.sepMixed + 0.01) {
            Alert.alert('Low Balance', `Mixed Milk balance is ${inventory.sepMixed.toFixed(3)}L`); return;
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
                    milkUsed: { 
                        wholeMilk: mixedRawUsed, 
                        skimMilk: skimUsed, 
                        creamMilk: creamUsed, 
                        mixedMilk: sepMixedUsed,
                        smPowder: sPowder,
                        sugar: sSugar,
                        stabilizer: sStab
                    },
                    sourceWholeUsed: { cow: cUsed, buff: bUsed, goat: gUsed, other: oUsed }
                })
            });

            if (res.ok) {
                setQtyProduced(''); setUseCow(''); setUseBuff(''); setUseGoat(''); setUseOther('');
                setUseSkim(''); setUseCream(''); setUseMixed('');
                setUseSkimPowder(''); setUseSugar(''); setUseStabilizer('');
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

    // Live Usage Totals
    const totalWholeUsed = useMemo(() => {
        return (parseFloat(useCow) || 0) + (parseFloat(useBuff) || 0) + (parseFloat(useGoat) || 0) + (parseFloat(useOther) || 0);
    }, [useCow, useBuff, useGoat, useOther]);

    const totalSkimUsed = useMemo(() => parseFloat(useSkim) || 0, [useSkim]);
    const totalCreamUsed = useMemo(() => parseFloat(useCream) || 0, [useCream]);
    const totalMixedUsed = useMemo(() => parseFloat(useMixed) || 0, [useMixed]);

    // Total Available Milk (Live Remaining)
    const totalAvailableMilk = useMemo(() => {
        const cowLeft = Math.max(0, (inventory.sourceAvailable.Cow || 0) - (parseFloat(useCow) || 0));
        const buffLeft = Math.max(0, (inventory.sourceAvailable.Buffalo || 0) - (parseFloat(useBuff) || 0));
        const goatLeft = Math.max(0, (inventory.sourceAvailable.Goat || 0) - (parseFloat(useGoat) || 0));
        const otherLeft = Math.max(0, (inventory.sourceAvailable.Other || 0) - (parseFloat(useOther) || 0));
        return cowLeft + buffLeft + goatLeft + otherLeft;
    }, [inventory.sourceAvailable, useCow, useBuff, useGoat, useOther]);

    // Live remaining for Skim & Cream
    const skimLeft = useMemo(() => Math.max(0, inventory.skimMilk - totalSkimUsed), [inventory.skimMilk, totalSkimUsed]);
    const creamLeft = useMemo(() => Math.max(0, inventory.creamMilk - totalCreamUsed), [inventory.creamMilk, totalCreamUsed]);
    const mixedLeft = useMemo(() => Math.max(0, inventory.sepMixed - totalMixedUsed), [inventory.sepMixed, totalMixedUsed]);

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
                        <ThemedText style={styles.headerSubtitle}>Separation Data Entry</ThemedText>
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
                        <View style={{ paddingHorizontal: PAGE_PADDING }}>
                            {/* Whole Milk Main Section */}
                            <View style={[styles.wholeMilkContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
                                <View style={styles.invHeader}>
                                    <View style={[styles.invDot, { backgroundColor: '#22C55E' }]} />
                                    <ThemedText style={styles.invLabel}>Available Milk</ThemedText>
                                    <View style={{ flex: 1 }} />
                                    <ThemedText style={[styles.invValueMain, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                                        {isFetchingInventory ? '--' : totalAvailableMilk.toFixed(3)}<ThemedText style={styles.invUnit}> L</ThemedText>
                                    </ThemedText>
                                </View>

                                <View style={styles.sourceDisplayGrid}>
                                    <View style={styles.sourceItem}>
                                        <ThemedText style={styles.sourceLabel}>Cow</ThemedText>
                                        <ThemedText style={[styles.sourceValue, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                            {Math.max(0, (inventory.sourceAvailable.Cow || 0) - (parseFloat(useCow) || 0)).toFixed(3)}L
                                        </ThemedText>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <ThemedText style={styles.sourceLabel}>Buffalo</ThemedText>
                                        <ThemedText style={[styles.sourceValue, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                            {Math.max(0, (inventory.sourceAvailable.Buffalo || 0) - (parseFloat(useBuff) || 0)).toFixed(3)}L
                                        </ThemedText>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <ThemedText style={styles.sourceLabel}>Goat</ThemedText>
                                        <ThemedText style={[styles.sourceValue, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                            {Math.max(0, (inventory.sourceAvailable.Goat || 0) - (parseFloat(useGoat) || 0)).toFixed(3)}L
                                        </ThemedText>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <ThemedText style={styles.sourceLabel}>Other</ThemedText>
                                        <ThemedText style={[styles.sourceValue, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                            {Math.max(0, (inventory.sourceAvailable.Other || 0) - (parseFloat(useOther) || 0)).toFixed(3)}L
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>

                            {/* Raw Material Ingredients (Stock vs Usage) */}
                            <View style={styles.secondaryInventoryRow}>
                                <InventoryCard
                                    label="Mixed Milk"
                                    value={mixedLeft}
                                    color="#10B981"
                                    isDark={isDark}
                                    loading={isFetchingInventory}
                                />
                                <InventoryCard
                                    label="Skim Milk"
                                    value={skimLeft}
                                    color="#3B82F6"
                                    isDark={isDark}
                                    loading={isFetchingInventory}
                                />
                                <InventoryCard
                                    label="Cream"
                                    value={creamLeft}
                                    color="#F59E0B"
                                    isDark={isDark}
                                    loading={isFetchingInventory}
                                />
                            </View>
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
                                    ? [...PRODUCT_LIST, { name: 'Show Fewer', color: '#64748B', icon: '⬆️' }]
                                    : [...PRODUCT_LIST.slice(0, 7), { name: 'Other...', color: '#64748B', icon: '➡️' }];

                                return displayList.map((item) => {
                                    if (item.name === 'Other...' || item.name === 'Show Fewer') {
                                        return (
                                            <TouchableOpacity
                                                key={item.name}
                                                onPress={() => setShowAllProducts(item.name === 'Other...')}
                                                style={[
                                                    styles.boxProductChip,
                                                    { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0', justifyContent: 'center' }
                                                ]}
                                            >
                                                <ThemedText style={{ fontSize: 14, marginBottom: 2 }}>{item.icon}</ThemedText>
                                                <ThemedText style={[styles.boxProductName, { color: isDark ? '#F8FAFC' : '#334155' }]}>{item.name === 'Other...' ? 'Other...' : 'Show Fewer'}</ThemedText>
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


                        {/* ── CONSUMPTION SECTION (Other Milks & Yield) ── */}
                        <View style={[styles.formCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>

                            {/* Milk Usage Section (Integrated) */}
                            <ThemedText style={[styles.formSectionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Mixed Milk Usage</ThemedText>
                            {/* Raw Sources usage */}
                            <View style={[styles.yieldContainer, { marginBottom: 16 }]}>
                                <YieldInputRow
                                    label="Cow"
                                    value={useCow}
                                    onChange={setUseCow}
                                    color="#22C55E"
                                    isDark={isDark}
                                    placeholder="0"
                                    flex={1}
                                />
                                <View style={{ width: 6 }} />
                                <YieldInputRow
                                    label="Buffalo"
                                    value={useBuff}
                                    onChange={setUseBuff}
                                    color="#22C55E"
                                    isDark={isDark}
                                    placeholder="0"
                                    flex={1}
                                />
                                <View style={{ width: 6 }} />
                                <YieldInputRow
                                    label="Goat"
                                    value={useGoat}
                                    onChange={setUseGoat}
                                    color="#22C55E"
                                    isDark={isDark}
                                    placeholder="0"
                                    flex={1}
                                />
                                <View style={{ width: 6 }} />
                                <YieldInputRow
                                    label="Other"
                                    value={useOther}
                                    onChange={setUseOther}
                                    color="#22C55E"
                                    isDark={isDark}
                                    placeholder="0"
                                    flex={1}
                                />
                            </View>

                            {/* Processed usage */}
                            <View style={styles.yieldContainer}>
                                <YieldInputRow
                                    label="Mixed Milk"
                                    value={useMixed}
                                    onChange={setUseMixed}
                                    color="#10B981"
                                    isDark={isDark}
                                    placeholder="0"
                                    flex={1}
                                />
                                <View style={{ width: 8 }} />
                                <YieldInputRow
                                    label="Skim Milk"
                                    value={useSkim}
                                    onChange={setUseSkim}
                                    color="#3B82F6"
                                    isDark={isDark}
                                    placeholder="0"
                                    flex={1}
                                />
                                <View style={{ width: 8 }} />
                                <YieldInputRow
                                    label="Cream"
                                    value={useCream}
                                    onChange={setUseCream}
                                    color="#F59E0B"
                                    isDark={isDark}
                                    placeholder="0"
                                    flex={1}
                                />
                            </View>

                            {selectedProduct === 'Icecream' && (
                                <>
                                    <View style={[styles.sectionDivider, { backgroundColor: isDark ? '#334155' : '#F1F5F9', marginTop: 16 }]} />
                                    <ThemedText style={[styles.formSectionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Ice Cream Addons</ThemedText>
                                    <View style={styles.yieldContainer}>
                                        <YieldInputRow
                                            label="Skim Powder"
                                            value={useSkimPowder}
                                            onChange={setUseSkimPowder}
                                            color="#60A5FA"
                                            isDark={isDark}
                                            placeholder="kg"
                                            flex={1}
                                        />
                                        <View style={{ width: 8 }} />
                                        <YieldInputRow
                                            label="Sugar"
                                            value={useSugar}
                                            onChange={setUseSugar}
                                            color="#FDE047"
                                            isDark={isDark}
                                            placeholder="kg"
                                            flex={1}
                                        />
                                        <View style={{ width: 8 }} />
                                        <YieldInputRow
                                            label="Stabilizer"
                                            value={useStabilizer}
                                            onChange={setUseStabilizer}
                                            color="#A78BFA"
                                            isDark={isDark}
                                            placeholder="kg"
                                            flex={1}
                                        />
                                    </View>
                                </>
                            )}

                            <View style={[styles.sectionDivider, { backgroundColor: isDark ? '#334155' : '#F1F5F9', marginTop: 16 }]} />
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
                                    <ThemedText style={styles.buttonText}>Record Production</ThemedText>
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

const InventoryCard = React.memo(({ label, value, color, isDark, loading, subValue }: any) => (
    <View style={[styles.invCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
        <View style={styles.invHeader}>
            <View style={[styles.invDot, { backgroundColor: color }]} />
            <ThemedText style={styles.invLabel} numberOfLines={1}>{label}</ThemedText>
        </View>
        <ThemedText style={[styles.invValue, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
            {loading ? '--' : value.toFixed(3)}<ThemedText style={styles.invUnit}> L</ThemedText>
        </ThemedText>
        {subValue && !loading && (
            <ThemedText style={styles.invSubValue}>{subValue}</ThemedText>
        )}
    </View>
));

const UsageInputBox = React.memo(({ label, value, setter, avail, isDark, onFocus }: any) => {
    const isExceeded = (parseFloat(value) || 0) > avail + 0.01;
    return (
        <View style={styles.sourceUsageItem}>
            <ThemedText style={[styles.sourceLabelText, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{label}</ThemedText>
            <View style={[styles.sourceInputContainer, {
                borderColor: isExceeded ? '#EF4444' : (isDark ? '#334155' : '#E2E8F0'),
                backgroundColor: isDark ? '#0F172A' : '#FAFCFF',
                borderWidth: isExceeded ? 1.5 : 1
            }]}>
                <TextInput
                    style={[styles.sourceInputText, { color: isDark ? '#F8FAFC' : '#1E293B' }]}
                    value={value}
                    onChangeText={setter}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                    onFocus={onFocus}
                    onBlur={() => {
                        if (isExceeded) {
                            if (Platform.OS === 'web') alert(`Warning: ${label} usage exceeds available stock!`);
                            else Alert.alert('Warning', `${label} usage exceeds available stock!`);
                        }
                    }}
                />
            </View>
            <ThemedText style={[styles.sourceAvailText, { color: isExceeded ? '#EF4444' : '#64748B' }]}>
                {isExceeded ? 'Exceeded!' : `Left: ${Math.max(0, avail - (parseFloat(value) || 0)).toFixed(3)}L`}
            </ThemedText>
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
                    editable={!isText}
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

    scrollContent: { paddingVertical: 8, paddingBottom: 32 },

    sectionHeader: { marginBottom: 12, paddingHorizontal: PAGE_PADDING },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#647A90', textTransform: 'uppercase', letterSpacing: 0.5 },

    /* Inventory Grid */
    inventoryGrid: { flexDirection: 'row', gap: 8, paddingHorizontal: PAGE_PADDING },
    wholeMilkContainer: {
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    usageInputGrid: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 12,
        justifyContent: 'space-between'
    },
    secondaryInventoryRow: {
        flexDirection: 'row',
        gap: 8,
    },
    invCard: {
        flex: 1,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    invHeader: { flexDirection: 'row', alignItems: 'center' },
    invDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    invLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', flexShrink: 1 },
    invValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
    invValueMain: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    invUnit: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
    sourceDisplayGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    sourceItem: {
        alignItems: 'center',
        flex: 1,
    },
    sourceLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        marginBottom: 0,
        textTransform: 'uppercase',
    },
    sourceValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    invSubValue: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 4 },

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

    /* Source Breakdown Usage Grid */
    sourceUsageGrid: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    usageDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16, opacity: 0.5 },
    sourceUsageItem: { flex: 1, alignItems: 'center' },
    sourceAvailText: { fontSize: 9.5, fontWeight: '700', marginTop: 4, color: '#64748B' },
    sourceLabelText: { fontSize: 12, fontWeight: '800', marginBottom: 6, color: '#1E293B' },
    sourceInputContainer: { height: 42, width: '100%', borderRadius: 8, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 6 },
    sourceInputText: { fontSize: 15, fontWeight: '700', padding: 0, textAlign: 'center', textAlignVertical: 'center', ...Platform.select({ web: { outlineStyle: 'none' } }) as any },

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