import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ManageAdminsScreen() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmins = async () => {
    try {
      const res = await apiFetch(`/api/super-admin/admins?superAdminId=${user?.id}`);
      if(res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAdmins();
  }, [user]);

  const renderAdminItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
        <View style={styles.stat}>
          <Ionicons name="cube-outline" size={16} color="#64748B" />
          <Text style={styles.statText}>{item.modules?.length || 0} Modules</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="people-outline" size={16} color="#64748B" />
          <Text style={styles.statText}>{item.userCount || 0} Users</Text>
        </View>
        <TouchableOpacity 
          style={styles.manageBtn}
          onPress={() => router.push({
            pathname: `/super-admin/admins/${item._id}/users`,
            params: { adminName: item.name }
          })}
        >
          <Text style={styles.manageBtnText}>Manage Users</Text>
          <Ionicons name="arrow-forward" size={16} color="#2563EB" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admins</Text>
        <TouchableOpacity onPress={() => router.push('/super-admin/admins/add')} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item._id}
          renderItem={renderAdminItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No admins found</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/super-admin/admins/add')}
              >
                <Text style={styles.emptyBtnText}>Add Your First Admin</Text>
              </TouchableOpacity>
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#1E293B' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 16 },
  
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#3B82F6' },
  info: { flex: 1, marginLeft: 16 },
  name: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  email: { fontSize: 14, color: '#64748B', marginTop: 2 },
  actionBtn: { padding: 8 },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  manageBtnText: { fontSize: 14, fontWeight: '800', color: '#2563EB' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#94A3B8', marginTop: 16 },
  emptyBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EFF6FF' },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#2563EB' }
});
