import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tarefas from '../../components/Tarefa/tarefa';
import { ITarefa } from '../../interfaces/ITarefa';

export default function Home() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [tarefas, setTarefas] = useState<ITarefa[]>([]);

  
  const loadTarefas = useCallback(async () => {
    try {
      const savedTarefas = await AsyncStorage.getItem('@tarefas');
      if (savedTarefas) {
        const parsedTarefas = JSON.parse(savedTarefas);
        const tarefasComData = parsedTarefas.map((t: any) => ({
          ...t,
          dataHora: new Date(t.dataHora)
        }));
        setTarefas(tarefasComData);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  }, []);

  
  useFocusEffect(
    useCallback(() => {
      loadTarefas();
    }, [loadTarefas])
  );


  React.useEffect(() => {
    if (params.novaTarefa) {
      const handleNovaTarefa = async () => {
        try {
          const novaTarefa = JSON.parse(params.novaTarefa as string);
          novaTarefa.dataHora = new Date(novaTarefa.dataHora);
          
          const savedTarefas = await AsyncStorage.getItem('@tarefas');
          const currentTarefas = savedTarefas ? JSON.parse(savedTarefas) : [];
          
          
          const tarefaExistente = currentTarefas.find((t: ITarefa) => t.id === novaTarefa.id);
          if (tarefaExistente) return;
          
          const updatedTarefas = [novaTarefa, ...currentTarefas];
          
          setTarefas(updatedTarefas);
          await AsyncStorage.setItem('@tarefas', JSON.stringify(updatedTarefas));
        } catch (error) {
          console.error('Erro ao adicionar tarefa:', error);
        }
      };
      
      handleNovaTarefa();
    }
  }, [params.novaTarefa]);

 
  const handleDeleteTarefa = async (id: string) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir esta tarefa?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Excluir", 
          onPress: async () => {
            try {
              const updatedTarefas = tarefas.filter(tarefa => tarefa.id !== id);
              setTarefas(updatedTarefas);
              await AsyncStorage.setItem('@tarefas', JSON.stringify(updatedTarefas));
            } catch (error) {
              console.error('Erro ao deletar tarefa:', error);
              Alert.alert("Erro", "Ocorreu um erro ao excluir a tarefa");
            }
          }
        }
      ]
    );
  };

  const handleEditTarefa = (tarefa: ITarefa) => {
    router.push({
      pathname: '/Screens/Formulario',
      params: { 
        editarTarefa: JSON.stringify(tarefa),
        id: tarefa.id
      }
    });
  };

  return (
    <View style={styles.container}>
  
      <View style={styles.navbar}>
        <Text style={styles.title}>Sistema de Tarefas</Text>
        <Text style={styles.counter}>{tarefas.length} tarefas</Text>
      </View>

      
      <View style={styles.content}>
        {tarefas.length > 0 ? (
          <FlatList
            data={tarefas}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Tarefas 
                tarefa={item} 
                onDelete={handleDeleteTarefa} 
                onEdit={handleEditTarefa}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma tarefa cadastrada</Text>
            <Text style={styles.emptySubtext}>Toque no botão + para adicionar</Text>
          </View>
        )}
      </View>

      
      <Link href="/Screens/Formulario" asChild>
        <TouchableOpacity style={styles.fab}>
          <Icon name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navbar: {
    backgroundColor: '#60A5FA',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  counter: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#60A5FA',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});