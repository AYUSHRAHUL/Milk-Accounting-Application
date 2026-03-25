import { Stack, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin' && user?.role !== 'super-admin') {
      router.replace('/(tabs)');
    }
  }, [user, isLoading]);

  if (isLoading || (user?.role !== 'admin' && user?.role !== 'super-admin')) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
    </Stack>
  );
}
