import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    textStyle?: TextStyle | TextStyle[];
}

export const Button = ({ title, loading, style, textStyle, ...props }: ButtonProps) => {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: theme.primary, shadowColor: theme.primary },
                props.disabled && styles.disabled,
                style,
            ]}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={[styles.text, { color: '#FFFFFF' }, textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 12,
        width: '100%',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5, // For Android
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    disabled: {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
});
