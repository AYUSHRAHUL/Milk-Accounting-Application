import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import {
    KeyboardTypeOptions,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

interface InputProps extends TextInputProps {
    label: string;
    error?: string;
    keyboardType?: KeyboardTypeOptions;
}

export const Input = ({ label, error, style, ...props }: InputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        color: theme.text,
                        backgroundColor: theme.card,
                        borderColor: error ? theme.error : isFocused ? theme.primary : theme.border,
                        shadowColor: isFocused ? theme.primary : 'transparent',
                    },
                    isFocused && styles.inputFocused,
                    style,
                ]}
                placeholderTextColor={theme.icon}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                {...props}
            />
            {error ? <Text style={[styles.error, { color: theme.error }]}>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 54,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        elevation: 0,
    },
    inputFocused: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    error: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
});
