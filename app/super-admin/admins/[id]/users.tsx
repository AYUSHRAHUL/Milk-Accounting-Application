import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminUserManagementScreen() {
  const { user } = useAuth();
  const { id: adminId, adminName } = useLocalSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch(`/api/super-admin/admins/${adminId}/users?superAdminId=${user?.id}`);
      if(res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminId) fetchUsers();
  }, [adminId]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete User', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          // Re-using the normal admin delete check but super admin is doing it.
          // In index.ts, requireAdmin also allows super-admin.
          const res = await apiFetch(`/api/admin/users/${id}?adminId=${user?.id}`, { method: 'DELETE' });
          if(res.ok) {
            fetchUsers();
          } else {
            Alert.alert('Error', 'Could not delete user');
          }
        } catch(e) { console.error(e); }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.role.toUpperCase()}</Text>
          </View>
          <Text style={styles.modulesText}>{item.modules?.length || 0} Modules</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Users of</Text>
          <Text style={styles.headerSub}>{adminName}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: `/super-admin/admins/${adminId}/add-user` as any,
            params: { adminName }
          })} 
          style={styles.addBtn}
        >
          <Ionicons name="add" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No users under this admin</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  backBtn: { padding: 8 },
  headerTitles: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  headerSub: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
  
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#475569' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  email: { fontSize: 13, color: '#64748B', marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#2563EB' },
  modulesText: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  deleteBtn: { padding: 8 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#94A3B8', fontWeight: '600' }
});
