import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, userData, loading, signOut, updateProfile } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const formatarDataNascimento = (dataString: string) => {
    if (!dataString) return 'Não informado';
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch (error) {
      return dataString;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const pickImage = async () => {
    try {
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Precisamos de permissão para acessar suas fotos!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setUploading(true);
        
        setTimeout(() => {
          const imageUrl = result.assets[0].uri;
          
          updateProfile({ avatar: imageUrl });
          
          setUploading(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Usuário não autenticado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Meu Perfil</Text>
      
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage} disabled={uploading}>
          {userData?.avatar ? (
            <Image 
              source={{ uri: userData.avatar }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={40} color="#fff" />
            </View>
          )}
          
          {uploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          
          <View style={styles.cameraIcon}>
            <Feather name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.changePhotoText}>
          Clique para {userData?.avatar ? 'alterar' : 'adicionar'} foto
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nome Completo</Text>
        <Text style={styles.value}>{userData?.nome || user.displayName || 'Não informado'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email || 'Não informado'}</Text>
        <Text style={styles.verified}>
          {user.emailVerified ? '✓ Email verificado' : '⚠ Email não verificado'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>CPF</Text>
        <Text style={styles.value}>{userData?.cpf || 'Não informado'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Data de Nascimento</Text>
        <Text style={styles.value}>
          {userData?.nascimento ? formatarDataNascimento(userData.nascimento) : 'Não informado'}
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  verified: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});