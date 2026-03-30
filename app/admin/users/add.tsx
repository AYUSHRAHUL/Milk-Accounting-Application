import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

const ALL_MODULES = [
  { id: 'collection', label: 'Milk Collection' },
  { id: 'history', label: 'History' },
  { id: 'production', label: 'Production' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'sales', label: 'Sales' },
  { id: 'reports', label: 'Reports' }
];

export default function AddUserScreen() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  
  const [selectedModules, setSelectedModules] = useState<string[]>(['collection', 'history', 'production', 'suppliers', 'sales', 'reports']);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const toggleModule = (modId: string) => {
    setSelectedModules(prev => 
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/admin/users?adminId=${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          modules: selectedModules
        })
      });

      const data = await res.json();
      if(res.ok) {
        Alert.alert('Success', 'User has been created');
        router.back();
      } else {
        Alert.alert('Error', data.error || 'Failed to create user');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New User</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="John Doe" 
              value={formData.name} 
              onChangeText={v => setFormData({...formData, name: v})} 
              onFocus={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
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
              onFocus={() => scrollRef.current?.scrollTo({ y: 80, animated: true })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Strong password" 
              secureTextEntry
              value={formData.password} 
              onChangeText={v => setFormData({...formData, password: v})} 
              onFocus={() => scrollRef.current?.scrollTo({ y: 160, animated: true })}
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
            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} 
            onPress={handleSave} 
            disabled={isLoading}
          >
            <Text style={styles.submitBtnText}>{isLoading ? 'Creating...' : 'Create User'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
