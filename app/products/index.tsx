import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRODUCT_TYPES = ['Paneer', 'Ghee', 'Butter', 'Curd', 'Other'];
const MILK_SOURCES = ['Cow', 'Buffalo', 'Goat', 'Other'];
const FAT_TYPES = ['Whole', 'Reduced', 'Low-fat', 'Skim'];

export default function ProductionScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [productType, setProductType] = useState('Paneer');
    const [source, setSource] = useState('Cow');
    const [fatType, setFatType] = useState('Whole');
    const [milkUsed, setMilkUsed] = useState('');
    const [quantityProduced, setQuantityProduced] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Live Stock Tracking
    const [availableStock, setAvailableStock] = useState<number | null>(null);
    const [isCheckingStock, setIsCheckingStock] = useState(false);

    useEffect(() => {
        const checkStock = async () => {
            if (!user?.id) return;
            setIsCheckingStock(true);
            try {
                // We now aggregate by source and userId only to match Milk Collection data
                const res = await fetch(`/api/products/production?source=${source}&userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableStock(data.availableStock);
                } else {
                    setAvailableStock(0);
                }
            } catch (err) {
                console.error("Failed to fetch stock", err);
                setAvailableStock(0);
            } finally {
                setIsCheckingStock(false);
            }
        };
        checkStock();
    }, [source, user?.id]);

    const handleSave = async () => {
        if (!date || !milkUsed || !quantityProduced) {
            Alert.alert('Missing Fields', 'Please fill in all mandatory fields.');
            return;
        }

        const usedLiters = parseFloat(milkUsed);
        if (availableStock !== null && usedLiters > availableStock) {
            Alert.alert('Insufficient Stock', `You only have ${availableStock.toFixed(2)}L of ${fatType} ${source} milk available.`);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/products/production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id || 'static-user-id',
                    date,
                    productType,
                    source,
                    fatType,
                    milkUsedLiters: usedLiters,
                    quantityProduced: parseFloat(quantityProduced),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (Platform.OS === 'web') {
                    alert('Success: Your data has been saved!');
                    router.back();
                } else {
                    Alert.alert('Success', 'Your data has been saved!', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                }
            } else {
                const errorMsg = data.message || 'Failed to save production data.';
                if (Platform.OS === 'web') alert('Error: ' + errorMsg);
                else Alert.alert('Error', errorMsg);
            }
        } catch (error) {
            console.error(error);
            const errorMsg = 'An unexpected network error occurred.';
            if (Platform.OS === 'web') alert('Error: ' + errorMsg);
            else Alert.alert('Error', errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const renderSelector = (options: string[], selectedValue: string, onSelect: (val: string) => void) => (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.selectorScroll}
        >
            {options.map((option) => {
                const isSelected = selectedValue === option;
                return (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.selectorChip,
                            {
                                backgroundColor: isSelected ? theme.primary : theme.surface,
                                borderColor: isSelected ? theme.primary : theme.border
                            }
                        ]}
                        onPress={() => onSelect(option)}
                        activeOpacity={0.7}
                    >
                        {isSelected && <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />}
                        <ThemedText style={[
                            styles.selectorText,
                            { color: isSelected ? '#FFFFFF' : theme.textSecondary }
                        ]}>
                            {option}
                        </ThemedText>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Production</ThemedText>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Stock Information Card */}
                    <Card variant="elevated" style={styles.stockCard}>
                        <View style={styles.stockHeader}>
                            <View style={styles.stockIconContainer}>
                                <Ionicons name="water" size={20} color={theme.primary} />
                            </View>
                            <View>
                                <ThemedText style={styles.stockLabel}>Total Collected {source} Milk</ThemedText>
                                <ThemedText style={styles.stockSublabel}>Available for Production</ThemedText>
                            </View>
                        </View>
                        <View style={styles.stockValueContainer}>
                            {isCheckingStock ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <ThemedText style={[
                                    styles.stockValue,
                                    { color: availableStock && availableStock > 0 ? theme.primary : '#EF4444' }
                                ]}>
                                    {availableStock !== null ? `${availableStock.toFixed(2)}` : '0.00'}
                                    <ThemedText style={styles.unitText}> Liters</ThemedText>
                                </ThemedText>
                            )}
                        </View>
                    </Card>

                    <Card variant="default" style={styles.formCard}>
                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Production Date</ThemedText>
                            <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.textInput, { color: theme.text }]}
                                    value={date}
                                    onChangeText={setDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Ionicons name="cube-outline" size={18} color={theme.primary} />
                            <ThemedText style={styles.sectionTitle}>Select Product</ThemedText>
                        </View>
                        {renderSelector(PRODUCT_TYPES, productType, setProductType)}

                        <View style={styles.divider} />

                        <View style={styles.sectionHeader}>
                            <Ionicons name="flask-outline" size={18} color={theme.primary} />
                            <ThemedText style={styles.sectionTitle}>Milk Source & Quality</ThemedText>
                        </View>
                        {renderSelector(MILK_SOURCES, source, setSource)}
                        <View style={{ marginTop: 8 }}>
                            {renderSelector(FAT_TYPES, fatType, setFatType)}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <ThemedText style={styles.inputLabel}>Milk Used (L)</ThemedText>
                                <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                    <TextInput
                                        style={[styles.textInput, { color: theme.text }]}
                                        value={milkUsed}
                                        onChangeText={setMilkUsed}
                                        keyboardType="numeric"
                                        placeholder="0.0"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <ThemedText style={styles.inputLabel}>Yield Produced</ThemedText>
                                <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                    <TextInput
                                        style={[styles.textInput, { color: theme.text }]}
                                        value={quantityProduced}
                                        onChangeText={setQuantityProduced}
                                        keyboardType="numeric"
                                        placeholder="0.0"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveButton, { backgroundColor: theme.primary }]} 
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <ThemedText style={styles.saveButtonText}>Save Production</ThemedText>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={() => router.back()}
                            disabled={isLoading}
                        >
                            <ThemedText style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</ThemedText>
                        </TouchableOpacity>
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    stockCard: {
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
    },
    stockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    stockIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stockLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    stockSublabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    stockValueContainer: {
        alignItems: 'flex-start',
    },
    stockValue: {
        fontSize: 28,
        fontWeight: '800',
    },
    unitText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    formCard: {
        padding: 20,
        borderRadius: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 6,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        width: '100%',
        marginVertical: 20,
    },
    selectorScroll: {
        paddingVertical: 4,
        paddingRight: 20,
        gap: 8,
    },
    selectorChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 8,
    },
    selectorText: {
        fontSize: 13,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    saveButton: {
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
