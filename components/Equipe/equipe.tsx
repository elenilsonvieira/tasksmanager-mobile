import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IEquipe } from '../../interfaces/IEquipe';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'Data inválida';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime()) ? 
      dateObj.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }) : 'Data inválida';
  } catch {
    return 'Data inválida';
  }
};

export default function Equipe({ equipe, onDelete, onEdit }: {
  equipe: IEquipe;
  onDelete: (id: string) => void;
  onEdit: (equipe: IEquipe) => void;
}) {
  const router = useRouter();

  const handlePress = () => {
    AsyncStorage.setItem('@equipeAtual', JSON.stringify(equipe));
    router.push('/Screens/Home');
  };

  const handleActionPress = (e: any, action: 'edit' | 'delete') => {
    e.stopPropagation();
    if (action === 'edit') {
      onEdit(equipe);
    } else {
      onDelete(equipe.id);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <ImageBackground 
        source={require('../../imagens/Equipe.png')}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.name}>{equipe.nomeDaEquipe}</Text>
            <Text style={styles.date}>Criada em: {formatDate(equipe.dataHora)}</Text>
            <Text style={styles.members}>
              Membros: {equipe.membros?.length || 0} • 
              Convites: {equipe.convites?.filter(c => c.status === 'pendente').length || 0}
            </Text>
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit(equipe);
              }}
            >
              <Ionicons name="pencil-outline" size={22} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(equipe.id);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  imageStyle: {
    opacity: 0.9,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(25, 118, 210, 0.85)',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  date: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  members: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
});