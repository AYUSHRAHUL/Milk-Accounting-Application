import { ThemedText } from '@/components/themed-text';
import { Colors, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewProps } from 'react-native';

type ScreenHeaderProps = ViewProps & {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, onMenu, right, style, ...props }: ScreenHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.wrapper, style]} {...props}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />

      <View style={styles.row}>
        <View style={styles.left}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.iconButton} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : onMenu ? (
            <TouchableOpacity onPress={onMenu} style={styles.iconButton} activeOpacity={0.8}>
              <Ionicons name="menu" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}

          <View>
            <ThemedText type="title" style={styles.title}>
              {title}
            </ThemedText>
            {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
          </View>
        </View>

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
    marginBottom: 16,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    padding: 16,
    minHeight: 120,
    justifyContent: 'flex-end',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  right: {
    marginLeft: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    // kept for backwards compatibility (older screens might reference it via inline styles)
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.9)',
  },
});

