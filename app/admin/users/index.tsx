import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function UserListScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

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

  useEffect(() => {
    if (user?.id) fetchUsers();
  }, [user]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete User', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
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
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: item.role === 'admin' ? '#FEE2E2' : '#E0E7FF' }]}>
              <Text style={[styles.badgeText, { color: item.role === 'admin' ? '#DC2626' : '#4338CA' }]}>{item.role.toUpperCase()}</Text>
            </View>
            <Text style={styles.moduleCount}>{item.modules?.length || 0} Modules</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/admin/users/${item._id}`)}>
          <Ionicons name="create-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
        {item._id !== user?.id && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id, item.name)}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <TouchableOpacity onPress={() => router.push('/admin/users/add')} style={styles.addBtn}>
          <Ionicons name="add" size={26} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={users}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#1E293B' },
  addBtn: { padding: 8 },
  list: { padding: 16 },

  userCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#1E40AF' },
  details: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  userEmail: { fontSize: 13, color: '#64748B', marginVertical: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  moduleCount: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }
});
