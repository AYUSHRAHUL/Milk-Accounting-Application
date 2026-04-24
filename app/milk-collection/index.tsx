import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { router, Stack } from 'expo-router';
import { DatePicker } from '@/components/ui/DatePicker';
import { getCLRCorrection } from '@/lib/milkCalculations';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    FlatList,
    Animated as RNAnimated,
} from 'react-native';
import { ScrollView as GHScrollView, FlatList as GHFlatList } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const MILK_SOURCES = ['Cow', 'Buffalo', 'Goat', 'Other'];
const SHIFTS = ['Morning', 'Evening'];
const MBRT_OPTIONS = ['Very good', 'Fair', 'Poor', 'very Poor'];
const COB_OPTIONS = ['Negative', 'Positive'];

// ─── Source Card ──────────────────────────────────────────────────
function SourceCard({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedTouchable
      style={[
        styles.sourceCard,
        selected ? styles.sourceCardSelected : styles.sourceCardUnselected,
        animStyle
      ]}
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 100 }); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      activeOpacity={1}
    >
      <Text style={[styles.sourceLabel, selected ? styles.sourceLabelSelected : styles.sourceLabelUnselected]}>
        {label}
      </Text>
    </AnimatedTouchable>
  );
}

// ─── Pill Button ─────────────────────────────────────────────────
function PillButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedTouchable
      style={[styles.pill, selected ? styles.pillSelected : styles.pillUnselected, animStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.96, { duration: 120 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); }}
      activeOpacity={1}
    >
      <Text style={selected ? styles.pillTextSelected : styles.pillTextUnselected}>{label}</Text>
    </AnimatedTouchable>
  );
}

// ─── Section Header ──────────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function MilkCollectionScreen() {
  const { user } = useAuth();

  const [supplier, setSupplier] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [date, setDate] = useState(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });
  const [timeHrs, setTimeHrs] = useState(() => String(new Date().getHours()).padStart(2, '0'));
  const [timeMins, setTimeMins] = useState(() => String(new Date().getMinutes()).padStart(2, '0'));
  const [shift, setShift] = useState('Morning');
  const [source, setSource] = useState('Cow');
  const [customSource, setCustomSource] = useState('');
  const [fatType, setFatType] = useState('');
  const [snf, setSnf] = useState('');
  const [clr, setClr] = useState('');
  const [lr, setLr] = useState('');
  const [temp, setTemp] = useState('');
  const [ts, setTs] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPerLiter, setCostPerLiter] = useState('');
  const [totalCost, setTotalCost] = useState('0.00');
  const [mbrt, setMbrt] = useState('');
  const [mbrtHours, setMbrtHours] = useState('');
  const [mbrtMinutes, setMbrtMinutes] = useState('');
  const [cob, setCob] = useState('');
  const [showMbrtDropdown, setShowMbrtDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSources, setAvailableSources] = useState<string[]>(MILK_SOURCES);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Supplier Search State
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);

  // Custom visual scrollbar states
  const [listContentHeight, setListContentHeight] = useState(1);
  const [listVisibleHeight, setListVisibleHeight] = useState(1);
  const scrollOffsetY = useRef(new RNAnimated.Value(0)).current;

  const showCustomScrollbar = listContentHeight > listVisibleHeight;
  const scrollIndicatorSize = Math.max((listVisibleHeight / listContentHeight) * listVisibleHeight, 30);
  const safeIndicatorSize = isNaN(scrollIndicatorSize) ? 30 : scrollIndicatorSize;

  const scrollIndicatorPosition = scrollOffsetY.interpolate({
    inputRange: [0, Math.max(1, listContentHeight - listVisibleHeight)],
    outputRange: [0, Math.max(0, listVisibleHeight - safeIndicatorSize)],
    extrapolate: 'clamp',
  });

  // Fetch Suppliers on Mount
  useEffect(() => {
    if (!user?.id) return;
    const fetchSuppliers = async () => {
      try {
        const res = await apiFetch(`/api/suppliers?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAllSuppliers(data);
          setFilteredSuppliers(data); // Initialize filtered with all
        }
      } catch (err) {
        console.error("Failed to fetch suppliers", err);
      }
    };
    fetchSuppliers();
  }, [user?.id]);

  // Filter logic
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = allSuppliers.filter(s => {
        const nameMatch = s.name?.toLowerCase().includes(query) || false;
        const idMatch = s.supplierId?.toLowerCase().includes(query) || false;
        return nameMatch || idMatch;
      });
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(allSuppliers);
      // Reset sources to default if search is cleared
      setAvailableSources(MILK_SOURCES);
    }
  }, [searchQuery, allSuppliers]);

  const selectSupplier = (s: any) => {
    if (!s) return;
    const displayName = s.name || 'Unknown';
    const displayId = s.supplierId || 'No ID';
    setSupplier(displayName);
    setSelectedSupplierId(displayId);
    setSearchQuery(`${displayName} (${displayId})`);
    
    // Dynamic Milk Sources based on Supplier settings
    if (s.animalType && Array.isArray(s.animalType) && s.animalType.length > 0) {
      setAvailableSources(s.animalType);
      setSource(s.animalType[0]); // Auto-select first one
    } else {
      setAvailableSources(MILK_SOURCES);
      setSource('Cow');
    }

    setShowDropdown(false);
    setFocusedField(null);
  };

  // Entrance animation
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(20);

  useEffect(() => {
    formOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
    formTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) });
    // Intentionally run once on mount for entrance animation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formAnimStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  // Save button animation
  const saveScale = useSharedValue(1);
  const saveAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));

  // Total cost calculation
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(costPerLiter) || 0;
    setTotalCost((qty * cost).toFixed(2));
  }, [quantity, costPerLiter]);

  // --- MBRT Auto-calculation ---
  useEffect(() => {
    const hrs = parseInt(mbrtHours) || 0;
    const mins = parseInt(mbrtMinutes) || 0;
    const totalMinutes = hrs * 60 + mins;

    if (mbrtHours === '' && mbrtMinutes === '') {
      setMbrt('');
      return;
    }

    if (totalMinutes >= 360) { // 6 hrs
      setMbrt('Very good');
    } else if (totalMinutes >= 120) { // 2 hrs to 5 hrs 59 mins
      setMbrt('Fair');
    } else if (totalMinutes >= 30) { // 30 mins to 1 hr 59 mins
      setMbrt('Poor');
    } else { // < 30 mins
      setMbrt('very Poor');
    }
  }, [mbrtHours, mbrtMinutes]);

  // CLR, SNF & TS Auto-calculation
  useEffect(() => {
    const fatVal = parseFloat(fatType) || 0;
    const tempVal = parseFloat(temp) || 0;
    const lrVal = parseFloat(lr) || 0;

    let correction = 0;
    let calculatedClr = 0;

    // 1. Get CLR from table (Correction Factor) + Add LR
    if (tempVal > 0 && lrVal > 0) {
      correction = getCLRCorrection(tempVal, fatVal);
      calculatedClr = lrVal + correction;
      setClr(calculatedClr.toFixed(1));
    } else {
      setClr('');
      setSnf('');
      setTs('');
      return;
    }

    // 2. Calculate SNF & TS using the combined CLR value
    // Formula: (CLR / 4) + (0.25 * Fat) + 0.44
    const calculatedSnf = (calculatedClr / 4) + (0.25 * fatVal) + 0.44;
    setSnf(calculatedSnf.toFixed(3));

    // TS = SNF + Fat
    const calculatedTs = calculatedSnf + fatVal;
    setTs(calculatedTs.toFixed(3));
  }, [fatType, temp, lr]);

  const handleSave = async () => {
    if (!supplier || !quantity || !costPerLiter || (source === 'Other' && !customSource) || !date || !timeHrs || !timeMins) {
      Alert.alert('Missing Fields', 'Please fill in all mandatory fields.');
      return;
    }

    if (cob === 'Positive') {
      const msg = 'Milk with Positive COB (Clot on Boiling) is disqualified and cannot be recorded.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Quality Rejected', msg);
      return;
    }

    setIsLoading(true);
    try {
      const [dd, mm, yyyy] = date.split('-').map(Number);
      const hr = parseInt(timeHrs);
      const min = parseInt(timeMins);
      const collectionDate = new Date(yyyy, mm - 1, dd, hr, min);

      const response = await apiFetch('/api/milk/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          supplier,
          supplierId: selectedSupplierId,
          date: collectionDate.toISOString(),
          shift,
          source,
          customSource: source === 'Other' ? customSource : undefined,
          fatType,
          snf: snf ? parseFloat(snf) : undefined,
          clr: clr ? parseFloat(clr) : undefined,
          lr: lr ? parseFloat(lr) : undefined,
          temp: temp ? parseFloat(temp) : undefined,
          ts: ts ? parseFloat(ts) : undefined,
          quantity: parseFloat(quantity),
          costPerLiter: parseFloat(costPerLiter),
          totalCost: parseFloat(totalCost),
          mbrt: mbrt || undefined,
          mbrtTime: (mbrtHours || mbrtMinutes) ? `${mbrtHours.padStart(2, '0')}:${mbrtMinutes.padStart(2, '0')}` : undefined,
          cob: cob || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        if (Platform.OS === 'web') {
          alert('Success: Your data has been saved!');
          router.back();
        } else {
          Alert.alert('Success', 'Your data has been saved!', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      } else {
        const errorMsg = data.message || 'Failed to save entry.';
        if (Platform.OS === 'web') alert('Error: ' + errorMsg);
        else Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      console.error(error);
      const errorMsg = 'An unexpected error occurred.';
      if (Platform.OS === 'web') alert('Error: ' + errorMsg);
      else Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const inputStyle = (fieldKey: string) => [
    styles.textInput,
    focusedField === fieldKey && styles.textInputFocused,
    Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* ────────── Header ────────── */}
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
              <Ionicons name="arrow-back" size={24} color="#22C55E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Milk Entry</Text>
          <View style={{ width: 36 }} />
      </View>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          overScrollMode="always"
          nestedScrollEnabled={true}
        >
          <Text style={styles.headerSubtitle}>Recording for: {todayFormatted}</Text>

          {/* ────────── Animated Form ────────── */}
          <Animated.View style={formAnimStyle}>

            {/* ═══ Section 1: Supplier & Search ═══ */}
            <View style={styles.searchSectionCard}>
              <View style={styles.searchRow}>
                <TouchableOpacity 
                  style={styles.selectFarmerContainer}
                  onPress={() => {
                    if (allSuppliers.length > 0) {
                      setFilteredSuppliers(allSuppliers);
                      setShowDropdown(!showDropdown);
                    }
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.selectFarmerText}>Select Suppliers</Text>
                  <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={18} color="#4B5563" />
                </TouchableOpacity>

                <View style={styles.searchInputContainer}>
                  <View style={[
                    styles.searchInputWrapper,
                    focusedField === 'supplier' && styles.textInputFocused
                  ]}>
                    <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.textInputMain, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                      placeholder="Search..."
                      placeholderTextColor="#9CA3AF"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onFocus={() => {
                        setFocusedField('supplier');
                        if (filteredSuppliers.length > 0) setShowDropdown(true);
                        scrollRef.current?.scrollTo({ y: 0, animated: true });
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowDropdown(false);
                          setFocusedField(null);
                        }, 200);
                      }}
                    />
                  </View>
                </View>
              </View>

              {showDropdown && (
                <View style={styles.dropdown}>
                  <RNAnimated.FlatList
                    data={filteredSuppliers}
                    keyExtractor={(item: any) => item._id}
                    style={{ maxHeight: 250 }}
                    contentContainerStyle={{ flexGrow: 1, paddingRight: showCustomScrollbar ? 14 : 0 }}
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={(_w, h) => setListContentHeight(h)}
                    onLayout={(e) => setListVisibleHeight(e.nativeEvent.layout.height)}
                    onScroll={RNAnimated.event(
                      [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
                      { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    renderItem={({ item: s }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => selectSupplier(s)}
                      >
                        <View style={styles.dropdownItemLeft}>
                          <View style={styles.avatarMini}>
                            <Text style={styles.avatarText}>{s.name?.charAt(0).toUpperCase() || '?'}</Text>
                          </View>
                          <View style={styles.dropdownInfoRow}>
                            <Text style={styles.dropdownItemName}>{s.name}</Text>
                            <Text style={styles.dropdownItemSeparator}>•</Text>
                            <Text style={styles.dropdownItemId}>ID: {s.supplierId}</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#E5E7EB" />
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: '#9CA3AF' }}>No suppliers found.</Text>
                      </View>
                    }
                  />
                  {showCustomScrollbar && (
                    <View style={styles.customScrollbarTrack}>
                      <RNAnimated.View
                        style={[
                          styles.customScrollbarThumb,
                          {
                            height: safeIndicatorSize,
                            transform: [{ translateY: scrollIndicatorPosition }]
                          }
                        ]}
                      />
                    </View>
                  )}
                </View>
              )}


              
              {selectedSupplierId && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#22C55E" style={{ marginRight: 6 }} />
                  <Text style={styles.selectedBadgeText}>Selected: {supplier} ({selectedSupplierId})</Text>
                </View>
              )}
            </View>

            {/* ═══ Section 2: Date, Time & Shift ═══ */}
            <View style={styles.sectionCard}>
              <SectionTitle title="Schedule" />

              <View style={styles.scheduleRow}>
                {/* Date */}
                <View style={styles.scheduleColDate}>
                  <Text style={styles.miniLabel}>Date</Text>
                  <DatePicker
                    value={date}
                    onChange={setDate}
                    format="DD-MM-YYYY"
                  />
                </View>

                {/* Time */}
                <View style={styles.scheduleColTime}>
                  <Text style={styles.miniLabel}>Time</Text>
                  <View style={styles.timeInputRow}>
                    <TextInput
                      style={[
                        styles.timeInputCompact,
                        focusedField === 'timeHrs' && styles.timeInputFocused,
                        Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                      ]}
                      value={timeHrs}
                      onChangeText={(t) => {
                        const val = t.replace(/[^0-9]/g, '');
                        if (val.length <= 2) setTimeHrs(val);
                      }}
                      placeholder="00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={2}
                      onFocus={() => setFocusedField('timeHrs')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <Text style={styles.timeColonCompact}>:</Text>
                    <TextInput
                      style={[
                        styles.timeInputCompact,
                        focusedField === 'timeMins' && styles.timeInputFocused,
                        Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                      ]}
                      value={timeMins}
                      onChangeText={(t) => {
                        const val = t.replace(/[^0-9]/g, '');
                        if (val.length <= 2) setTimeMins(val);
                      }}
                      placeholder="00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      maxLength={2}
                      onFocus={() => setFocusedField('timeMins')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* Shift */}
                <View style={styles.scheduleColShift}>
                  <Text style={styles.miniLabel}>Shift</Text>
                  <TouchableOpacity 
                    style={styles.shiftSelectBoxCompact}
                    onPress={() => setShift(shift === 'Morning' ? 'Evening' : 'Morning')}
                  >
                    <Text style={styles.shiftSelectTextCompact}>{shift}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ═══ Section 3: Milk Source ═══ */}
            <View style={styles.sectionCard}>
              <SectionTitle title="Milk Source" />

              <View style={styles.sourceGrid}>
                {availableSources.map((s) => (
                  <SourceCard 
                    key={s} 
                    label={s} 
                    selected={source === s} 
                    onPress={() => setSource(s)} 
                  />
                ))}
              </View>

              {source === 'Other' && (
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.label}>Custom Source Name</Text>
                  <TextInput
                    style={inputStyle('customSource')}
                    placeholder="e.g., Camel"
                    placeholderTextColor="#9CA3AF"
                    value={customSource}
                    onChangeText={setCustomSource}
                     onFocus={() => {
                      setFocusedField('customSource');
                      scrollRef.current?.scrollTo({ y: 250, animated: true });
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              )}
            </View>

            {/* ═══ Section 4: Quality Parameters ═══ */}
            <View style={styles.sectionCard}>
              <SectionTitle title="Quality Parameters" />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Quantity (L)</Text>
                  <TextInput
                    style={inputStyle('quantity')}
                    placeholder="0.0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                     onFocus={() => {
                      setFocusedField('quantity');
                      scrollRef.current?.scrollTo({ y: 350, animated: true });
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>LR</Text>
                  <TextInput
                    style={inputStyle('lr')}
                    placeholder="e.g. 28"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={lr}
                    onChangeText={setLr}
                    onFocus={() => {
                      setFocusedField('lr');
                      scrollRef.current?.scrollTo({ y: 350, animated: true });
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Temp (°C)</Text>
                  <TextInput
                    style={inputStyle('temp')}
                    placeholder="e.g. 4"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={temp}
                    onChangeText={setTemp}
                    onFocus={() => {
                      setFocusedField('temp');
                      scrollRef.current?.scrollTo({ y: 350, animated: true });
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Fat (%)</Text>
                  <TextInput
                    style={inputStyle('fat')}
                    placeholder="e.g. 4.5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={fatType}
                    onChangeText={setFatType}
                    onFocus={() => {
                      setFocusedField('fat');
                      scrollRef.current?.scrollTo({ y: 400, animated: true });
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>CLR</Text>
                  <TextInput
                    style={[styles.textInput, styles.readOnlyInput]}
                    placeholder="0.0"
                    placeholderTextColor="#9CA3AF"
                    value={clr}
                    editable={false}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>SNF (%)</Text>
                  <TextInput
                    style={[styles.textInput, styles.readOnlyInput]}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    value={snf}
                    editable={false}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>TS (%)</Text>
                  <TextInput
                    style={[styles.textInput, styles.readOnlyInput]}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    value={ts}
                    editable={false}
                  />
                </View>

                <View style={styles.halfField}>
                  <Text style={styles.label}>MBRT Time</Text>
                  <View style={styles.mbrtTimeBox}>
                    <View style={styles.mbrtCol}>
                      <Text style={styles.mbrtTimeHeaderText}>hrs</Text>
                      <TextInput
                        style={[styles.mbrtTimeInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                        placeholder="00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={mbrtHours}
                        onChangeText={(t) => setMbrtHours(t.replace(/[^0-9]/g, ''))}
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.mbrtCol}>
                      <Text style={styles.mbrtTimeHeaderText}>mins</Text>
                      <TextInput
                        style={[styles.mbrtTimeInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                        placeholder="00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={mbrtMinutes}
                        onChangeText={(t) => setMbrtMinutes(t.replace(/[^0-9]/g, ''))}
                        maxLength={2}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.halfField}>
                  <Text style={styles.label}>MBRT Status</Text>
                  <View style={[styles.textInput, styles.readOnlyInput, { justifyContent: 'center' }]}>
                    <Text style={{ color: mbrt ? '#111827' : '#9CA3AF', fontSize: 13, fontWeight: '600' }}>
                      {mbrt || '---'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>COB (Clot on Boiling)</Text>
                <TouchableOpacity 
                  style={[styles.standaloneSelectBox, { marginTop: 4 }]}
                  onPress={() => {
                    const idx = COB_OPTIONS.indexOf(cob);
                    const next = COB_OPTIONS[(idx + 1) % COB_OPTIONS.length];
                    setCob(next);
                  }}
                >
                  <Text style={styles.shiftSelectText}>{cob || '---'}</Text>
                </TouchableOpacity>
                {cob === 'Positive' && (
                  <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, fontWeight: '600' }}>
                    Warning: Positive COB milk will not be recorded.
                  </Text>
                )}
              </View>
            </View>

            {/* ═══ Section 5: Pricing ═══ */}
            <View style={styles.sectionCard}>
              <SectionTitle title="Pricing" />

              <Text style={styles.label}>Cost per Liter (₹)</Text>
              <TextInput
                style={inputStyle('cost')}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={costPerLiter}
                onChangeText={setCostPerLiter}
                 onFocus={() => {
                  setFocusedField('cost');
                  scrollRef.current?.scrollToEnd({ animated: true });
                }}
                onBlur={() => setFocusedField(null)}
              />

              {/* Total Cost Summary */}
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Cost Calculation</Text>
                <Text style={styles.totalAmount}>₹ {totalCost}</Text>
              </View>
            </View>

            {/* ────────── Action Buttons ────────── */}
            <AnimatedTouchable
              style={[styles.saveButton, saveAnimStyle]}
              onPress={handleSave}
              onPressIn={() => { saveScale.value = withTiming(0.97, { duration: 120 }); }}
              onPressOut={() => { saveScale.value = withSpring(1, { damping: 15, stiffness: 200 }); }}
              activeOpacity={1}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save Entry'}</Text>
            </AnimatedTouchable>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    paddingHorizontal: 2,
    marginTop: 0,
  },

  // ── Section Cards ──
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22C55E',
  },

  // ── Fields ──
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    color: '#111827',
    fontSize: 15,
  },
  readOnlyInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  textInputFocused: {
    borderColor: '#22C55E',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  halfField: {
    flex: 1,
  },
  // ── Inline Fields ──
  inlineFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  inlineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 50,
  },
  inlinePillRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },

  // ── Pills ──
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  pillUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#22C55E',
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  pillTextUnselected: {
    color: '#22C55E',
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Total ──
  totalCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#166534',
    marginTop: 4,
  },

  // ── Buttons ──
  saveButton: {
    backgroundColor: '#22C55E',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  // ── Source Grid Styles ──
  sourceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sourceCard: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sourceCardSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  sourceCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  sourceLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  sourceLabelSelected: {
    color: '#FFFFFF',
  },
  sourceLabelUnselected: {
    color: '#4B5563',
  },
  // New Structured Search Styles
  searchSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 100,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectFarmerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  selectFarmerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4338CA', // Purple color as in the image
  },
  searchInputContainer: {
    flex: 1,
    maxWidth: '65%',
  },
  searchContainer: {
    zIndex: 100,
    width: '100%',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  textInputMain: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    height: '100%',
  },
  dropdown: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  customScrollbarTrack: {
    position: 'absolute',
    right: 3,
    top: 3,
    bottom: 3,
    width: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  customScrollbarThumb: {
    width: '100%',
    backgroundColor: '#9CA3AF',
    borderRadius: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownItemSeparator: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#22C55E',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dropdownItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dropdownItemId: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  selectedBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  mbrtDropdown: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  mbrtTimeBox: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  mbrtCol: {
    flex: 1,
    flexDirection: 'column',
  },
  mbrtTimeHeaderText: {
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    paddingVertical: 2,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    height: '100%',
  },
  mbrtTimeInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#111827',
    padding: 0,
    margin: 0,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 60,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  timeInputFocused: {
    borderColor: '#22C55E',
    backgroundColor: '#FFFFFF',
  },
  timeColon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  shiftSelectBox: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftSelectText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
  },
  scheduleColDate: {
    flex: 1,
  },
  scheduleColTime: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleColShift: {
    flex: 1,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  timeInputCompact: {
    width: 34,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  timeColonCompact: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  shiftSelectBoxCompact: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftSelectTextCompact: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  standaloneSelectBox: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
});