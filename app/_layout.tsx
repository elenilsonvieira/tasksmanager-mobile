import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false, 
        headerTitleAlign: 'center', 
        headerTintColor: '#fff', 
        headerStyle: {
          backgroundColor: '#60A5FA', 
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackVisible: false, 
      }}
    >
      {user ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      )}
      
      <Stack.Screen 
        name="+not-found" 
        options={{ 
          title: 'Página não encontrada',
          headerShown: true
        }} 
      />
      
      <Stack.Screen
        name="Screens/FormularioEquipe"
        options={{
          title: 'Nova Equipe',
          headerShown: true,
          presentation: 'modal', 
        }}
      />
      
      <Stack.Screen
        name="Screens/Formulario"
        options={{
          title: 'Nova Tarefa',
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="Screens/FormAtarefado"
        options={{
          title: 'Nova Atarefado',
          headerShown: true,
          presentation: 'modal', 
        }}
      />

       <Stack.Screen
        name="Screens/Perfil"
        options={{
          title: 'Perfil',
          headerShown: true,
          presentation: 'modal', 
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider> 
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthLayout />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </AuthProvider>
  );
}