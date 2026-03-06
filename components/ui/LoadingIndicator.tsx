import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewProps } from 'react-native';

type LoadingIndicatorProps = ViewProps & {
  size?: 'small' | 'large';
};

export function LoadingIndicator({ size = 'large', style, ...props }: LoadingIndicatorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, style]} {...props}>
      <ActivityIndicator size={size} color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

