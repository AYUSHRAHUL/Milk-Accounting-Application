import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const MILK_SOURCES = ['Cow', 'Buffalo', 'Goat', 'Other'];
const FAT_TYPES = ['Whole', 'Reduced', 'Low-fat', 'Skim'];

export default function MilkCollectionScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [supplier, setSupplier] = useState('');
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [source, setSource] = useState('Cow');
    const [customSource, setCustomSource] = useState('');
    const [fatType, setFatType] = useState('Whole');
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
        if (!supplier || !quantity || !costPerLiter || !date || (source === 'Other' && !customSource)) {
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
                    date,
                    source,
                    customSource: source === 'Other' ? customSource : undefined,
                    fatType,
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
                <View style={[styles.topDecoration, { backgroundColor: theme.primary }]} />

                <View style={styles.header}>
                    <ThemedText type="title" style={{ color: colorScheme === 'light' ? '#fff' : theme.text }}>
                        Milk Entry
                    </ThemedText>
                    <ThemedText style={{ color: colorScheme === 'light' ? 'rgba(255,255,255,0.8)' : theme.textSecondary, marginTop: 4 }}>
                        Record today's collection
                    </ThemedText>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}>
                    <Input
                        label="Supplier Name / ID"
                        value={supplier}
                        onChangeText={setSupplier}
                        placeholder="Enter farmer name or ID"
                    />

                    <Input
                        label="Date (YYYY-MM-DD)"
                        value={date}
                        onChangeText={setDate}
                        placeholder="2024-10-15"
                    />

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Milk Source</ThemedText>
                    {renderSelector(MILK_SOURCES, source, setSource)}

                    {source === 'Other' && (
                        <Input
                            label="Custom Source Name"
                            value={customSource}
                            onChangeText={setCustomSource}
                            placeholder="e.g., Camel"
                        />
                    )}

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 15 }]}>Fat Type</ThemedText>
                    {renderSelector(FAT_TYPES, fatType, setFatType)}

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
