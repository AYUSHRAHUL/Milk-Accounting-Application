import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function SuperAdminDashboardScreen() {
  const { user, logout } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchAdmins = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiFetch(`/api/super-admin/admins?superAdminId=${user?.id}`);
      if(res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAdmins();
  }, [user]);

  const totalAdmins = admins.length;

  const handleLogout = async () => {
    if (logout) {
      await logout();
      if (Platform.OS === 'web') {
        alert('successfull logout');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Logout Success', 'successfull logout', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.backBtn}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Super Admin Panel</Text>
        <TouchableOpacity 
          onPress={fetchAdmins} 
          style={styles.refreshBtn}
          disabled={isRefreshing}
        >
          <Ionicons 
            name={isRefreshing ? "sync" : "refresh"} 
            size={24} 
            color={isRefreshing ? "#94A3B8" : "#3B82F6"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.adminName}>{user?.name || 'Super Admin'}</Text>
        </View>

        {/* KPI Cards */}
        <View style={styles.cardRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
            <Ionicons name="shield-half" size={32} color="#7C3AED" />
            <Text style={styles.kpiValue}>{totalAdmins}</Text>
            <Text style={styles.kpiLabel}>Total Admins</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Main Management</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push('/super-admin/admins/add')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="person-add" size={24} color="#22C55E" />
            </View>
            <Text style={styles.actionText}>Add Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push('/super-admin/admins')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.actionText}>Manage Admins</Text>
          </TouchableOpacity>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0', 
    backgroundColor: '#FFF' 
  },
  backBtn: { padding: 8 },
  refreshBtn: { padding: 8 },
  headerTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1E293B' 
  },
  content: { padding: 20 },
  
  welcomeCard: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  adminName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },

  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  kpiCard: { 
    flex: 1, 
    padding: 24, 
    borderRadius: 24, 
    borderWidth: 1, 
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4
      }
    })
  },
  kpiValue: { fontSize: 36, fontWeight: '900', color: '#1E293B', marginTop: 12 },
  kpiLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16, marginLeft: 4 },
  
  actionGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  actionBtn: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 24, 
    alignItems: 'center', 
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' } as any,
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 12, 
        elevation: 3 
      }
    })
  },
  iconBox: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12 
  },
  actionText: { fontSize: 15, fontWeight: '700', color: '#334155' },

  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600'
  },
  summaryValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '700'
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700'
  }
});
