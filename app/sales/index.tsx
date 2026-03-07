import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PRODUCT_TYPES = [
    'Butter',
    'Ghee',
    'S-khowa',
    'Unsweet khowa',
    'Paneer',
    'Shrikhand',
    'Icecream',
    'Gulab jamun',
    'Rasgulla',
    'Yoghurt',
    'Skim milk curd'
];
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

    // Success Modal & Receipt State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastSaleData, setLastSaleData] = useState<any>(null);

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
                const saleInfo = {
                    date,
                    customerName: customerName || 'Walk-in Customer',
                    productType,
                    quantity: parsedQuantity,
                    pricePerUnit: parseFloat(pricePerUnit),
                    totalAmount: parseFloat(totalAmount),
                    paymentMode,
                    remainingStock: data.remainingStock
                };
                setLastSaleData(saleInfo);
                setShowSuccessModal(true);
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

    const generateReceiptHTML = (data: any) => `
        <html>
        <head>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                .header { text-align: center; border-bottom: 3px solid #10B981; padding-bottom: 15px; margin-bottom: 30px; }
                .farm-name { font-size: 32px; font-weight: 900; color: #059669; letter-spacing: 1px; margin-bottom: 5px; }
                .receipt-title { font-size: 16px; font-weight: 600; color: #6B7280; text-transform: uppercase; }
                .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; background: #F9FAFB; padding: 20px; border-radius: 12px; }
                .info-box { font-size: 14px; }
                .info-label { color: #6B7280; font-weight: 600; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background-color: #F3F4F6; text-align: left; padding: 15px; border-bottom: 2px solid #E5E7EB; color: #374151; font-weight: 700; }
                td { padding: 15px; border-bottom: 1px solid #F3F4F6; color: #4B5563; }
                .total-section { text-align: right; padding-top: 20px; border-top: 2px solid #10B981; }
                .total-row { display: flex; justify-content: flex-end; align-items: center; gap: 20px; }
                .total-label { font-size: 18px; font-weight: 600; color: #374151; }
                .total-amount { font-size: 28px; font-weight: 800; color: #059669; }
                .footer { margin-top: 50px; text-align: center; border-top: 1px dashed #D1D5DB; padding-top: 20px; color: #9CA3AF; font-size: 13px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="farm-name">DHARMRAJ DAIRY FARM</div>
                <div class="receipt-title">Official Sales Receipt</div>
            </div>
            
            <div class="info-section">
                <div class="info-box">
                    <span class="info-label">CUSTOMER:</span> ${data.customerName}<br>
                    <span class="info-label">DATE:</span> ${data.date}<br>
                    <span class="info-label">TIME:</span> ${new Date().toLocaleTimeString()}
                </div>
                <div class="info-box" style="text-align: right;">
                    <span class="info-label">PAYMENT:</span> ${data.paymentMode}<br>
                    <span class="info-label">RECEIPT ID:</span> #SALE-${Math.floor(100000 + Math.random() * 900000)}<br>
                    <span class="info-label">STATUS:</span> PAID
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 50%">ITEM DESCRIPTION</th>
                        <th style="text-align: center;">QTY</th>
                        <th style="text-align: right;">PRICE</th>
                        <th style="text-align: right;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${data.productType} (Fresh Dairy)</td>
                        <td style="text-align: center;">${data.quantity} kg</td>
                        <td style="text-align: right;">₹${data.pricePerUnit}</td>
                        <td style="text-align: right; font-weight: 600;">₹${data.totalAmount}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-row">
                    <span class="total-label">GRAND TOTAL</span>
                    <span class="total-amount">₹${data.totalAmount}</span>
                </div>
            </div>
            
            <div class="footer">
                <p>Thank you for choosing Dharmraj Dairy Farm for your fresh products!</p>
                <p style="font-style: italic;">This is a computer-generated receipt.</p>
            </div>
        </body>
        </html>
    `;

    const handlePrintReceipt = async () => {
        if (!lastSaleData) return;
        const html = generateReceiptHTML(lastSaleData);
        await Print.printAsync({ html });
    };

    const handleDownloadReceipt = async () => {
        if (!lastSaleData) return;
        const html = generateReceiptHTML(lastSaleData);
        
        try {
            if (Platform.OS === 'web') {
                // On Web, printToFileAsync is not supported or returns an empty object/undefined
                // We use printAsync which allows the user to 'Save as PDF'
                await Print.printAsync({ html });
                alert('Please select "Save as PDF" in the print destination to download.');
            } else {
                const result = await Print.printToFileAsync({ html });
                if (result && result.uri) {
                    await Sharing.shareAsync(result.uri);
                } else {
                    Alert.alert('Error', 'Could not generate receipt file.');
                }
            }
        } catch (error) {
            console.error('Receipt generation error:', error);
            if (Platform.OS === 'web') alert('Failed to generate receipt.');
            else Alert.alert('Error', 'Failed to generate receipt.');
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
                            styles.selectorPill,
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
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Sales</ThemedText>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
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
                                    label="Quantity Sold (kg) *"
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

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <View style={styles.successIconContainer}>
                                <Ionicons name="checkmark-circle" size={50} color={theme.primary} />
                            </View>
                            <ThemedText style={styles.modalTitle}>Sale Completed!</ThemedText>
                            <ThemedText style={styles.modalSubtitle}>The entry has been recorded successfully.</ThemedText>
                        </View>

                        <View style={[styles.billPreview, { backgroundColor: theme.background }]}>
                            <View style={styles.billRow}>
                                <ThemedText style={styles.billLabel}>Date</ThemedText>
                                <ThemedText style={styles.billValue}>{lastSaleData?.date}</ThemedText>
                            </View>
                            <View style={styles.billRow}>
                                <ThemedText style={styles.billLabel}>Customer</ThemedText>
                                <ThemedText style={styles.billValue}>{lastSaleData?.customerName}</ThemedText>
                            </View>
                            <View style={[styles.divider, { marginVertical: 8, height: 1 }]} />
                            <View style={styles.billRow}>
                                <ThemedText style={styles.billLabel}>{lastSaleData?.productType}</ThemedText>
                                <ThemedText style={styles.billValue}>{lastSaleData?.quantity} kg x ₹{lastSaleData?.pricePerUnit}</ThemedText>
                            </View>
                            <View style={[styles.billRow, { marginTop: 12 }]}>
                                <ThemedText style={[styles.billLabel, { fontWeight: '800', color: theme.text }]}>Total Amount</ThemedText>
                                <ThemedText style={[styles.billValue, { fontWeight: '800', color: theme.primary, fontSize: 18 }]}>₹{lastSaleData?.totalAmount}</ThemedText>
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, { backgroundColor: theme.primary }]} 
                                onPress={handlePrintReceipt}
                            >
                                <Ionicons name="eye-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <ThemedText style={styles.modalButtonText}>View Receipt</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalButton, { backgroundColor: '#3B82F6' }]} 
                                onPress={handleDownloadReceipt}
                            >
                                <Ionicons name="download-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <ThemedText style={styles.modalButtonText}>Download Receipt</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.closeButton} 
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    router.back();
                                }}
                            >
                                <ThemedText style={[styles.closeButtonText, { color: theme.textSecondary }]}>Dismiss</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        flex: 1,
        textAlign: 'center',
        marginRight: 24, // Offset for back button to center title
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
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
    selectorScroll: {
        paddingVertical: 4,
        paddingRight: 10,
        gap: 8,
    },
    selectorPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 4,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    successIconContainer: {
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    billPreview: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    billLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    billValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalButtons: {
        width: '100%',
        gap: 12,
    },
    modalButton: {
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    closeButton: {
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
