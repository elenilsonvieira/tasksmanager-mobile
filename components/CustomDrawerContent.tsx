import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function CustomDrawerContent(props: any) {
  const { user, userData } = useAuth();
  const router = useRouter();

  const handleProfilePress = () => {
    props.navigation.closeDrawer();
    router.navigate('/Screens/Perfil');
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <TouchableOpacity style={styles.profileSection} onPress={handleProfilePress}>
          {userData?.avatar ? (
            <Image 
              source={{ uri: userData.avatar }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userData?.nome?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            </View>
          )}
          
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {userData?.nome || user?.displayName || 'Usuário'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email || 'E-mail não disponível'}
            </Text>
          </View>
        </TouchableOpacity>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
});