import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="Home" 
        options={{
          title: 'Task List',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="clipboard-list" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Atarefados" 
        options={{
          title: 'User Register',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Calendario"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="calendar-alt" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
