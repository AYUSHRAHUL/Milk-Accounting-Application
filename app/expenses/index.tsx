import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['Feed', 'Transport', 'Maintenance', 'Salary', 'Supplies', 'Other'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Credit'];

export default function ExpensesScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('Feed');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');

    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!date || !category || !description || !amount) {
            Alert.alert('Missing Fields', 'Please fill in all mandatory fields (Date, Category, Description, Amount).');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id || 'static-user-id',
                    date,
                    category,
                    description,
                    amount: parseFloat(amount),
                    paymentMode,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'Expense logged successfully!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Failed', data.message || 'Failed to save expense.');
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
                                backgroundColor: isSelected ? theme.error : theme.card, // Red theme for Expenses
                                borderColor: isSelected ? theme.error : theme.border
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
                <View style={[styles.topDecoration, { backgroundColor: theme.error }]} />

                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ThemedText type="title" style={{ color: '#fff' }}>
                            Log Expense
                        </ThemedText>
                        <TouchableOpacity onPress={() => router.push('/expenses/history')} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
                            <ThemedText style={{ color: '#fff', fontSize: 13, fontWeight: '600', paddingHorizontal: 6 }}>View Ledger</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <ThemedText style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                        Track your farm and business costs
                    </ThemedText>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}>
                    <Input
                        label="Date (YYYY-MM-DD) *"
                        value={date}
                        onChangeText={setDate}
                        placeholder="2024-10-15"
                    />

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Category *</ThemedText>
                    {renderSelector(CATEGORIES, category, setCategory)}

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <Input
                        label="Description *"
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Bought 5 bags of cow feed..."
                        multiline
                    />

                    <Input
                        label="Amount (₹) *"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="0.00"
                    />

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 10 }]}>Payment Mode *</ThemedText>
                    {renderSelector(PAYMENT_MODES, paymentMode, setPaymentMode)}

                    <Button
                        title="Save Expense"
                        onPress={handleSave}
                        loading={isLoading}
                        style={{ marginTop: 24, backgroundColor: theme.error }}
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
    cancelButton: {
        borderWidth: 1,
        marginTop: 10,
    },
});
