import { Stack, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function SuperAdminLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user?.role !== 'super-admin') {
      router.replace('/(tabs)');
    }
  }, [user, isLoading]);

  if (isLoading || user?.role !== 'super-admin') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="admins/index" />
      <Stack.Screen name="admins/add" />
    </Stack>
  );
}
