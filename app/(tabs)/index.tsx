import { ThemedText } from '@/components/themed-text';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Dashboard"
        subtitle="Milk accounting overview"
        onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
      />

      <View style={styles.grid}>
        <AnimatedCard
          style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
          onPress={() => router.push('/milk-collection')}
        >
          <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>Milk Collection</ThemedText>
          <View style={styles.iconContainer}>
            <Ionicons name="pint" size={32} color={theme.primary} />
          </View>
        </AnimatedCard>

        <AnimatedCard
          style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
          onPress={() => router.push('/milk-collection/history')}
        >
          <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>View Collections</ThemedText>
          <View style={styles.iconContainer}>
            <Ionicons name="list" size={32} color={theme.primary} />
          </View>
        </AnimatedCard>

        <AnimatedCard
          style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
          onPress={() => router.push('/suppliers')}
        >
          <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>Suppliers</ThemedText>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={32} color={theme.secondary} />
          </View>
        </AnimatedCard>

        <AnimatedCard
          style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
          onPress={() => router.push('/products')}
        >
          <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>Products</ThemedText>
          <View style={styles.iconContainer}>
            <Ionicons name="cube" size={32} color={theme.warning} />
          </View>
        </AnimatedCard>

        <AnimatedCard
          style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
          onPress={() => router.push('/sales')}
        >
          <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>Sales</ThemedText>
          <View style={styles.iconContainer}>
            <Ionicons name="cash" size={32} color={theme.warning} />
          </View>
        </AnimatedCard>

        <AnimatedCard
          style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
          onPress={() => router.push('/(tabs)/reports')}
        >
          <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>Reports</ThemedText>
          <View style={styles.iconContainer}>
            <Ionicons name="stats-chart" size={32} color={theme.success} />
          </View>
        </AnimatedCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  card: {
    width: '47%',
    padding: Spacing.xl,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardValue: {
    marginTop: Spacing.md,
    fontSize: 28,
  },
  iconContainer: {
    marginTop: Spacing.md,
    alignItems: 'flex-start',
  },
});
