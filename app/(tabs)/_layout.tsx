import React from 'react';
import { Platform } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { FontAwesome5 } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import CustomDrawerContent from '@/components/CustomDrawerContent';

const BLUE = '#5BA7FF';

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: BLUE },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        headerLeft: (props) => (
          <DrawerToggleButton {...props} tintColor="#fff" />
        ),
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        drawerStyle: {
          width: 260,
          ...(Platform.OS === 'ios' ? { paddingTop: 8 } : {}),
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)/Equipe"
        options={{
          title: 'Sistema de Equipes',
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="users" size={size ?? 22} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/Atarefados"
        options={{
          title: 'Sistema de Tarefas',
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="user" size={size ?? 22} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/Calendario"
        options={{
          title: 'Calendário',
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar-alt" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}