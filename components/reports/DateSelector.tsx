import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { Colors, Spacing } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

interface DateSelectorProps {
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
}

export function DateSelector({ selectedDate, onChangeDate }: DateSelectorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onChangeDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onChangeDate(next);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePrevDay} style={[styles.navButton, { backgroundColor: theme.card }]}>
        <Ionicons name="chevron-back" size={20} color={theme.text} />
      </TouchableOpacity>
      
      <View style={[styles.dateDisplay, { backgroundColor: theme.card }]}>
        <Ionicons name="calendar-outline" size={20} color={theme.primary} style={styles.calendarIcon} />
        <ThemedText style={styles.dateText}>{formatDate(selectedDate)}</ThemedText>
      </View>

      <TouchableOpacity onPress={handleNextDay} style={[styles.navButton, { backgroundColor: theme.card }]}>
        <Ionicons name="chevron-forward" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  calendarIcon: {
    marginRight: Spacing.sm,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
