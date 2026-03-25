import { ExcelReportEntry, ExcelReportTable } from '@/components/reports/ExcelReportTable';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiFetch } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DetailedReportScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const isDark = colorScheme === 'dark';
    const { width } = useWindowDimensions();

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [entries, setEntries] = useState<ExcelReportEntry[]>([]);

    const fetchDetailedReports = async () => {
        try {
            const response = await apiFetch(`/api/reports/complete?userId=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                setEntries(data);
            } else {
                Alert.alert('Error', 'Failed to fetch detailed reports');
            }
        } catch (error) {
            console.error('Fetch Detailed Error:', error);
            Alert.alert('Error', 'An error occurred while fetching reports');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchDetailedReports();
        }
    }, [user?.id]);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchDetailedReports();
    };


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Premium Header */}
            <LinearGradient
                colors={isDark ? ['#111827', '#1F2937'] : ['#16A34A', '#22C55E']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <ThemedText style={styles.headerTitle}>Detailed Analysis</ThemedText>
                        <ThemedText style={styles.headerSub}>Report for: {new Date().toLocaleDateString('en-GB')}</ThemedText>
                    </View>
                    <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                        {isRefreshing ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="refresh" size={20} color="#FFF" />}
                    </TouchableOpacity>
                </View>

            </LinearGradient>

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <ThemedText style={{ marginTop: 10, color: theme.textSecondary }}>Analysing milk data...</ThemedText>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {entries.length > 0 ? (
                        <ExcelReportTable entries={entries} />
                    ) : (
                        <ScrollView
                            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                            contentContainerStyle={styles.emptyContainer}
                        >
                            <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}>
                                <Ionicons name="document-text-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                            </View>
                            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No granular data found for the selected period.</ThemedText>
                        </ScrollView>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
    },
    cardIconBox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    cardValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFF',
    },
    cardLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        maxWidth: 200,
    },
});
