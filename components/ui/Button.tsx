import { Colors, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
    Pressable,
    PressableProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends PressableProps {
    title: string;
    loading?: boolean;
    textStyle?: TextStyle | TextStyle[];
    variant?: ButtonVariant;
}

export const Button = ({ title, loading, style, textStyle, variant = 'primary', ...props }: ButtonProps) => {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const containerBase: ViewStyle = {
        borderRadius: Radii.md,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        width: '100%',
    };

    const variantStyle: ViewStyle =
        variant === 'primary'
            ? { backgroundColor: theme.primary, shadowColor: theme.shadow, borderWidth: 1, borderColor: 'transparent' }
            : variant === 'secondary'
                ? { backgroundColor: theme.secondary, shadowColor: theme.shadow, borderWidth: 1, borderColor: 'transparent' }
                : variant === 'danger'
                    ? { backgroundColor: theme.error, shadowColor: theme.shadow, borderWidth: 1, borderColor: 'transparent' }
                    : variant === 'outline'
                        ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border }
                        : { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent' };

    const titleColor =
        variant === 'outline' || variant === 'ghost'
            ? theme.text
            : '#FFFFFF';

    return (
        <Pressable
            accessibilityRole="button"
            disabled={props.disabled || loading}
            style={(state) => {
                const resolvedStyle = typeof style === 'function' ? style(state) : style;
                return [
                    containerBase,
                    variantStyle,
                    styles.shadow,
                    state.pressed && styles.pressed,
                    (props.disabled || loading) && styles.disabled,
                    resolvedStyle,
                ];
            }}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={titleColor} />
            ) : (
                <Text style={[styles.text, { color: titleColor }, textStyle]}>{title}</Text>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
        fontWeight: '700',
    },
    shadow: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 3,
    },
    pressed: {
        transform: [{ scale: 0.99 }],
        opacity: 0.92,
    },
    disabled: {
        opacity: 0.55,
    },
});
