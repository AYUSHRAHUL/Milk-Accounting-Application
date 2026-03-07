import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const PRODUCT_TYPES = ['Paneer', 'Ghee', 'Butter', 'Curd', 'Other'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Credit'];

export default function SalesScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [customerName, setCustomerName] = useState('');
    const [productType, setProductType] = useState('Paneer');
    const [quantity, setQuantity] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');

    // Auto-calculated state
    const [totalAmount, setTotalAmount] = useState('0.00');

    // Live Stock Tracking
    const [availableStock, setAvailableStock] = useState<number | null>(null);
    const [isCheckingStock, setIsCheckingStock] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Stock whenever the Product Type changes
    useEffect(() => {
        const checkStock = async () => {
            setIsCheckingStock(true);
            try {
                const res = await fetch(`/api/sales?productType=${productType}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableStock(data.availableStock);
                } else {
                    setAvailableStock(0);
                }
            } catch (err) {
                console.error("Failed to fetch product stock", err);
                setAvailableStock(0);
            } finally {
                setIsCheckingStock(false);
            }
        };
        checkStock();
    }, [productType]);

    // Live Math for Total Amount
    useEffect(() => {
        const qty = parseFloat(quantity) || 0;
        const price = parseFloat(pricePerUnit) || 0;
        setTotalAmount((qty * price).toFixed(2));
    }, [quantity, pricePerUnit]);

    const handleSave = async () => {
        if (!date || !productType || !quantity || !pricePerUnit) {
            Alert.alert('Missing Fields', 'Please fill in all mandatory fields (Date, Product, Quantity, Price).');
            return;
        }

        const parsedQuantity = parseFloat(quantity);
        if (availableStock !== null && parsedQuantity > availableStock) {
            Alert.alert('Insufficient Stock', `You only have ${availableStock.toFixed(2)} units of ${productType} available to sell.`);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id || 'static-user-id',
                    date,
                    customerName,
                    productType,
                    quantity: parsedQuantity,
                    pricePerUnit: parseFloat(pricePerUnit),
                    totalAmount: parseFloat(totalAmount),
                    paymentMode,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', `Sale recorded! Remaining Stock: ${data.remainingStock}`, [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Sale Failed', data.message || 'Failed to save entry.');
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
                                backgroundColor: isSelected ? theme.primary : theme.surface,
                                borderColor: isSelected ? theme.primary : theme.border
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
                <View style={styles.topRow}>
                    
                    <Button
                        title="Ledger"
                        variant="outline"
                        style={styles.ledgerBtn}
                        onPress={() => router.push('/sales/history')}
                    />
                </View>

                <Card variant="elevated" style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
                    <Input
                        label="Date (YYYY-MM-DD)"
                        value={date}
                        onChangeText={setDate}
                        placeholder="2024-10-15"
                    />

                    <Input
                        label="Customer Name (Optional)"
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="Walk-in Customer"
                    />

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Select Product *</ThemedText>
                    {renderSelector(PRODUCT_TYPES, productType, setProductType)}

                    <View style={{ marginBottom: 16, marginTop: 8 }}>
                        <ThemedText style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 4 }}>
                            Available {productType} Stock:
                        </ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {isCheckingStock ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <ThemedText style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: availableStock && availableStock > 0 ? theme.success : theme.error
                                }}>
                                    {availableStock !== null ? `${availableStock.toFixed(2)} Units` : '0 Units'}
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Input
                                label="Quantity Sold *"
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="numeric"
                                placeholder="0.0"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Input
                                label="Price per Unit (₹) *"
                                value={pricePerUnit}
                                onChangeText={setPricePerUnit}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                    </View>

                    <View style={[styles.totalBox, { backgroundColor: theme.surfaceMuted }]}>
                        <ThemedText style={styles.totalLabel}>Total Amount:</ThemedText>
                        <ThemedText style={[styles.totalValue, { color: theme.primary }]}>
                            ₹ {totalAmount}
                        </ThemedText>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Payment Mode *</ThemedText>
                    {renderSelector(PAYMENT_MODES, paymentMode, setPaymentMode)}

                    <Button
                        title="Complete Sale"
                        onPress={handleSave}
                        loading={isLoading}
                        style={{ marginTop: 24 }}
                    />
                    <Button
                        title="Cancel"
                        onPress={() => router.back()}
                        variant="outline"
                        style={styles.cancelButton}
                        disabled={isLoading}
                    />
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backBtn: {
        paddingVertical: 8,
        paddingRight: 12,
    },
    ledgerBtn: {
        height: 40,
        minWidth: 100,
    },
    card: {
        width: '100%',
        padding: 24,
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
    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    cancelButton: {
        borderWidth: 1,
        marginTop: 10,
    },
});
