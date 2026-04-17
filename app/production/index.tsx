import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useFocusEffect } from 'expo-router';
import { DatePicker } from '@/components/ui/DatePicker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MilkProductionScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const isDark = colorScheme === 'dark';
    const { width, height } = useWindowDimensions();

    // Determine if we have enough space for side-by-side layout
    const isLargeScreen = width > 768;

    const [date, setDate] = useState(() => {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    });
    const [separationMilk, setSeparationMilk] = useState('');
    const [cowSep, setCowSep] = useState('');
    const [buffaloSep, setBuffaloSep] = useState('');
    const [goatSep, setGoatSep] = useState('');
    const [otherSep, setOtherSep] = useState('');
    const [skimMilk, setSkimMilk] = useState('');
    const [creamMilkInput, setCreamMilkInput] = useState('');
    const [mixedMilk, setMixedMilk] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeFocused, setActiveFocused] = useState<string | null>(null);

    // Stock Tracking
    const [availableMilk, setAvailableMilk] = useState<number | null>(null);
    const [todayCollectedMilk, setTodayCollectedMilk] = useState<number>(0);
    const [todayUsedMilk, setTodayUsedMilk] = useState<number>(0);
    const [totalCollectedMilk, setTotalCollectedMilk] = useState<number>(0);
    const [sourceTotals, setSourceTotals] = useState({ Cow: 0, Buffalo: 0, Goat: 0, Other: 0 });
    const [sourceAvailable, setSourceAvailable] = useState({ Cow: 0, Buffalo: 0, Goat: 0, Other: 0 });
    const [totalUsedMilk, setTotalUsedMilk] = useState<number>(0);
    const [isCheckingStock, setIsCheckingStock] = useState(false);
    const [inventory, setInventory] = useState({ mixedMilk: 0, skimMilk: 0, creamMilk: 0 });
    const scrollRef = useRef<ScrollView>(null);

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

    useEffect(() => {
        const fetchSummary = async () => {
            if (!user?.id) return;
            setIsCheckingStock(true);
            try {
                const res = await apiFetch(`/api/production/milk-summary?userId=${user.id}`);
                const invRes = await apiFetch(`/api/production/inventory?userId=${user.id}`);
                
                if (res.ok) {
                    const data = await res.json();
                    setAvailableMilk(data.availableMilk);
                    setTodayCollectedMilk(data.todayCollected || 0);
                    setTodayUsedMilk(data.todayUsed || 0);
                    setTotalCollectedMilk(data.totalCollected || 0);
                    setSourceTotals(data.sourceTotals || { Cow: 0, Buffalo: 0, Goat: 0, Other: 0 });
                    setSourceAvailable(data.sourceAvailable || { Cow: 0, Buffalo: 0, Goat: 0, Other: 0 });
                    setTotalUsedMilk(data.totalUsed || 0);
                }
                
                if (invRes.ok) {
                    const invData = await invRes.json();
                    setInventory({
                        mixedMilk: invData.mixedMilk || 0,
                        skimMilk: invData.skimMilk || 0,
                        creamMilk: invData.creamMilk || 0
                    });
                }
            } catch (err) {
                console.error('Failed to fetch milk summary', err);
            } finally {
                setIsCheckingStock(false);
            }
        };
        fetchSummary();
    }, [user?.id]);

    // Derived values
    const totalAvailable = sourceAvailable.Cow + sourceAvailable.Buffalo + sourceAvailable.Goat + sourceAvailable.Other;
    
    // Total separation is the sum of source-wise inputs
    const cSep = parseFloat(cowSep) || 0;
    const bSep = parseFloat(buffaloSep) || 0;
    const gSep = parseFloat(goatSep) || 0;
    const oSep = parseFloat(otherSep) || 0;
    const sepQty = cSep + bSep + gSep + oSep;
    
    const wholeMilk = Math.max(0, totalAvailable - sepQty);
    const skimQty = parseFloat(skimMilk) || 0;
    const creamQty = parseFloat(creamMilkInput) || 0;
    const mixedQty = parseFloat(mixedMilk) || 0;
    const isDivisionExceeded = (skimQty + creamQty + mixedQty) > sepQty;

    const sepPercent = totalAvailable > 0 ? Math.min((sepQty / totalAvailable) * 100, 100) : 0;
    const skimPercent = sepQty > 0 ? Math.min((skimQty / sepQty) * 100, 100) : 0;
    const creamPercent = sepQty > 0 ? Math.min((creamQty / sepQty) * 100, 100) : 0;
    const mixedPercent = sepQty > 0 ? Math.min((mixedQty / sepQty) * 100, 100) : 0;

    const handleSave = async () => {
        if (!date || sepQty === 0 || skimMilk === '' || creamMilkInput === '' || mixedMilk === '') {
            Alert.alert('Missing Fields', 'Please enter Separation (Cow, Buffalo, etc.), Skim, Cream, and Mixed quantities.');
            return;
        }
        if (cSep > sourceAvailable.Cow) {
            Alert.alert('Error', `Cow separation cannot exceed available Cow milk (${sourceAvailable.Cow.toFixed(3)}L)`);
            return;
        }
        if (bSep > sourceAvailable.Buffalo) {
            Alert.alert('Error', `Buffalo separation cannot exceed available Buffalo milk (${sourceAvailable.Buffalo.toFixed(3)}L)`);
            return;
        }
        if (gSep > sourceAvailable.Goat) {
            Alert.alert('Error', `Goat separation cannot exceed available Goat milk (${sourceAvailable.Goat.toFixed(3)}L)`);
            return;
        }
        if (oSep > sourceAvailable.Other) {
            Alert.alert('Error', `Other separation cannot exceed available Other milk (${sourceAvailable.Other.toFixed(3)}L)`);
            return;
        }
        if (isDivisionExceeded) {
            Alert.alert('Error', 'The sum of Skim, Cream, and Mixed cannot exceed separated milk quantity.');
            return;
        }

        const [dd, mm, yyyy] = date.split('-').map(Number);
        const prodDate = new Date(Date.UTC(yyyy, mm - 1, dd));

        setIsLoading(true);
        try {
            const response = await apiFetch('/api/production/separation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    date: prodDate.toISOString(),
                    totalMilk: totalAvailable,
                    separationMilk: sepQty,
                    sourceSeparation: {
                        cow: cSep,
                        buffalo: bSep,
                        goat: gSep,
                        other: oSep,
                    },
                    wholeMilk,
                    skimMilk: skimQty,
                    creamMilk: creamQty,
                    mixedMilk: mixedQty,
                }),
            });

            if (response.ok) {
                if (Platform.OS === 'web') {
                    alert('Success: Separation record saved!');
                } else {
                    Alert.alert('Success', 'Separation record saved!');
                }
                router.back();
            } else {
                const data = await response.json();
                Alert.alert('Error', data.message || 'Failed to save record.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'A network error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputBorderColor = (field: string) =>
        activeFocused === field ? theme.primary : (isDark ? '#2D3748' : '#E5E7EB');

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0B1220' : '#F0FDF4' }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ─── Premium Centered Header ─── */}
            <View style={[styles.topBar, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderBottomColor: isDark ? '#1F2937' : '#DCFCE7' }]}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={22} color={isDark ? '#F8FAFC' : '#1E293B'} />
                </TouchableOpacity>
                
                <View style={styles.topBarCenter}>
                    <ThemedText style={[styles.topBarTitle, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                        Milk Separation
                    </ThemedText>
                    <ThemedText style={[styles.topBarSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        Separation & Processing
                    </ThemedText>
                </View>

                <View style={[styles.headerIconBox, { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' }]}>
                    <Ionicons name="flask" size={20} color={isDark ? '#34D399' : '#16A34A'} />
                </View>
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* ScrollView kept for small screens, but behaves like a view on large screens to avoid scrolling */}
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[styles.scrollContent, isLargeScreen && { height: height - 70, justifyContent: 'center' }]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={[styles.innerContainer, isLargeScreen && { maxWidth: 1100 }]}>
                        
                        {/* ─── Top Row: Banner & Date ─── */}
                        <View style={[styles.rowConfig, isLargeScreen ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>
                            
                            {/* Stock Banner */}
                            <View style={[styles.bannerCard, isLargeScreen && { flex: 2, marginBottom: 0 }]}>
                                <LinearGradient
                                    colors={isDark ? ['#14532D', '#166534'] : ['#16A34A', '#22C55E']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFillObject}
                                />
                                <View style={styles.decoCircle1} />
                                <View style={styles.bannerContent}>
                                    <View style={styles.bannerTop}>
                                        <Ionicons name="water" size={16} color="rgba(255,255,255,0.85)" />
                                        <ThemedText style={styles.bannerLabel}>Current Milk Stock</ThemedText>
                                    </View>

                                    {isCheckingStock ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 4 }} />
                                    ) : (
                                        <View style={styles.bannerStatsRow}>
                                            <View style={styles.bannerStatItem}>
                                                <ThemedText style={[styles.bannerStatValue, { fontSize: 22, color: '#fff' }]}>{totalCollectedMilk.toFixed(1)} L</ThemedText>
                                                <ThemedText style={styles.bannerStatLabel}>Total Received</ThemedText>
                                            </View>
                                            <View style={styles.bannerDividerCompact} />
                                            <View style={styles.bannerStatItem}>
                                                <ThemedText style={[styles.bannerStatValue, { fontSize: 22, color: '#fff' }]}>{totalAvailable.toFixed(1)} L</ThemedText>
                                                <ThemedText style={styles.bannerStatLabel}>Available Milk</ThemedText>
                                            </View>
                                            <View style={styles.bannerDividerCompact} />
                                            <View style={styles.bannerStatItem}>
                                                <ThemedText style={[styles.bannerStatValue, { fontSize: 22, color: '#fff' }]}>{totalUsedMilk.toFixed(1)} L</ThemedText>
                                                <ThemedText style={styles.bannerStatLabel}>Total Used</ThemedText>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Date Selector */}
                            <View style={[
                                styles.section, 
                                isLargeScreen && { flex: 1, marginBottom: 0 }, 
                                { justifyContent: 'center', backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1F2937' : '#E9FBF0' }
                            ]}>
                                <View style={[styles.sectionTitleRowCompact, { marginBottom: 0, alignItems: 'center' }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}>
                                        <View style={[styles.sectionIconBoxCompact, { backgroundColor: isDark ? '#1F2937' : '#DCFCE7' }]}>
                                            <Ionicons name="calendar" size={14} color={isDark ? '#34D399' : '#16A34A'} />
                                        </View>
                                        <ThemedText style={[styles.sectionTitleCompact, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                                            Date
                                        </ThemedText>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <DatePicker
                                            value={date}
                                            onChange={setDate}
                                            format="DD-MM-YYYY"
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* ─── Main Row: Step 1 & Step 2 ─── */}
                        <View style={[styles.rowConfig, isLargeScreen ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>
                            
                            {/* Step 1 */}
                            <View style={[
                                styles.section, 
                                isLargeScreen && { flex: 1 },
                                { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1F2937' : '#E9FBF0' }
                            ]}>
                                <View style={styles.stepHeaderCompact}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <ThemedText style={[styles.sectionTitleCompact, { color: isDark ? '#F8FAFC' : '#111827', marginRight: 6 }]}>Milk Separation</ThemedText>
                                        <ThemedText style={[styles.stepSubtitleCompact, { color: isDark ? '#64748B' : '#9CA3AF', marginTop: 0 }]}>
                                            (Input separation quantity)
                                        </ThemedText>
                                    </View>
                                </View>

                                {/* Source-wise input boxes */}
                                <View style={styles.sourceSepGrid}>
                                    {[
                                        { label: 'Cow', value: cowSep, setter: setCowSep, avail: sourceAvailable.Cow, color: '#16A34A', key: 'cow' },
                                        { label: 'Buff.', value: buffaloSep, setter: setBuffaloSep, avail: sourceAvailable.Buffalo, color: '#059669', key: 'buff' },
                                        { label: 'Goat', value: goatSep, setter: setGoatSep, avail: sourceAvailable.Goat, color: '#0D9488', key: 'goat' },
                                        { label: 'Other', value: otherSep, setter: setOtherSep, avail: sourceAvailable.Other, color: '#0891B2', key: 'other' },
                                    ].map((item) => {
                                        const currentInput = parseFloat(item.value) || 0;
                                        const isExceeded = currentInput > item.avail;
                                        const remaining = Math.max(0, item.avail - currentInput);
                                        return (
                                            <View key={item.key} style={styles.sourceSepItem}>
                                                <ThemedText style={[styles.sourceAvailLabel, { color: isExceeded ? '#EF4444' : (isDark ? '#94A3B8' : '#64748B') }]}>
                                                    Avail: {remaining.toFixed(3)}L
                                                </ThemedText>
                                                <ThemedText style={[styles.sourceBoxTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{item.label}</ThemedText>
                                                <View style={[styles.sourceInputBox, { 
                                                    borderColor: isExceeded ? '#EF4444' : (activeFocused === item.key ? item.color : (isDark ? '#2D3748' : '#E5E7EB')),
                                                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                                    borderWidth: activeFocused === item.key || isExceeded ? 2 : 1
                                                }]}>
                                                    <TextInput
                                                        style={[styles.sourceInputText, { color: isDark ? '#F8FAFC' : '#111827' }]}
                                                        value={item.value}
                                                        onChangeText={(val) => {
                                                            item.setter(val);
                                                        }}
                                                        keyboardType="numeric"
                                                        placeholder="0"
                                                        placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
                                                        onFocus={() => {
                                                            setActiveFocused(item.key);
                                                            scrollRef.current?.scrollTo({ y: 150, animated: true });
                                                        }}
                                                        onBlur={() => {
                                                            setActiveFocused(null);
                                                            const num = parseFloat(item.value) || 0;
                                                            if (num > item.avail) {
                                                                if (Platform.OS === 'web') {
                                                                    alert(`Warning: ${item.label} exceeds available milk (${item.avail.toFixed(3)}L)!`);
                                                                } else {
                                                                    Alert.alert('Warning', `${item.label} exceeds available milk (${item.avail.toFixed(3)}L)!`);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>

                                <View style={[styles.resultRowCompact, { backgroundColor: isDark ? '#0F172A' : '#F0FDF4', borderColor: isDark ? '#166534' : '#BBF7D0', marginTop: 12 }]}>
                                    <View style={styles.resultLeftCompact}>
                                        <ThemedText style={[styles.resultTagCompact, { color: isDark ? '#4ADE80' : '#16A34A' }]}>TOTAL SEPARATION:</ThemedText>
                                    </View>
                                    <ThemedText style={[styles.resultBigValueCompact, { color: isDark ? '#4ADE80' : '#16A34A' }]}>
                                        {sepQty.toFixed(3)} L
                                    </ThemedText>
                                </View>

                                <View style={[styles.resultRowCompact, { backgroundColor: isDark ? '#0F172A' : '#F0FDF4', borderColor: isDark ? '#166534' : '#BBF7D0', marginTop: 8 }]}>
                                    <View style={styles.resultLeftCompact}>
                                        <ThemedText style={[styles.resultTagCompact, { color: isDark ? '#4ADE80' : '#16A34A' }]}>WHOLE MILK LEFT:</ThemedText>
                                    </View>
                                    <ThemedText style={[styles.resultBigValueCompact, { color: isDark ? '#4ADE80' : '#16A34A' }]}>
                                        {wholeMilk.toFixed(3)} L
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Arrow icon shown only on Large Screen */}
                            {isLargeScreen && (
                                <View style={styles.flowArrowInline}>
                                    <Ionicons name="arrow-forward" size={24} color={isDark ? '#34D399' : '#86EFAC'} />
                                </View>
                            )}

                            <View style={[
                                styles.section, 
                                isLargeScreen && { flex: 1.2 },
                                { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1F2937' : '#E9FBF0' }
                            ]}>
                                <View style={styles.stepHeaderCompact}>
                                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                                            <ThemedText style={[styles.sectionTitleCompact, { color: isDark ? '#F8FAFC' : '#111827', marginRight: 6 }]}>Division</ThemedText>
                                            <ThemedText style={[styles.stepSubtitleCompact, { color: isDark ? '#64748B' : '#9CA3AF', marginTop: 0 }]}>
                                                (Allocate outputs)
                                            </ThemedText>
                                        </View>
                                        <ThemedText style={[styles.infoChipTextCompact, { color: isDivisionExceeded ? '#EF4444' : (isDark ? '#60A5FA' : '#3B82F6') }]}>
                                            Total: {sepQty.toFixed(3)} L
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.resultGridCompact}>
                                    {[
                                        { label: 'Mixed', value: mixedMilk, setter: setMixedMilk, color: '#16A34A', key: 'mixed' },
                                        { label: 'Skim', value: skimMilk, setter: setSkimMilk, color: '#3B82F6', key: 'skim' },
                                        { label: 'Cream', value: creamMilkInput, setter: setCreamMilkInput, color: '#F59E0B', key: 'cream' },
                                    ].map((item) => (
                                        <View key={item.key} style={styles.sourceSepItem}>
                                            <ThemedText style={[styles.sourceBoxTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{item.label}</ThemedText>
                                            <View style={[styles.sourceInputBox, { 
                                                borderColor: isDivisionExceeded ? '#EF4444' : (activeFocused === item.key ? item.color : (isDark ? '#2D3748' : '#E5E7EB')),
                                                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                                borderWidth: activeFocused === item.key || isDivisionExceeded ? 2 : 1
                                            }]}>
                                                <TextInput
                                                    style={[styles.sourceInputText, { color: isDark ? '#F8FAFC' : '#111827' }]}
                                                    value={item.value}
                                                    onChangeText={item.setter}
                                                    keyboardType="numeric"
                                                    placeholder="0.00"
                                                    placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
                                                    onFocus={() => {
                                                        setActiveFocused(item.key);
                                                        scrollRef.current?.scrollToEnd({ animated: true });
                                                    }}
                                                    onBlur={() => setActiveFocused(null)}
                                                />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* ─── Bottom Row: Summary & Action ─── */}
                        <View style={[styles.rowConfig, isLargeScreen ? { flexDirection: 'row', alignItems: 'stretch' } : { flexDirection: 'column' }]}>
                            {/* Summary Box */}
                            <View style={[
                                styles.summaryStripCompact, 
                                isLargeScreen ? { flex: 2, marginBottom: 0 } : { marginBottom: 4 },
                                { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1F2937' : '#E9FBF0' }
                            ]}>
                                <View style={styles.summaryStripGridCompact}>
                                    {[
                                        { label: 'Avail', value: `${totalAvailable.toFixed(3)}L`, color: '#22C55E' },
                                        { label: 'Left', value: `${wholeMilk.toFixed(3)}L`, color: '#16A34A' },
                                        { label: 'Cream', value: `${(inventory.creamMilk + creamQty).toFixed(3)}L`, color: '#F59E0B' },
                                        { label: 'Skim', value: `${(inventory.skimMilk + skimQty).toFixed(3)}L`, color: '#60A5FA' },
                                        { label: 'Mixed', value: `${(inventory.mixedMilk + mixedQty).toFixed(3)}L`, color: '#10B981' },
                                    ].map((item, idx) => (
                                        <View key={idx} style={styles.summaryStripItemCompact}>
                                            <ThemedText style={[styles.summaryStripValueCompact, { color: item.color }]}>{item.value}</ThemedText>
                                            <ThemedText style={[styles.summaryStripLabelCompact, { color: isDark ? '#64748B' : '#9CA3AF' }]}>{item.label}</ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={[isLargeScreen ? { flex: 1, marginLeft: 12 } : { width: '100%', marginTop: 8 }, { gap: 10 }]}>
                                {/* Complete Production Button */}
                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={isLoading}
                                    activeOpacity={0.85}
                                    style={styles.saveButtonWrapCompact}
                                >
                                    <LinearGradient
                                        colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#16A34A', '#22C55E']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.saveButtonCompact}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                                <ThemedText style={styles.saveButtonTextCompact}>Complete Separation</ThemedText>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* <TouchableOpacity
                                    onPress={() => router.push('/production/make-products')}
                                    activeOpacity={0.85}
                                    style={styles.saveButtonWrapCompact}
                                >
                                    <LinearGradient
                                        colors={['#3B82F6', '#2563EB']} // Blue shade for distinction
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.saveButtonCompact}
                                    >
                                        <ThemedText style={styles.saveButtonTextCompact}>Make Products</ThemedText>
                                    </LinearGradient>
                                </TouchableOpacity> */}
                            </View>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },

    // ── Header (Compact)
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        height: 64,
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    topBarCenter: { 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    topBarTitle: { 
        fontSize: 18, 
        fontWeight: '800', 
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    topBarSub: { 
        fontSize: 12, 
        fontWeight: '600',
        textAlign: 'center',
        marginTop: -2,
    },
    headerIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Layout
    scrollContent: { paddingBottom: 60 },
    innerContainer: {
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingTop: 8,
        gap: 8,
    },
    rowConfig: {
        gap: 8,
    },

    // ── Banner (Compact)
    bannerCard: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        position: 'relative',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        marginBottom: 8,
    },
    decoCircle1: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: -30,
        right: -20,
    },
    bannerContent: { zIndex: 1 },
    bannerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    bannerLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    bannerStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bannerStatItem: { alignItems: 'center', flex: 1 },
    bannerStatValue: { color: 'rgba(255,255,255,1)', fontSize: 22, fontWeight: '800' },
    bannerStatLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11.5, fontWeight: '800', marginTop: 2 },
    sourceBreakdownRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 6,
        paddingHorizontal: 4,
        justifyContent: 'center',
    },
    sourceText: {
        fontSize: 10.5,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.85)',
        textTransform: 'uppercase',
    },
    bannerDividerCompact: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },

    // ── Section Cards (Compact)
    section: {
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        marginBottom: 8,
        justifyContent: 'center',
    },
    sectionTitleRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    sectionIconBoxCompact: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    sectionTitleCompact: { fontSize: 14, fontWeight: '700' },
    
    // ── Step Headers
    stepHeaderCompact: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    stepBadgeCompact: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    stepBadgeTextCompact: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    stepSubtitleCompact: { fontSize: 11, fontWeight: '500' },
    infoChipTextCompact: { fontSize: 11, fontWeight: '700' },

    // ── Inputs (Compact)
    inputGroupCompact: { marginBottom: 6 },
    inputContainerCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
    },
    textInputCompact: { 
        flex: 1, 
        fontSize: 15, 
        fontWeight: '600',
        padding: 0,
        textAlignVertical: 'center',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as any
    },
    inputUnitCompact: { 
        fontSize: 13, 
        fontWeight: '900', 
        marginLeft: 8, 
        paddingLeft: 8, 
        borderLeftWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        minWidth: 28,
        textAlign: 'center'
    },

    // ── Source Sep Grid
    sourceSepGrid: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 4,
    },
    sourceSepItem: {
        flex: 1,
        marginBottom: 8,
    },
    sourceBoxTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 4,
    },
    sourceAvailLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 2,
    },
    sourceInputBox: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    sourceInputText: {
        fontSize: 16,
        fontWeight: '700',
        padding: 0,
        textAlignVertical: 'center',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as any
    },

    // ── Inline Flow Arrow
    flowArrowInline: { alignItems: 'center', justifyContent: 'center', width: 40 },

    // ── Results (Compact)
    resultRowCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
    },
    resultLeftCompact: { flexDirection: 'row', alignItems: 'center' },
    resultTagCompact: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    resultBigValueCompact: { fontSize: 16, fontWeight: '800' },
    
    resultGridCompact: { flexDirection: 'row', gap: 8 },

    // ── Summary Strip (Compact)
    summaryStripCompact: {
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        justifyContent: 'center',
        marginBottom: 8,
    },
    summaryStripGridCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryStripItemCompact: { alignItems: 'center' },
    summaryStripValueCompact: { fontSize: 15, fontWeight: '800' },
    summaryStripLabelCompact: { fontSize: 10, fontWeight: '600' },

    // ── Save Button (Compact)
    saveButtonWrapCompact: { borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    saveButtonCompact: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    saveButtonTextCompact: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
