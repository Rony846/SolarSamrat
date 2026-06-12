import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bgAlt,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 6,
          paddingBottom: 26,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="index"
        options={{ title: 'Feed', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="leads"
        options={{ title: 'Leads', tabBarIcon: ({ color, size }) => <Ionicons name="briefcase" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="business"
        options={{ title: 'Business', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
