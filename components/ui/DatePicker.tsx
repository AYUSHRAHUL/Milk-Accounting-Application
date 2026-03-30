import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DatePickerProps {
    value: string; // Expected format: YYYY-MM-DD or DD/MM/YYYY
    onChange: (date: string) => void;
    label?: string;
    format?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'DD-MM-YYYY';
    style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    label,
    format = 'YYYY-MM-DD',
    style,
}) => {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    // Parse the current value into a Date object
    const getDateObject = (dateStr: string): Date => {
        if (!dateStr) return new Date();
        
        try {
            if (dateStr.includes('/')) {
                const [dd, mm, yyyy] = dateStr.split('/').map(Number);
                return new Date(yyyy, mm - 1, dd);
            } else if (dateStr.includes('-')) {
                const parts = dateStr.split('-').map(Number);
                if (parts[0] > 1000) {
                    // YYYY-MM-DD
                    return new Date(parts[0], parts[1] - 1, parts[2]);
                } else {
                    // DD-MM-YYYY
                    return new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
        } catch (e) {
            console.error('Error parsing date:', e);
        }
        return new Date();
    };

    const formatDate = (date: Date): string => {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();

        if (format === 'DD/MM/YYYY') {
            return `${dd}/${mm}/${yyyy}`;
        }
        if (format === 'DD-MM-YYYY') {
            return `${dd}-${mm}-${yyyy}`;
        }
        return `${yyyy}-${mm}-${dd}`;
    };

    const [show, setShow] = useState(false);
    const [viewDate, setViewDate] = useState(() => getDateObject(value));

    // The original onDateChange function was likely for a native DateTimePicker.
    // Since a custom calendar is being rendered, this function is no longer needed
    // or should be adapted if a native picker is still used for specific platforms.
    // For now, it's removed as per the instruction's implied cleanup.
    // If a native picker is still intended for Android/iOS, this function would need to be re-implemented.
    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        // This function is now empty as the custom calendar handles date selection.
        // If a native picker is still used (e.g., for Android), its logic would go here.
        if (Platform.OS === 'android') {
            setShow(false);
        }
    };

    // Handle Month Navigation
    const changeMonth = (offset: number) => {
        const nextDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(nextDate);
    };

    const handlePress = () => {
        setViewDate(getDateObject(value));
        setShow(true);
    };

    const handleSelectDay = (day: number, isCurrentMonth: boolean) => {
        let selectedDate: Date;
        if (isCurrentMonth) {
            selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        } else if (day > 20) {
           // Clicked previous month day
            selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, day);
        } else {
            // Clicked next month day
            selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, day);
        }
        onChange(formatDate(selectedDate));
        setShow(false);
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const selectedObj = getDateObject(value);
        const isCurrentSelection = selectedObj.getFullYear() === year && selectedObj.getMonth() === month;

        // Calendar Logic
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const calendarDays = [];
        
        // Prev Month Padding
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            calendarDays.push({ day: daysInPrevMonth - i, current: false });
        }
        
        // Current Month
        for (let i = 1; i <= daysInMonth; i++) {
            calendarDays.push({ day: i, current: true });
        }
        
        // Next Month Padding (upto 42 cells for 6 rows)
        const remainingCells = 42 - calendarDays.length;
        for (let i = 1; i <= remainingCells; i++) {
            calendarDays.push({ day: i, current: false });
        }

        const monthName = viewDate.toLocaleString('default', { month: 'long' });
        const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        return (
            <View style={[styles.calendarBox, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                {/* Header */}
                <View style={styles.calHeader}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                    <Text style={[styles.monthLabel, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                        {monthName} {year}
                    </Text>
                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                    </TouchableOpacity>
                </View>

                {/* Weekdays */}
                <View style={styles.weekRow}>
                    {weekDays.map(d => (
                        <Text key={d} style={[styles.weekLabel, { color: isDark ? '#64748B' : '#475569' }]}>{d}</Text>
                    ))}
                </View>

                {/* Grid */}
                <View style={styles.gridContainer}>
                    {calendarDays.map((item, idx) => {
                        const isSelected = isCurrentSelection && item.current && selectedObj.getDate() === item.day;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.dayCell, isSelected && { backgroundColor: '#312E81', borderRadius: 8 }]}
                                onPress={() => handleSelectDay(item.day, item.current)}
                            >
                                <Text style={[
                                    styles.dayText, 
                                    { color: item.current ? (isDark ? '#CBD5E1' : '#1E293B') : (isDark ? '#475569' : '#94A3B8') },
                                    isSelected && { color: '#FFFFFF', fontWeight: '800' }
                                ]}>
                                    {item.day}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={[styles.label, { color: isDark ? '#94A3B8' : '#374151' }]}>{label}</Text>}
            <TouchableOpacity
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: isDark ? '#1F2937' : '#E2E8F0',
                    },
                ]}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={theme.primary}
                    style={{ marginRight: 10 }}
                />
                <Text style={[styles.dateText, { color: isDark ? '#F8FAFC' : '#111827' }]} numberOfLines={1}>
                    {value || formatDate(new Date())}
                </Text>
            </TouchableOpacity>

            <Modal
                transparent={true}
                visible={show}
                animationType="fade"
                onRequestClose={() => setShow(false)}
            >
                <TouchableOpacity 
                    style={styles.overlay} 
                    activeOpacity={1} 
                    onPress={() => setShow(false)}
                >
                    <View onStartShouldSetResponder={() => true} style={styles.modalContentWrapper}>
                        {renderCalendar()}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    label: { fontSize: 13, fontWeight: '500', marginBottom: 4, marginLeft: 0 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        width: '100%',
        overflow: 'hidden', 
    },
    dateText: { fontSize: 14, fontWeight: '600' },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContentWrapper: {
        width: '100%',
        maxWidth: 350,
    },
    calendarBox: {
        borderRadius: 24,
        padding: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
    },
    calHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthLabel: { fontSize: 16, fontWeight: '700' },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    weekLabel: {
        width: 40,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 0,
    },
    dayCell: {
        width: '14.28%',
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 15,
        fontWeight: '500',
    },
});
