import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { TextInput, Alert, ActivityIndicator, Modal, Platform } from 'react-native';

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [form, setForm] = useState({ email: user?.email || '', oldPassword: '', newPassword: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const fetchUsers = async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    try {
      const res = await apiFetch(`/api/admin/users?adminId=${user?.id}`);
      if(res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleChangePassword = async () => {
    if (!form.email || !form.oldPassword || !form.newPassword) {
      if (Platform.OS === 'web') {
        alert('All fields are required');
      } else {
        Alert.alert('Error', 'All fields are required');
      }
      return;
    }
    
    setIsUpdating(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (res.ok) {
        if (Platform.OS === 'web') {
          alert('password succesfull change');
          setIsChangingPassword(false);
          if (logout) {
            await logout();
            router.replace('/(auth)/login');
          }
        } else {
          Alert.alert('Success', 'password succesfull change', [
            {
              text: 'OK',
              onPress: async () => {
                setIsChangingPassword(false);
                if (logout) {
                  await logout();
                  router.replace('/(auth)/login');
                }
              }
            }
          ]);
        }
      } else {
        if (Platform.OS === 'web') {
          alert(data.error || 'Failed to update password');
        } else {
          Alert.alert('Error', data.error || 'Failed to update password');
        }
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') {
        alert('Something went wrong');
      } else {
        Alert.alert('Error', 'Something went wrong');
      }
    } finally {
      setIsUpdating(false);
    }
  };

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

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={fetchUsers}
            colors={['#3B82F6']} // Android
            tintColor="#3B82F6"  // iOS
          />
        }
      >
        {/* KPI Cards */}
        <View style={styles.cardRow}>
          <View style={[styles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Ionicons name="people" size={28} color="#3B82F6" />
            <Text style={styles.kpiValue}>{totalUsers}</Text>
            <Text style={styles.kpiLabel}>Total Users</Text>
          </View>
          <TouchableOpacity 
            style={[styles.kpiCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
            onPress={() => setIsChangingPassword(true)}
          >
            <Ionicons name="shield-checkmark" size={28} color="#22C55E" />
            <Text style={styles.kpiLabel}>Change password</Text>
          </TouchableOpacity>
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

        {/* Password Change Modal */}
        <Modal
          visible={isChangingPassword}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsChangingPassword(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Admin Password</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput 
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => setForm({...form, email: v})}
                  placeholder="Enter email"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Old Password</Text>
                <TextInput 
                  style={styles.input}
                  value={form.oldPassword}
                  onChangeText={(v) => setForm({...form, oldPassword: v})}
                  placeholder="Enter old password"
                  secureTextEntry
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput 
                  style={styles.input}
                  value={form.newPassword}
                  onChangeText={(v) => setForm({...form, newPassword: v})}
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={[styles.submitBtn, isUpdating && { opacity: 0.7 }]}
                  onPress={handleChangePassword}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Update password</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={() => setIsChangingPassword(false)}
                  disabled={isUpdating}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modules Available */}
        <Text style={styles.sectionTitle}>System Modules</Text>
        <View style={styles.moduleList}>
          {['Milk Collection', 'History', 'Quality Parameters', 'Separation', 'Products', 'Suppliers', 'Sales', 'Reports'].map((mod, i) => (
            <View key={i} style={styles.moduleItem}>
              <Ionicons name="cube-outline" size={20} color="#64748B" />
              <Text style={styles.moduleText}>{mod}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
          ))}
        </View>

        {/* Manual Refresh Button at the bottom */}
        <TouchableOpacity 
          style={[styles.refreshFooterBtn, isRefreshing && { opacity: 0.7 }]}
          onPress={fetchUsers}
          disabled={isRefreshing}
        >
          <Ionicons 
            name={isRefreshing ? "sync" : "refresh-circle"} 
            size={24} 
            color="#3B82F6" 
          />
          <Text style={styles.refreshFooterText}>
            {isRefreshing ? 'Refreshing Dashboard...' : 'Refresh Dashboard Data'}
          </Text>
        </TouchableOpacity>
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
  moduleText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155', marginLeft: 12 },

  formCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 15, color: '#1E293B' },
  formActions: { marginTop: 8, gap: 12 },
  submitBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 12, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20, textAlign: 'center' },

  refreshFooterBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#EFF6FF', 
    padding: 16, 
    borderRadius: 16, 
    marginTop: 24, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 10
  },
  refreshFooterText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#3B82F6' 
  }
});
