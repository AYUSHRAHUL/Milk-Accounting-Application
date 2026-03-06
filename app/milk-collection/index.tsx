import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const MILK_SOURCES = ['Cow', 'Buffalo', 'Goat', 'Other'];
const SHIFTS = ['Morning', 'Evening'];

export default function MilkCollectionScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [supplier, setSupplier] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(() => new Date().toTimeString().split(' ')[0].substring(0, 5));
    const [shift, setShift] = useState('Morning');
    const [source, setSource] = useState('Cow');
    const [customSource, setCustomSource] = useState('');
    const [fatType, setFatType] = useState(''); // Empty default for text input
    const [snf, setSnf] = useState('');
    const [clr, setClr] = useState('');
    const [quantity, setQuantity] = useState('');
    const [costPerLiter, setCostPerLiter] = useState('');
    const [totalCost, setTotalCost] = useState('0.00');
    const [isLoading, setIsLoading] = useState(false);

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
                    userId: user?.id || 'static-user-id', // Ideally from session
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
                    { text: 'OK', onPress: () => router.back() }
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
                                backgroundColor: isSelected ? theme.primary : theme.card,
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
                <ScreenHeader
                    title="Milk Entry"
                    subtitle={`Recording for: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                    onBack={() => router.back()}
                    right={
                        <View style={{ width: 120 }}>
                            <Button
                                title="Ledger"
                                variant="outline"
                                style={{ height: 40 }}
                                onPress={() => router.push('/milk-collection/history')}
                            />
                        </View>
                    }
                />

                <Card variant="elevated" style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
                    <Input
                        label="Supplier Name / ID *"
                        value={supplier}
                        onChangeText={setSupplier}
                        placeholder="Enter farmer name or ID"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Input
                                label="Date (YYYY-MM-DD)"
                                value={date}
                                onChangeText={setDate}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Input
                                label="Time (HH:MM)"
                                value={time}
                                onChangeText={setTime}
                            />
                        </View>
                    </View>

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Shift</ThemedText>
                    {renderSelector(SHIFTS, shift, setShift)}

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 15 }]}>Milk Source</ThemedText>
                    {renderSelector(MILK_SOURCES, source, setSource)}

                    {source === 'Other' && (
                        <Input
                            label="Custom Source Name"
                            value={customSource}
                            onChangeText={setCustomSource}
                            placeholder="e.g., Camel"
                        />
                    )}

                    <Input
                        label="Fat Percentage (%) *"
                        value={fatType}
                        onChangeText={setFatType}
                        keyboardType="numeric"
                        placeholder="e.g. 4.5"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Input
                                label="SNF (%)"
                                value={snf}
                                onChangeText={setSnf}
                                keyboardType="numeric"
                                placeholder="e.g. 8.5"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Input
                                label="CLR"
                                value={clr}
                                onChangeText={setClr}
                                keyboardType="numeric"
                                placeholder="e.g. 28"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Input
                                label="Quantity (Liters)"
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="numeric"
                                placeholder="0.0"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Input
                                label="Cost per Liter (₹)"
                                value={costPerLiter}
                                onChangeText={setCostPerLiter}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />
                        </View>
                    </View>

                    <View style={[styles.totalContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>Total Cost Calculation</ThemedText>
                        <ThemedText type="title" style={{ color: theme.primary, marginTop: 4 }}>₹ {totalCost}</ThemedText>
                    </View>

                    <Button
                        title="Save Entry"
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
    totalContainer: {
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
        marginTop: 10,
    },
});
