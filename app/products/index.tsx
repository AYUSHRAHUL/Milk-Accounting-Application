import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
            setIsCheckingStock(true);
            try {
                const res = await fetch(`/api/products/production?source=${source}&fatType=${fatType}`);
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
    }, [source, fatType]);

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
                Alert.alert('Success', `Production saved! Remaining Milk: ${data.remainingStock}L`, [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                // This captures our backend "Insufficient stock" error message perfectly
                Alert.alert('Production Failed', data.message || 'Failed to save entry.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An unexpected network error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderSelector = (options: string[], selectedValue: string, onSelect: (val: string) => void) => (
        <View style={styles.selectorContainer}>
            {options.map((option) => {
                const isSelected = selectedValue === option;
                return (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.selectorPill,
                            {
                                backgroundColor: isSelected ? theme.warning : theme.card,
                                borderColor: isSelected ? theme.warning : theme.border
                            }
                        ]}
                        onPress={() => onSelect(option)}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={[
                            styles.selectorText,
                            { color: isSelected ? '#FFFFFF' : theme.textSecondary }
                        ]}>
                            {option}
                        </ThemedText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.topDecoration, { backgroundColor: theme.warning }]} />

                <View style={styles.header}>
                    <ThemedText type="title" style={{ color: colorScheme === 'light' ? '#fff' : theme.text }}>
                        Products Entry
                    </ThemedText>
                    <ThemedText style={{ color: colorScheme === 'light' ? 'rgba(255,255,255,0.8)' : theme.textSecondary, marginTop: 4 }}>
                        Record today&apos;s converted milk
                    </ThemedText>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}>
                    <Input
                        label="Date (YYYY-MM-DD)"
                        value={date}
                        onChangeText={setDate}
                        placeholder="2024-10-15"
                    />

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 10 }]}>Select Product</ThemedText>
                    {renderSelector(PRODUCT_TYPES, productType, setProductType)}

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Which Milk was used?</ThemedText>
                    {renderSelector(MILK_SOURCES, source, setSource)}

                    <View style={{ marginTop: 5 }} />
                    {renderSelector(FAT_TYPES, fatType, setFatType)}

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={{ marginBottom: 16 }}>
                        <ThemedText style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 4 }}>
                            Available Milk Stock:
                        </ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {isCheckingStock ? (
                                <ActivityIndicator size="small" color={theme.warning} />
                            ) : (
                                <ThemedText style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: availableStock && availableStock > 0 ? theme.success : theme.error
                                }}>
                                    {availableStock !== null ? `${availableStock.toFixed(2)} Liters` : '0.00 Liters'}
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Input
                                label="Milk Used (Liters)"
                                value={milkUsed}
                                onChangeText={setMilkUsed}
                                keyboardType="numeric"
                                placeholder="0.0"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Input
                                label="Yield Produced"
                                value={quantityProduced}
                                onChangeText={setQuantityProduced}
                                keyboardType="numeric"
                                placeholder="0.0"
                            />
                        </View>
                    </View>

                    <Button
                        title="Save Production"
                        onPress={handleSave}
                        loading={isLoading}
                        style={{ marginTop: 24, backgroundColor: theme.warning }} /* Warning color to match products theme */
                    />
                    <Button
                        title="Cancel"
                        onPress={() => router.back()}
                        style={[styles.cancelButton, { backgroundColor: 'transparent', borderColor: theme.border, shadowOpacity: 0, elevation: 0 }]}
                        textStyle={{ color: theme.textSecondary }}
                        disabled={isLoading}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
    },
    topDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 180,
    },
    header: {
        marginTop: 40,
        marginBottom: 32,
    },
    card: {
        width: '100%',
        padding: 24,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 15,
        opacity: 0.5,
    },
    selectorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    selectorPill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    selectorText: {
        fontSize: 14,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    cancelButton: {
        borderWidth: 1,
        marginTop: 10,
    },
});
