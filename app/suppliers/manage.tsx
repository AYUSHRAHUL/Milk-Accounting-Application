import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const ANIMAL_TYPES = ['Cow', 'Buffalo', 'Goat', 'Other'];

export default function ManageSupplierScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // Check if we are editing an existing supplier
    const params = useLocalSearchParams();
    const isEditing = !!params.id;

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [animalType, setAnimalType] = useState<string[]>(['Cow']);
    const [bankDetails, setBankDetails] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditing);

    // Pre-fill form if editing
    useEffect(() => {
        if (isEditing) {
            setName(params.name as string || '');
            setPhone(params.phone as string || '');
            setAddress(params.address as string || '');
            setAnimalType(params.animalType ? (params.animalType as string).split(',') : ['Cow']);
            setBankDetails(params.bankDetails as string || '');
            setIsFetching(false);
        }
    }, [isEditing, params]);

    const handleSave = async () => {
        if (!name || !phone || !address || animalType.length === 0) {
            Alert.alert('Missing Fields', 'Please fill in Name, Phone, Address, and at least one Animal Type.');
            return;
        }

        setIsLoading(true);
        try {
            const url = isEditing
                ? `/api/suppliers/${params.id}`
                : '/api/suppliers';

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id || 'static-user-id',
                    name,
                    phone,
                    address,
                    animalType,
                    bankDetails,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', `Supplier ${isEditing ? 'updated' : 'added'} successfully!`, [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Failed', data.message || 'Failed to save supplier.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An unexpected network error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAnimalType = (val: string) => {
        setAnimalType(prev =>
            prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]
        );
    };

    const renderSelector = (options: string[], selectedValues: string[], onToggle: (val: string) => void) => (
        <View style={styles.selectorContainer}>
            {options.map((option) => {
                const isSelected = selectedValues.includes(option);
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
                        onPress={() => onToggle(option)}
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

    if (isFetching) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.topDecoration, { backgroundColor: theme.primary }]} />

                <View style={styles.header}>
                    <ThemedText type="title" style={{ color: colorScheme === 'light' ? '#fff' : theme.text }}>
                        {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
                    </ThemedText>
                    <ThemedText style={{ color: colorScheme === 'light' ? 'rgba(255,255,255,0.8)' : theme.textSecondary, marginTop: 4 }}>
                        {isEditing ? 'Update farmer details' : 'Register a new farmer for milk collection'}
                    </ThemedText>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}>
                    <Input
                        label="Full Name *"
                        value={name}
                        onChangeText={setName}
                        placeholder="John Doe"
                    />

                    <Input
                        label="Phone Number *"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholder="+91 9876543210"
                    />

                    <Input
                        label="Address / Village *"
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Enter full address"
                        multiline
                        numberOfLines={2}
                        style={{ height: 60 }}
                    />

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>Animal Types (Select Multiple) *</ThemedText>
                    {renderSelector(ANIMAL_TYPES, animalType, toggleAnimalType)}

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <Input
                        label="Bank Details (Optional)"
                        value={bankDetails}
                        onChangeText={setBankDetails}
                        placeholder="A/C Number, IFSC Code"
                        multiline
                        numberOfLines={2}
                        style={{ height: 60 }}
                    />

                    <Button
                        title={isEditing ? "Update Supplier" : "Save Supplier"}
                        onPress={handleSave}
                        loading={isLoading}
                        style={{ marginTop: 24, backgroundColor: theme.primary }}
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
