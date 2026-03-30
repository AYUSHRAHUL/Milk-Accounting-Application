import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiFetch(`/api/admin/users?adminId=${user?.id}`);
        if(res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (user?.id) fetchUsers();
  }, [user]);

  const totalUsers = users.length;
  const activeAdmins = users.filter(u => u.role === 'admin').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* KPI Cards */}
        <View style={styles.cardRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Ionicons name="people" size={28} color="#3B82F6" />
            <Text style={styles.kpiValue}>{totalUsers}</Text>
            <Text style={styles.kpiLabel}>Total Users</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Ionicons name="shield-checkmark" size={28} color="#22C55E" />
            <Text style={styles.kpiValue}>{activeAdmins}</Text>
            <Text style={styles.kpiLabel}>Admins</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push('/admin/users/add')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="person-add" size={24} color="#2563EB" />
            </View>
            <Text style={styles.actionText}>Add User</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push('/admin/users')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="people-circle" size={24} color="#D97706" />
            </View>
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>
        </View>

        {/* Modules Available */}
        <Text style={styles.sectionTitle}>System Modules</Text>
        <View style={styles.moduleList}>
          {['Milk Collection', 'History', 'Production', 'Suppliers', 'Sales', 'Reports'].map((mod, i) => (
            <View key={i} style={styles.moduleItem}>
              <Ionicons name="cube-outline" size={20} color="#64748B" />
              <Text style={styles.moduleText}>{mod}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#1E293B' },
  content: { padding: 16 },
  
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  kpiCard: { flex: 1, padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  kpiValue: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginTop: 8 },
  kpiLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 12, marginLeft: 4 },
  
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionText: { fontSize: 14, fontWeight: '700', color: '#334155' },

  moduleList: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  moduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  moduleText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155', marginLeft: 12 }
});
