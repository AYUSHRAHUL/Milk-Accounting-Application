import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { router, Stack, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { DatePicker } from '@/components/ui/DatePicker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ALL_PRODUCT_TYPES = ['Paneer', 'Ghee', 'Butter', 'Curd', 'Khoa', 'Fl. milk', 'ST Milk', 'TD MILK', 'DTD MIlk', 'Icecream', 'Yoghurt', 'Srikhand', 'Rasgolla', 'Gulabjamun', 'Rabbari', 'Other'];
const PRODUCT_ICONS: Record<string, string> = {
    Paneer: '🧀', Ghee: '🫙', Butter: '🧈', Curd: '🥛', Khoa: '🍮', 
    'Fl. milk': '🧃', 'ST Milk': '🥛', 'TD MILK': '🥛', 'DTD MIlk': '🥛', 
    Icecream: '🍨', Yoghurt: '🍧', Srikhand: '🥣', 
    Rasgolla: '⚪', Gulabjamun: '🧆', Rabbari: '🥘', Other: '📦', More: '➡️', Less: '⬆️',
};
const PRODUCT_COLORS: Record<string, string> = {
    Paneer: '#10B981', Ghee: '#F59E0B', Butter: '#FCD34D', Curd: '#3B82F6', Khoa: '#8B5CF6', 
    'Fl. milk': '#EC4899', 'ST Milk': '#2563EB', 'TD MILK': '#0EA5E9', 'DTD MIlk': '#38BDF8',
    Icecream: '#F472B6', Yoghurt: '#A78BFA', Srikhand: '#FDE047', 
    Rasgolla: '#9CA3AF', Gulabjamun: '#78350F', Rabbari: '#FBBF24', Other: '#64748B', More: '#64748B', Less: '#64748B',
};
const PAYMENT_MODES = ['Cash', 'UPI', 'Credit'];

export default function SalesScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'warning' as 'warning' | 'error' | 'info' | 'success'
    });

    const triggerAlert = (title: string, message: string, type: 'warning' | 'error' | 'info' | 'success' = 'warning') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const [displayDate, setDisplayDate] = useState(() => {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    });

    const [customerName, setCustomerName] = useState('');
    const [productType, setProductType] = useState('Paneer');
    const [quantity, setQuantity] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [totalAmount, setTotalAmount] = useState('0.00');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingStock, setIsFetchingStock] = useState(true);
    const [productStock, setProductStock] = useState<Record<string, number>>({});
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastSaleData, setLastSaleData] = useState<any>(null);
    const [showAllProducts, setShowAllProducts] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    const apiDate = useMemo(() => {
        const parts = displayDate.split(/[-/]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`; // YYYY-MM-DD
            return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
        }
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }, [displayDate]);

    const fetchStock = useCallback(async () => {
        if (!user?.id) return;
        setIsFetchingStock(true);
        try {
            const res = await apiFetch(`/api/sales/product-stock?userId=${user.id}`);
            if (res.ok) setProductStock(await res.json());
        } catch (e) {
            console.error('Stock fetch error', e);
        } finally {
            setIsFetchingStock(false);
        }
    }, [user?.id]);

    useFocusEffect(useCallback(() => { fetchStock(); }, [fetchStock]));

    useEffect(() => {
        const qty = parseFloat(quantity) || 0;
        const price = parseFloat(pricePerUnit) || 0;
        setTotalAmount((qty * price).toFixed(2));
    }, [quantity, pricePerUnit]);

    const availableForSelected = productStock[productType] ?? 0;
    const quantityNum = parseFloat(quantity) || 0;
    const isOverLimit = quantityNum > 0 && quantityNum > availableForSelected;

    const handleSave = async () => {
        // Specific Field Validation
        if (!displayDate) {
            triggerAlert('Missing Field', 'Please select a Date.');
            return;
        }
        if (!customerName.trim()) {
            triggerAlert('Missing Field', 'Please enter the Customer Name.');
            return;
        }
        if (!productType) {
            triggerAlert('Missing Field', 'Please select a Product.');
            return;
        }
        const qtyNum = parseFloat(quantity);
        if (!quantity || isNaN(qtyNum) || qtyNum <= 0) {
            triggerAlert('Invalid Quantity', 'Please enter a valid Quantity greater than 0.');
            return;
        }
        const priceNum = parseFloat(pricePerUnit);
        if (!pricePerUnit || isNaN(priceNum) || priceNum <= 0) {
            triggerAlert('Invalid Price', 'Please enter a valid Price per Unit.');
            return;
        }

        if (isOverLimit) {
            triggerAlert('Insufficient Stock', `Only ${availableForSelected.toFixed(2)} units of ${productType} available.`);
            return;
        }

        setIsLoading(true);
        try {
            const saleData = {
                userId: user?.id,
                date: apiDate,
                customerName,
                productType,
                quantity: qtyNum,
                pricePerUnit: priceNum,
                totalAmount: parseFloat(totalAmount),
                paymentMode,
            };

            const response = await apiFetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData),
            });

            const data = await response.json();
            if (response.ok) {
                // Set the receipt data BEFORE resetting inputs
                setLastSaleData({
                    date: displayDate,
                    customerName,
                    productType,
                    quantity,
                    pricePerUnit,
                    totalAmount,
                    paymentMode
                });

                // Clear inputs
                setCustomerName('');
                setQuantity('');
                setPricePerUnit('');

                // Show success modal
                setShowSuccessModal(true);
                fetchStock(); // refresh stock
            } else {
                triggerAlert('Sale Failed', data.message || 'Failed to save entry.', 'error');
            }
        } catch (e) {
            console.error('Save error:', e);
            triggerAlert('Error', 'An unexpected network error occurred.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const generateReceiptHTML = (data: any) => `
        <html><head><style>
            body{font-family:'Helvetica',sans-serif;padding:40px;color:#333;}
            .header{text-align:center;border-bottom:2px solid #10B981;padding-bottom:15px;margin-bottom:30px;}
            .farm{font-size:28px;font-weight:800;color:#059669;}
            .info{display:flex;justify-content:space-between;background:#f3f4f6;padding:15px;border-radius:8px;margin-bottom:30px;}
            table{width:100%;border-collapse:collapse;}
            th{text-align:left;padding:12px;border-bottom:2px solid #ddd;}
            td{padding:12px;border-bottom:1px solid #eee;}
            .total{text-align:right;margin-top:20px;font-size:22px;font-weight:800;color:#059669;}
        </style></head>
        <body>
            <div class="header">
                <div class="farm">Mom ami Dairyware</div>
                <div style="font-size:14px;color:#6B7280;margin-top:4px;">Sales Receipt</div>
            </div>
            <div class="info">
                <div><b>Customer:</b> ${data.customerName}<br><b>Date:</b> ${data.date}</div>
                <div style="text-align:right"><b>Mode:</b> ${data.paymentMode}</div>
            </div>
            <table>
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                <tr><td>${data.productType}</td><td>${data.quantity}</td><td>₹${data.pricePerUnit}</td><td>₹${data.totalAmount}</td></tr>
            </table>
            <div class="total">GRAND TOTAL: ₹${data.totalAmount}</div>
        </body></html>`;

    const handlePrintReceipt = async () => {
        if (!lastSaleData) return;
        await Print.printAsync({ html: generateReceiptHTML(lastSaleData) });
    };

    const handleDownloadReceipt = async () => {
        if (!lastSaleData) return;
        const html = generateReceiptHTML(lastSaleData);
        if (Platform.OS === 'web') {
            await Print.printAsync({ html });
        } else {
            const result = await Print.printToFileAsync({ html });
            if (result?.uri) await Sharing.shareAsync(result.uri);
        }
    };

    const renderInput = (
        label: string,
        value: string,
        setValue: (t: string) => void,
        placeholder: string,
        keyboard: any = 'default',
        fieldId: string,
        icon?: string,
        yOffset?: number
    ) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colorScheme === 'dark' ? '#94A3B8' : '#374151' }]}>{label}</Text>
            <View style={[styles.inputWrapper, focusedField === fieldId && styles.inputFocused]}>
                {icon && <Ionicons name={icon as any} size={19} color="#10B981" style={styles.inputIcon} />}
                <TextInput
                    style={[styles.textInput, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    value={value}
                    onChangeText={setValue}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={keyboard}
                    onFocus={() => {
                        setFocusedField(fieldId);
                        if (yOffset !== undefined) {
                            scrollRef.current?.scrollTo({ y: yOffset, animated: true });
                        } else if (fieldId === 'price' || fieldId === 'qty') {
                             scrollRef.current?.scrollToEnd({ animated: true });
                        }
                    }}
                    onBlur={() => setFocusedField(null)}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F9FAFB' }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#10B981" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Record Sale</ThemedText>
                <View style={{ width: 44 }} />
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
                >

                    {/* ── Section 1: Date & Customer ── */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionDot} />
                            <ThemedText style={styles.sectionTitle}>Entry Details</ThemedText>
                        </View>
                        <View style={styles.splitRow}>
                            <View style={[styles.splitCol, { flex: 1.1, paddingRight: 5 }]}>
                                <DatePicker
                                    label="Date"
                                    value={displayDate}
                                    onChange={setDisplayDate}
                                    format="DD-MM-YYYY"
                                />
                            </View>
                            <View style={[styles.splitCol, { flex: 1.5, paddingLeft: 5 }]}>
                                {renderInput('Customer Name', customerName, setCustomerName, 'Enter name', 'default', 'customer', 'person-outline', 0)}
                            </View>
                        </View>
                    </View>

                    {/* ── Section 2: Product Selection ── */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDot, { backgroundColor: '#F59E0B' }]} />
                            <ThemedText style={styles.sectionTitle}>Select Product</ThemedText>
                        </View>

                        {isFetchingStock ? (
                            <ActivityIndicator color="#10B981" style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.productGrid}>
                                {(() => {
                                    const displayList = showAllProducts 
                                        ? [...ALL_PRODUCT_TYPES, 'Show Fewer'] 
                                        : [...ALL_PRODUCT_TYPES.slice(0, 7), 'Other...'];
                                        
                                    return displayList.map(p => {
                                        if (p === 'Other...' || p === 'Show Fewer') {
                                            return (
                                                <TouchableOpacity
                                                    key={p}
                                                    onPress={() => setShowAllProducts(p === 'Other...')}
                                                    activeOpacity={0.8}
                                                    style={[styles.productCard, { justifyContent: 'center' }]}
                                                >
                                                    <ThemedText style={styles.productIcon}>{PRODUCT_ICONS[p === 'Other...' ? 'More' : 'Less']}</ThemedText>
                                                    <ThemedText style={styles.productName}>{p}</ThemedText>
                                                </TouchableOpacity>
                                            );
                                        }

                                        const isSelected = productType === p;
                                        const stock = productStock[p] ?? 0;
                                        const color = PRODUCT_COLORS[p] || '#6B7280';
                                        return (
                                            <TouchableOpacity
                                                key={p}
                                                onPress={() => { setProductType(p); setQuantity(''); }}
                                                activeOpacity={0.8}
                                                style={[
                                                    styles.productCard,
                                                    isSelected && { borderColor: color, borderWidth: 2.5, backgroundColor: `${color}12` }
                                                ]}
                                            >
                                                <ThemedText style={styles.productIcon}>{PRODUCT_ICONS[p]}</ThemedText>
                                                <ThemedText style={[styles.productName, isSelected && { color, fontWeight: '800' }]}>{p}</ThemedText>
                                                <View style={[styles.stockBadge, { backgroundColor: stock > 0 ? '#DCFCE7' : '#FEE2E2' }]}>
                                                    <ThemedText style={[styles.stockText, { color: stock > 0 ? '#166534' : '#991B1B' }]}>
                                                        {stock > 0 ? `${stock.toFixed(1)} avail` : 'Out of stock'}
                                                    </ThemedText>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    });
                                })()}
                            </View>
                        )}
                    </View>

                    {/* ── Section 3: Quantity & Price ── */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDot, { backgroundColor: '#3B82F6' }]} />
                            <ThemedText style={styles.sectionTitle}>Quantity & Price</ThemedText>
                        </View>

                        {/* Stock warning */}
                        {isOverLimit && (
                            <View style={styles.warningBanner}>
                                <Ionicons name="warning" size={16} color="#92400E" />
                                <ThemedText style={styles.warningText}>
                                    Exceeds stock! Only {availableForSelected.toFixed(2)} units available.
                                </ThemedText>
                            </View>
                        )}

                        <View style={styles.splitRow}>
                            <View style={[styles.splitCol, { flex: 1, paddingRight: 6 }]}>
                                {renderInput('Quantity', quantity, setQuantity, '0.0', 'numeric', 'qty')}
                            </View>
                            <View style={[styles.splitCol, { flex: 1, paddingLeft: 6 }]}>
                                {renderInput('Price per Unit ₹', pricePerUnit, setPricePerUnit, '0', 'numeric', 'price')}
                            </View>
                        </View>

                        {/* Total */}
                        <View style={styles.totalBox}>
                            <ThemedText style={styles.totalLabel}>Total Payable</ThemedText>
                            <ThemedText style={[styles.totalValue, isOverLimit && { color: '#EF4444' }]}>
                                ₹ {totalAmount}
                            </ThemedText>
                        </View>
                    </View>

                    {/* ── Section 4: Payment Method ── */}
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDot, { backgroundColor: '#8B5CF6' }]} />
                            <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>
                        </View>
                        <View style={styles.paymentRow}>
                            {PAYMENT_MODES.map(m => {
                                const icons: Record<string, string> = { Cash: 'cash', UPI: 'qr-code', Credit: 'card' };
                                const isSelected = paymentMode === m;
                                return (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => setPaymentMode(m)}
                                        style={[styles.paymentCard, isSelected && styles.paymentCardSelected]}
                                    >
                                        <Ionicons name={icons[m] as any} size={16} color={isSelected ? '#fff' : '#6B7280'} />
                                        <ThemedText style={[styles.paymentLabel, isSelected && { color: '#fff' }]}>{m}</ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Submit ── */}
                    <TouchableOpacity
                        style={[styles.saveBtn, isOverLimit && { backgroundColor: '#EF4444', shadowColor: '#EF4444' }]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Ionicons name={isOverLimit ? 'warning-outline' : 'checkmark-circle'} size={20} color="#fff" />
                                <ThemedText style={styles.saveBtnText}>Sale</ThemedText>
                            </>
                        }
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Success Modal ── */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.successBadge}>
                            <Ionicons name="checkmark" size={36} color="#fff" />
                        </View>
                        <ThemedText style={styles.modalTitle}>Sale Recorded! 🎉</ThemedText>
                        <ThemedText style={styles.modalSub}>
                            {lastSaleData?.quantity} units of {lastSaleData?.productType} sold to {lastSaleData?.customerName}
                        </ThemedText>

                        <TouchableOpacity
                            style={[styles.saveBtn, { width: '100%', marginTop: 20 }]}
                            onPress={() => {
                                setShowSuccessModal(false);
                                setShowReceiptModal(true);
                            }}
                        >
                            <Ionicons name="receipt-outline" size={20} color="#fff" />
                            <ThemedText style={styles.saveBtnText}>View Receipt</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => { setShowSuccessModal(false); router.replace('/(tabs)'); }}
                            style={styles.btnDismiss}
                        >
                            <ThemedText style={styles.btnDismissText}>Done</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Receipt Preview Modal ── */}
            <Modal visible={showReceiptModal} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={[styles.modalContent, { padding: 0, overflow: 'hidden', maxWidth: 450 }]}>
                        {/* Header */}
                        <View style={{ backgroundColor: '#10B981', width: '100%', padding: 20, alignItems: 'center' }}>
                            <ThemedText style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Sales Receipt</ThemedText>
                            <TouchableOpacity
                                onPress={() => setShowReceiptModal(false)}
                                style={{ position: 'absolute', right: 15, top: 18 }}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ width: '100%', padding: 20 }}>
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <ThemedText style={{ fontSize: 24, fontWeight: '900', color: '#10B981' }}>Mom ami Dairyware</ThemedText>
                                <ThemedText style={{ fontSize: 12, color: '#6B7280' }}>Quality Fresh Dairy Products</ThemedText>
                            </View>

                            <View style={styles.receiptLine} />

                            <View style={styles.receiptGrid}>
                                <View style={styles.receiptInfoRow}>
                                    <ThemedText style={styles.receiptLabel}>Customer:</ThemedText>
                                    <ThemedText style={styles.receiptValue}>{lastSaleData?.customerName}</ThemedText>
                                </View>
                                <View style={styles.receiptInfoRow}>
                                    <ThemedText style={styles.receiptLabel}>Date:</ThemedText>
                                    <ThemedText style={styles.receiptValue}>{lastSaleData?.date}</ThemedText>
                                </View>
                                <View style={styles.receiptInfoRow}>
                                    <ThemedText style={styles.receiptLabel}>Payment:</ThemedText>
                                    <ThemedText style={styles.receiptValue}>{lastSaleData?.paymentMode}</ThemedText>
                                </View>
                            </View>

                            <View style={[styles.receiptLine, { marginVertical: 15 }]} />

                            {/* Table Header */}
                            <View style={{ flexDirection: 'row', paddingBottom: 8 }}>
                                <ThemedText style={{ flex: 2, fontSize: 12, fontWeight: '800', color: '#374151' }}>ITEM</ThemedText>
                                <ThemedText style={{ flex: 1, fontSize: 12, fontWeight: '800', color: '#374151', textAlign: 'center' }}>QTY</ThemedText>
                                <ThemedText style={{ flex: 1.5, fontSize: 12, fontWeight: '800', color: '#374151', textAlign: 'right' }}>TOTAL</ThemedText>
                            </View>

                            {/* Item Row */}
                            <View style={{ flexDirection: 'row', paddingVertical: 10 }}>
                                <ThemedText style={{ flex: 2, fontSize: 14, fontWeight: '600' }}>{lastSaleData?.productType}</ThemedText>
                                <ThemedText style={{ flex: 1, fontSize: 14, textAlign: 'center' }}>{lastSaleData?.quantity}</ThemedText>
                                <ThemedText style={{ flex: 1.5, fontSize: 14, fontWeight: '700', textAlign: 'right' }}>₹{lastSaleData?.totalAmount}</ThemedText>
                            </View>

                            <View style={[styles.receiptLine, { marginVertical: 15 }]} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ThemedText style={{ fontSize: 16, fontWeight: '800', color: '#374151' }}>TOTAL AMOUNT</ThemedText>
                                <ThemedText style={{ fontSize: 24, fontWeight: '900', color: '#10B981' }}>₹{lastSaleData?.totalAmount}</ThemedText>
                            </View>

                            <View style={{ marginTop: 30, alignItems: 'center' }}>
                                <ThemedText style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Thank you for your business!</ThemedText>
                            </View>
                        </ScrollView>

                        <View style={{ width: '100%', padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={[styles.btnAction, { flex: 1, backgroundColor: '#1F2937' }]}
                                onPress={handlePrintReceipt}
                            >
                                <Ionicons name="cloud-download-outline" size={18} color="#fff" />
                                <ThemedText style={styles.btnActionText}>Download</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btnAction, { flex: 1, backgroundColor: '#3B82F6' }]}
                                onPress={handleDownloadReceipt}
                            >
                                <Ionicons name="share-social-outline" size={18} color="#fff" />
                                <ThemedText style={styles.btnActionText}>Share</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* ── Custom Alert Modal ── */}
            <Modal visible={alertConfig.visible} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={[styles.modalContent, { maxWidth: 320, padding: 24, maxHeight: '80%' }]}>
                        <ScrollView contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
                            <View style={[
                                styles.alertIconBadge,
                                { backgroundColor: alertConfig.type === 'error' ? '#FEE2E2' : alertConfig.type === 'warning' ? '#FEF3C7' : '#DBEAFE' }
                            ]}>
                                <Ionicons
                                    name={alertConfig.type === 'error' ? 'alert-circle' : alertConfig.type === 'warning' ? 'warning' : 'information-circle'}
                                    size={32}
                                    color={alertConfig.type === 'error' ? '#EF4444' : alertConfig.type === 'warning' ? '#F59E0B' : '#3B82F6'}
                                />
                            </View>

                            <ThemedText style={[styles.modalTitle, { fontSize: 18, textAlign: 'center' }]}>
                                {alertConfig.title}
                            </ThemedText>

                            <ThemedText style={[styles.modalSub, { marginBottom: 24 }]}>
                                {alertConfig.message}
                            </ThemedText>
                        </ScrollView>

                        <TouchableOpacity
                            style={[
                                styles.btnAction,
                                {
                                    width: '100%',
                                    backgroundColor: alertConfig.type === 'error' ? '#EF4444' : alertConfig.type === 'warning' ? '#F59E0B' : '#10B981',
                                    height: 48,
                                    marginTop: 10
                                }
                            ]}
                            onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                        >
                            <ThemedText style={styles.btnActionText}>Understood</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 13,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#111827' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
    card: {
        backgroundColor: '#fff', 
        borderRadius: 20, 
        padding: 14, // Slightly reduced padding for more internal space
        marginBottom: 12,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
        overflow: 'hidden', // Ensure no content leaks out
    },
    sectionHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 14,
        width: '100%',
    },
    sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.3 },
    inputGroup: { marginBottom: 10, width: '100%' },
    inputLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
    inputWrapper: {
        width: '100%', height: 48, borderRadius: 12, borderWidth: 1,
        borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
        paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center',
        overflow: 'hidden', // Forces content to remain inside
    },
    inputFocused: { borderColor: '#10B981', backgroundColor: '#fff', borderWidth: 1.5 },
    inputIcon: { marginRight: 8 },
    textInput: { flex: 1, height: '100%', fontSize: 14, fontWeight: '600', textAlignVertical: 'center' },
    splitRow: { flexDirection: 'row', width: '100%', alignItems: 'flex-start', marginBottom: 8 },
    splitCol: { justifyContent: 'center' },
    productGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'flex-start',
    },
    productCard: {
        width: '23.5%', // Reduced from 25%
        marginHorizontal: '0.75%', // Dynamic spacing
        paddingVertical: 8, 
        paddingHorizontal: 4, 
        borderRadius: 12,
        backgroundColor: '#F9FAFB', 
        borderWidth: 1.5, 
        borderColor: '#F3F4F6',
        alignItems: 'center',
        minHeight: 100, 
        marginBottom: 8,
    },
    productIcon: { fontSize: 16, marginBottom: 2 }, // Reduced icon size
    productName: { 
        fontSize: 10, 
        fontWeight: '700', 
        color: '#374151', 
        marginBottom: 4, 
        textAlign: 'center',
        height: 24, // Reduced from 28
        textAlignVertical: 'center',
    },
    stockBadge: { 
        paddingHorizontal: 4, 
        paddingVertical: 2, 
        borderRadius: 6,
        marginTop: 'auto', 
    },
    stockText: { fontSize: 7, fontWeight: '800', textAlign: 'center' },
    row: { flexDirection: 'row', marginBottom: 8 },
    warningBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginBottom: 12,
    },
    warningText: { fontSize: 13, color: '#92400E', fontWeight: '600', flex: 1 },
    totalBox: {
        backgroundColor: '#ECFDF5', borderRadius: 14, padding: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
    },
    totalLabel: { fontSize: 14, fontWeight: '600', color: '#065F46' },
    totalValue: { fontSize: 24, fontWeight: '900', color: '#10B981' },
    paymentRow: { flexDirection: 'row', gap: 8 },
    paymentCard: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10,
        borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', gap: 5,
    },
    paymentCardSelected: { backgroundColor: '#10B981', borderColor: '#10B981' },
    paymentLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    saveBtn: {
        height: 54, backgroundColor: '#10B981', borderRadius: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: '#10B981', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
        marginBottom: 10,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 30, padding: 24, alignItems: 'center' },
    successBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    alertIconBadge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 6, color: '#111827' },
    modalSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    receiptRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 20 },
    receiptItem: { flex: 1, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 10 },
    receiptLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
    receiptValue: { fontSize: 14, fontWeight: '800', color: '#111827' },
    modalBtns: { flexDirection: 'row', gap: 10, width: '100%' },
    btnAction: { height: 46, backgroundColor: '#10B981', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
    btnActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    btnDismiss: { marginTop: 14, padding: 8 },
    btnDismissText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
    receiptLine: { height: 1.5, backgroundColor: '#E5E7EB', width: '100%', borderStyle: 'dashed' },
    receiptGrid: { gap: 8 },
    receiptInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
});