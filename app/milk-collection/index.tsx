import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
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
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [shift, setShift] = useState('Morning');
  const [source, setSource] = useState('Cow');
  const [customSource, setCustomSource] = useState('');
  const [fatType, setFatType] = useState('');
  const [snf, setSnf] = useState('');
  const [clr, setClr] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPerLiter, setCostPerLiter] = useState('');
  const [totalCost, setTotalCost] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const handleSave = async () => {
    if (!supplier || !quantity || !costPerLiter || (source === 'Other' && !customSource) || !fatType || !date || !time) {
      Alert.alert('Missing Fields', 'Please fill in all mandatory fields.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/milk/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'static-user-id',
          supplier,
          date: new Date(`${date}T${time}:00`).toISOString(),
          shift,
          source,
          customSource: source === 'Other' ? customSource : undefined,
          fatType,
          snf: snf ? parseFloat(snf) : undefined,
          clr: clr ? parseFloat(clr) : undefined,
          quantity: parseFloat(quantity),
          costPerLiter: parseFloat(costPerLiter),
          totalCost: parseFloat(totalCost),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Milk entry saved successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to save entry.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred.');
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          overScrollMode="always"
        >
          {/* ────────── Header ────────── */}
          {/* <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Milk Entry</Text>
            <TouchableOpacity style={styles.ledgerButton} onPress={() => router.push('/milk-collection/history')}>
              <Text style={styles.ledgerText}>Ledger</Text>
            </TouchableOpacity>
          </View> */}
          <Text style={styles.headerSubtitle}>Recording for: {todayFormatted}</Text>

          {/* ────────── Animated Form ────────── */}
          <Animated.View style={formAnimStyle}>

            {/* ═══ Section 1: Supplier Info ═══ */}
            <View style={styles.sectionCard}>
              <SectionTitle title="Supplier Information" />

              <Text style={styles.label}>Supplier Name / ID *</Text>
              <TextInput
                style={inputStyle('supplier')}
                placeholder="Enter farmer name or ID"
                placeholderTextColor="#9CA3AF"
                value={supplier}
                onChangeText={setSupplier}
                onFocus={() => setFocusedField('supplier')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* ═══ Section 2: Date, Time & Shift ═══ */}
            <View style={styles.sectionCard}>
              <SectionTitle title="Schedule" />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={inputStyle('date')}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setFocusedField('date')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Time</Text>
                  <TextInput
                    style={inputStyle('time')}
                    value={time}
                    onChangeText={setTime}
                    placeholder="HH:MM"
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setFocusedField('time')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <Text style={styles.label}>Shift</Text>
              <View style={styles.pillRow}>
                {SHIFTS.map((s) => (
                  <PillButton key={s} label={s} selected={shift === s} onPress={() => setShift(s)} />
                ))}
              </View>
            </View>

            {/* ═══ Section 3: Milk Source ═══ */}
            <View style={styles.sectionCard}>
              <SectionTitle title="Milk Source" />

              <View style={styles.pillRow}>
                {MILK_SOURCES.map((s) => (
                  <PillButton key={s} label={s} selected={source === s} onPress={() => setSource(s)} />
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
                    onFocus={() => setFocusedField('customSource')}
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
                  <Text style={styles.label}>Fat (%) *</Text>
                  <TextInput
                    style={inputStyle('fat')}
                    placeholder="e.g. 4.5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={fatType}
                    onChangeText={setFatType}
                    onFocus={() => setFocusedField('fat')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>SNF (%)</Text>
                  <TextInput
                    style={inputStyle('snf')}
                    placeholder="e.g. 8.5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={snf}
                    onChangeText={setSnf}
                    onFocus={() => setFocusedField('snf')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>CLR</Text>
                  <TextInput
                    style={inputStyle('clr')}
                    placeholder="e.g. 28"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={clr}
                    onChangeText={setClr}
                    onFocus={() => setFocusedField('clr')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Quantity (L)</Text>
                  <TextInput
                    style={inputStyle('quantity')}
                    placeholder="0.0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                    onFocus={() => setFocusedField('quantity')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
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
                onFocus={() => setFocusedField('cost')}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  ledgerButton: {
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ledgerText: {
    color: '#22C55E',
    fontWeight: '600',
    fontSize: 14,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    marginTop: 2,
  },

  // ── Section Cards ──
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
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
    marginBottom: 14,
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
    marginBottom: 6,
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
  textInputFocused: {
    borderColor: '#22C55E',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfField: {
    flex: 1,
  },

  // ── Pills ──
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
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
    padding: 16,
    marginTop: 16,
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
});