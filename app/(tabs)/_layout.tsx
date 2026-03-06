import React from 'react';

import { AppDrawerContent } from '@/components/navigation/AppDrawerContent';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Drawer } from 'expo-router/drawer';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: theme.surface,
          width: 320,
        },
        sceneContainerStyle: {
          backgroundColor: theme.background,
        },
      }}>
      <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="explore" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="reports" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="report-milk" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="report-sales" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="report-products" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="report-suppliers" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="report-milk-visuals" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="report-sales-visuals" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="report-products-visuals" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="report-suppliers-visuals" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="profile" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="help" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="support" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="support-chat" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="about" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
