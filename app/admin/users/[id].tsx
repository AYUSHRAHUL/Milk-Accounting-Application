import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const ALL_MODULES = [
  { id: 'collection', label: 'Milk Collection' },
  { id: 'history', label: 'View Collections' },
  { id: 'production', label: 'Production' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'sales', label: 'Sales' },
  { id: 'reports', label: 'Reports' }
];

export default function EditUserScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiFetch(`/api/admin/users?adminId=${user?.id}`);
        if(res.ok) {
          const data = await res.json();
          const targetUser = data.find((u: any) => u._id === id);
          if (targetUser) {
            setFormData({
              name: targetUser.name || '',
              email: targetUser.email || '',
              password: '', // do not show password hash
              role: targetUser.role || 'user',
            });
            setSelectedModules(targetUser.modules || []);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.id && id) fetchUser();
  }, [id, user]);

  const toggleModule = (modId: string) => {
    setSelectedModules(prev => 
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in Name and Email');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        modules: selectedModules
      };
      // Only send password if we are resetting it
      if (formData.password) payload.password = formData.password;

      // Note: Admin routes require adminId
      const res = await apiFetch(`/api/admin/users/${id}?adminId=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if(res.ok) {
        Alert.alert('Success', 'User details updated');
        router.back();
      } else {
        Alert.alert('Error', data.error || 'Failed to update user');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit User</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="John Doe" 
            value={formData.name} 
            onChangeText={v => setFormData({...formData, name: v})} 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="john@example.com" 
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email} 
            onChangeText={v => setFormData({...formData, email: v})} 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>New Password (Leave blank to keep current)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="New secure password" 
            secureTextEntry
            value={formData.password} 
            onChangeText={v => setFormData({...formData, password: v})} 
          />
        </View>



        <View style={styles.formGroup}>
          <Text style={styles.label}>Module Access Permissions</Text>
          <View style={styles.modulesContainer}>
            {ALL_MODULES.map(mod => (
              <View key={mod.id} style={styles.moduleRow}>
                <Text style={styles.moduleLabel}>{mod.label}</Text>
                <Switch 
                  value={selectedModules.includes(mod.id)} 
                  onValueChange={() => toggleModule(mod.id)} 
                  trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                  thumbColor={selectedModules.includes(mod.id) ? '#2563EB' : '#94A3B8'}
                />
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, isSaving && { opacity: 0.7 }]} 
          onPress={handleSave} 
          disabled={isSaving}
        >
          <Text style={styles.submitBtnText}>{isSaving ? 'Updating...' : 'Save Changes'}</Text>
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

  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, color: '#1E293B', fontWeight: '600' },
  


  modulesContainer: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  moduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  moduleLabel: { fontSize: 16, fontWeight: '600', color: '#1E293B' },

  submitBtn: { backgroundColor: '#2563EB', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 12, marginBottom: 32 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
