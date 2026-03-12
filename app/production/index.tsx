import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
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

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [separationMilk, setSeparationMilk] = useState('');
    const [skimMilk, setSkimMilk] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeFocused, setActiveFocused] = useState<string | null>(null);

    // Stock Tracking
    const [availableMilk, setAvailableMilk] = useState<number | null>(null);
    const [totalCollectedMilk, setTotalCollectedMilk] = useState<number>(0);
    const [totalUsedMilk, setTotalUsedMilk] = useState<number>(0);
    const [isCheckingStock, setIsCheckingStock] = useState(false);

    useEffect(() => {
        const fetchSummary = async () => {
            if (!user?.id) return;
            setIsCheckingStock(true);
            try {
                const res = await apiFetch(`/api/production/milk-summary?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableMilk(data.availableMilk);
                    setTotalCollectedMilk(data.totalCollected || 0);
                    setTotalUsedMilk(data.totalUsed || 0);
                } else {
                    setAvailableMilk(0);
                    setTotalCollectedMilk(0);
                    setTotalUsedMilk(0);
                }
            } catch (err) {
                console.error('Failed to fetch milk summary', err);
                setAvailableMilk(0);
                setTotalCollectedMilk(0);
                setTotalUsedMilk(0);
            } finally {
                setIsCheckingStock(false);
            }
        };
        fetchSummary();
    }, [user?.id]);

    // Derived values
    const totalAvailable = availableMilk || 0;
    const sepQty = parseFloat(separationMilk) || 0;
    const wholeMilk = Math.max(0, totalAvailable - sepQty);
    const skimQty = parseFloat(skimMilk) || 0;
    const creamMilk = Math.max(0, sepQty - skimQty);

    const sepPercent = totalAvailable > 0 ? Math.min((sepQty / totalAvailable) * 100, 100) : 0;
    const skimPercent = sepQty > 0 ? Math.min((skimQty / sepQty) * 100, 100) : 0;
    const creamPercent = sepQty > 0 ? Math.min((creamMilk / sepQty) * 100, 100) : 0;

    const handleSave = async () => {
        if (!date || separationMilk === '' || skimMilk === '') {
            Alert.alert('Missing Fields', 'Please enter Separation Milk and Skim Milk quantities.');
            return;
        }
        if (sepQty > totalAvailable) {
            Alert.alert('Error', 'Separation Milk cannot exceed total available milk.');
            return;
        }
        if (skimQty > sepQty) {
            Alert.alert('Error', 'Skim Milk cannot exceed separated milk quantity.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiFetch('/api/production/separation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    date,
                    totalMilk: totalAvailable,
                    separationMilk: sepQty,
                    wholeMilk,
                    skimMilk: skimQty,
                    creamMilk,
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

            {/* ─── Compact Header ─── */}
            <View style={[styles.topBar, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderBottomColor: isDark ? '#1F2937' : '#E9FBF0' }]}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: isDark ? '#1F2937' : '#DCFCE7' }]}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={20} color={isDark ? '#34D399' : '#16A34A'} />
                </TouchableOpacity>
                <View style={styles.topBarCenter}>
                    <ThemedText style={[styles.topBarTitle, { color: isDark ? '#F8FAFC' : '#111827' }]}>
                        Milk Production
                    </ThemedText>
                    <ThemedText style={[styles.topBarSub, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
                        Separation & Processing
                    </ThemedText>
                </View>
                <View style={[styles.headerIconBox, { backgroundColor: isDark ? '#1F2937' : '#DCFCE7' }]}>
                    <Ionicons name="flask-outline" size={20} color={isDark ? '#34D399' : '#16A34A'} />
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {/* ScrollView kept for small screens, but behaves like a view on large screens to avoid scrolling */}
                <ScrollView
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
                                        <ThemedText style={styles.bannerLabel}>Today's Stock</ThemedText>
                                    </View>

                                    {isCheckingStock ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 4 }} />
                                    ) : (
                                        <View style={styles.bannerStatsRow}>
                                            <View style={styles.bannerStatItem}>
                                                <ThemedText style={styles.bannerStatValue}>{totalCollectedMilk.toFixed(1)}</ThemedText>
                                                <ThemedText style={styles.bannerStatLabel}>Collected</ThemedText>
                                            </View>
                                            <View style={styles.bannerDividerCompact} />
                                            <View style={styles.bannerStatItem}>
                                                <ThemedText style={[styles.bannerStatValue, { fontSize: 24, color: '#fff' }]}>{totalAvailable.toFixed(1)} ltr</ThemedText>
                                                <ThemedText style={[styles.bannerStatLabel, { color: '#fff' }]}>Available</ThemedText>
                                            </View>
                                            <View style={styles.bannerDividerCompact} />
                                            <View style={styles.bannerStatItem}>
                                                <ThemedText style={styles.bannerStatValue}>{totalUsedMilk.toFixed(1)}</ThemedText>
                                                <ThemedText style={styles.bannerStatLabel}>Used</ThemedText>
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
                                    <View style={[styles.inputContainerCompact, {
                                        flex: 1,
                                        borderColor: inputBorderColor('date'),
                                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                    }]}>
                                        <Ionicons name="calendar-outline" size={16} color={activeFocused === 'date' ? theme.primary : (isDark ? '#4B5563' : '#9CA3AF')} style={{ marginRight: 8 }} />
                                        <TextInput
                                            style={[styles.textInputCompact, { color: isDark ? '#F8FAFC' : '#111827' }]}
                                            value={date}
                                            onChangeText={setDate}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
                                            onFocus={() => setActiveFocused('date')}
                                            onBlur={() => setActiveFocused(null)}
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

                                <View style={styles.inputGroupCompact}>
                                    <View style={[styles.inputContainerCompact, {
                                        borderColor: inputBorderColor('sep'),
                                        borderWidth: activeFocused === 'sep' ? 2 : 1,
                                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                    }]}>
                                        <Ionicons name="beaker-outline" size={16} color={activeFocused === 'sep' ? theme.primary : (isDark ? '#4B5563' : '#9CA3AF')} style={{ marginRight: 8 }} />
                                        <TextInput
                                            style={[styles.textInputCompact, { color: isDark ? '#F8FAFC' : '#111827', fontWeight: '700' }]}
                                            value={separationMilk}
                                            onChangeText={setSeparationMilk}
                                            keyboardType="numeric"
                                            placeholder="Quantity (L)"
                                            placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
                                            onFocus={() => setActiveFocused('sep')}
                                            onBlur={() => setActiveFocused(null)}
                                        />
                                        <ThemedText style={[styles.inputUnitCompact, { color: isDark ? '#64748B' : '#9CA3AF' }]}>L</ThemedText>
                                    </View>
                                </View>

                                <View style={[styles.resultRowCompact, { backgroundColor: isDark ? '#0F172A' : '#F0FDF4', borderColor: isDark ? '#166534' : '#BBF7D0' }]}>
                                    <View style={styles.resultLeftCompact}>
                                        <ThemedText style={[styles.resultTagCompact, { color: isDark ? '#4ADE80' : '#16A34A' }]}>WHOLE MILK:</ThemedText>
                                    </View>
                                    <ThemedText style={[styles.resultBigValueCompact, { color: isDark ? '#4ADE80' : '#16A34A' }]}>
                                        {wholeMilk.toFixed(2)} L
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Arrow icon shown only on Large Screen */}
                            {isLargeScreen && (
                                <View style={styles.flowArrowInline}>
                                    <Ionicons name="arrow-forward" size={24} color={isDark ? '#34D399' : '#86EFAC'} />
                                </View>
                            )}

                            {/* Step 2 */}
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
                                                (Allocate skim & cream)
                                            </ThemedText>
                                        </View>
                                        <ThemedText style={[styles.infoChipTextCompact, { color: isDark ? '#60A5FA' : '#3B82F6', marginLeft: 8 }]}>
                                            Total: {sepQty.toFixed(1)} L
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.inputGroupCompact}>
                                    <View style={[styles.inputContainerCompact, {
                                        borderColor: inputBorderColor('skim'),
                                        borderWidth: activeFocused === 'skim' ? 2 : 1,
                                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                    }]}>
                                        <Ionicons name="water" size={16} color={activeFocused === 'skim' ? '#0EA5E9' : (isDark ? '#4B5563' : '#9CA3AF')} style={{ marginRight: 8 }} />
                                        <TextInput
                                            style={[styles.textInputCompact, { color: isDark ? '#F8FAFC' : '#111827', fontWeight: '700' }]}
                                            value={skimMilk}
                                            onChangeText={setSkimMilk}
                                            keyboardType="numeric"
                                            placeholder="Skim Milk (L)"
                                            placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
                                            onFocus={() => setActiveFocused('skim')}
                                            onBlur={() => setActiveFocused(null)}
                                        />
                                        <ThemedText style={[styles.inputUnitCompact, { color: isDark ? '#64748B' : '#9CA3AF' }]}>L</ThemedText>
                                    </View>
                                </View>

                                {/* Mini Result Cards inline */}
                                <View style={styles.resultGridCompact}>
                                    <View style={[styles.resultCardCompact, { backgroundColor: isDark ? '#0C1A2E' : '#EFF6FF', borderColor: isDark ? '#1E3A5F' : '#BFDBFE' }]}>
                                        <ThemedText style={[styles.resultCardTagCompact, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>SKIM</ThemedText>
                                        <ThemedText style={[styles.resultCardValueCompact, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>{skimQty.toFixed(2)} L</ThemedText>
                                    </View>
                                    <View style={{ width: 8 }} />
                                    <View style={[styles.resultCardCompact, { backgroundColor: isDark ? '#2D1505' : '#FFFBEB', borderColor: isDark ? '#78350F' : '#FDE68A' }]}>
                                        <ThemedText style={[styles.resultCardTagCompact, { color: isDark ? '#FCD34D' : '#92400E' }]}>CREAM</ThemedText>
                                        <ThemedText style={[styles.resultCardValueCompact, { color: isDark ? '#FBBF24' : '#D97706' }]}>{creamMilk.toFixed(2)} L</ThemedText>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* ─── Bottom Row: Summary & Action ─── */}
                        <View style={[styles.rowConfig, isLargeScreen ? { flexDirection: 'row', alignItems: 'stretch' } : { flexDirection: 'column' }]}>
                            {/* Summary Box */}
                            <View style={[styles.summaryStripCompact, isLargeScreen && { flex: 2, marginBottom: 0 }, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1F2937' : '#E9FBF0' }]}>
                                <View style={styles.summaryStripGridCompact}>
                                    {[
                                        { label: 'Avail', value: `${totalAvailable.toFixed(1)}L`, color: '#22C55E' },
                                        { label: 'Sep', value: `${sepQty.toFixed(1)}L`, color: '#16A34A' },
                                        { label: 'Whole', value: `${wholeMilk.toFixed(1)}L`, color: '#4ADE80' },
                                        { label: 'Skim', value: `${skimQty.toFixed(1)}L`, color: '#60A5FA' },
                                        { label: 'Cream', value: `${creamMilk.toFixed(1)}L`, color: '#F59E0B' },
                                    ].map((item, idx) => (
                                        <View key={idx} style={styles.summaryStripItemCompact}>
                                            <ThemedText style={[styles.summaryStripValueCompact, { color: item.color }]}>{item.value}</ThemedText>
                                            <ThemedText style={[styles.summaryStripLabelCompact, { color: isDark ? '#64748B' : '#9CA3AF' }]}>{item.label}</ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Action Button */}
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isLoading}
                                activeOpacity={0.85}
                                style={[styles.saveButtonWrapCompact, isLargeScreen && { flex: 1, marginTop: 0, marginLeft: 12 }]}
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
                                            <ThemedText style={styles.saveButtonTextCompact}>Complete</ThemedText>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        gap: 12,
        height: 56,
    },
    backBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topBarCenter: { flex: 1 },
    topBarTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
    topBarSub: { fontSize: 11, fontWeight: '500' },
    headerIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Layout
    scrollContent: { paddingBottom: 20 },
    innerContainer: {
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingTop: 12,
        gap: 12,
    },
    rowConfig: {
        gap: 12,
    },

    // ── Banner (Compact)
    bannerCard: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        position: 'relative',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        marginBottom: 12,
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
    bannerStatValue: { color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: '800' },
    bannerStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', marginTop: 2 },
    bannerDividerCompact: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },

    // ── Section Cards (Compact)
    section: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        marginBottom: 12,
        justifyContent: 'center',
    },
    sectionTitleRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    sectionIconBoxCompact: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    sectionTitleCompact: { fontSize: 14, fontWeight: '700' },
    
    // ── Step Headers
    stepHeaderCompact: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    stepBadgeCompact: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    stepBadgeTextCompact: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    stepSubtitleCompact: { fontSize: 11, fontWeight: '500' },
    infoChipTextCompact: { fontSize: 11, fontWeight: '700' },

    // ── Inputs (Compact)
    inputGroupCompact: { marginBottom: 10 },
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
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as any
    },
    inputUnitCompact: { fontSize: 12, fontWeight: '600', marginLeft: 4 },

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
    
    resultGridCompact: { flexDirection: 'row' },
    resultCardCompact: {
        flex: 1,
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        flexDirection: 'column',
    },
    resultCardTagCompact: { fontSize: 10, fontWeight: '800', paddingBottom: 2 },
    resultCardValueCompact: { fontSize: 16, fontWeight: '800' },

    // ── Summary Strip (Compact)
    summaryStripCompact: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        justifyContent: 'center',
        marginBottom: 12,
    },
    summaryStripGridCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryStripItemCompact: { alignItems: 'center' },
    summaryStripValueCompact: { fontSize: 15, fontWeight: '800' },
    summaryStripLabelCompact: { fontSize: 10, fontWeight: '600' },

    // ── Save Button (Compact)
    saveButtonWrapCompact: { borderRadius: 16, overflow: 'hidden', elevation: 4 },
    saveButtonCompact: { height: '100%', minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    saveButtonTextCompact: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
