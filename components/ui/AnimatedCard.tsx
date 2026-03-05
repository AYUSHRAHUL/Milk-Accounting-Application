import React, { useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps } from 'react-native';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function AnimatedCard({ children, style, ...rest }: TouchableOpacityProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: any) => {
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 40,
        }).start();
        rest.onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 12,
            speed: 20,
        }).start();
        rest.onPressOut?.(e);
    };

    return (
        <AnimatedTouchable
            {...rest}
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[style, { transform: [{ scale }] }]}
        >
            {children}
        </AnimatedTouchable>
    );
}
