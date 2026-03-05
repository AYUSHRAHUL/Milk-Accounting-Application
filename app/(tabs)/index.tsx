import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, '#6366F1']} // Rich indigo gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topDecoration}
      />

      <ThemedView style={styles.header}>
        <View>
          <ThemedText type="title" style={{ color: colorScheme === 'light' ? '#fff' : theme.text }}>
            Admin Dashboard
          </ThemedText>
          <ThemedText style={[styles.welcomeText, { color: colorScheme === 'light' ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>
            Welcome back, {user?.name}!
          </ThemedText>
        </View>
        <Button
          title="Log Out"
          onPress={logout}
          style={[styles.logoutButton, { backgroundColor: colorScheme === 'light' ? 'rgba(255,255,255,0.2)' : theme.card }]}
          textStyle={{ color: colorScheme === 'light' ? '#fff' : theme.error }}
        />
      </ThemedView>

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
          onPress={() => router.push('/reports')}
        >
          <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>Reports</ThemedText>
          <View style={styles.iconContainer}>
            <Ionicons name="bar-chart" size={32} color={theme.success} />
          </View>
        </AnimatedCard>

        <AnimatedCard
          style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.textSecondary }]}
          onPress={() => router.push('/expenses')}
        >
          <ThemedText style={{ color: theme.textSecondary, fontWeight: '600' }}>Expenses</ThemedText>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet" size={32} color={theme.error} />
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
  },
  topDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 40, // Safe area
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  welcomeText: {
    marginTop: 4,
    fontSize: 15,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 'auto',
    marginVertical: 0,
    height: 40,
    borderRadius: 20,
    elevation: 0,
    shadowOpacity: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 10,
  },
  card: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardValue: {
    marginTop: 12,
    fontSize: 28,
  },
  iconContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
});
