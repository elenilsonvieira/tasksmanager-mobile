import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tarefas from '@/components/Tarefa/tarefa';
import { ITarefa } from '@/interfaces/ITarefa';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import Calendario from '@/components/Calendario/calendario';
import Toast from 'react-native-toast-message';

const STORAGE_KEY = '@tarefas';


export default function Home() {
  const [tarefas, setTarefas] = useState<ITarefa[]>([]);
  const [showCalendario, setShowCalendario] = useState(false);
  const router = useRouter();

  const verificarTarefasAtrasadas = (lista: ITarefa[]) => {
    const agora = new Date();
    return lista.map(tarefa => {
      if (
        tarefa.status.toLowerCase() === 'pendente' &&
        new Date(tarefa.dataEntrega) < agora
      ) {
        return { ...tarefa, status: 'Atrasada' };
      }
      return tarefa;
    });
  };

  const carregarTarefas = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const lista = JSON.parse(data) as ITarefa[];

        const listaValida = lista.filter(tarefa =>
          tarefa.id && tarefa.nomeDaTarefa && tarefa.status && tarefa.dataEntrega && tarefa.dataHora
        );

        const listaCorrigida = listaValida.map(tarefa => ({
          ...tarefa,
          dataHora: new Date(tarefa.dataHora),
          dataEntrega: new Date(tarefa.dataEntrega),
        }));

        const atualizada = verificarTarefasAtrasadas(listaCorrigida);
        setTarefas(atualizada);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(atualizada));
      } catch (err) {
        console.error("Erro ao carregar tarefas:", err);
        setTarefas([]);
      }
    }
  };

  const handleDeleteTarefa = (id: string) => {
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
          style: "destructive",
          onPress: async () => {
            const novas = tarefas.filter(tarefa => tarefa.id !== id);
            setTarefas(novas);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novas));
            Toast.show({
              type: 'info',
              text1: 'Sucesso!',
              text2: 'Tarefa excluída com sucesso!',
              text1Style: {
                fontSize: 13,
              },
              text2Style: {
                fontSize: 11,
              },
              visibilityTime: 3000,
            });
          }
        }
      ]
    );
  };

  const handleEditTarefa = (tarefa: ITarefa) => {
    router.push({
      pathname: '/Screens/Formulario',
      params: { editarTarefa: JSON.stringify(tarefa), id: tarefa.id },
    });
  };

  const handleToggleConcluida = async (id: string) => {
    const novas = tarefas.map(tarefa =>
      tarefa.id === id ? { ...tarefa, status: 'Concluída' } : tarefa
    );
    setTarefas(novas);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novas));
  };

  useEffect(() => {
    carregarTarefas();
    const interval = setInterval(() => {
      carregarTarefas();
    }, 10 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDayPress = (day: string) => {
    const filteredTarefas = tarefas.filter(tarefa => {
      const tarefaDate = new Date(tarefa.dataEntrega).toISOString().split('T')[0];
      return tarefaDate === day;
    });
    const [year, month, dayOfMonth] = day.split('-');
    const formattedDate = `${dayOfMonth}/${month}/${year}`;

    if (filteredTarefas.length > 0) {
      alert(
        `Tarefas para entregar em ${formattedDate}:
` +
        filteredTarefas.map(t => `• ${t.nomeDaTarefa} (${t.status})`).join('\n')
      );
    } else {
      alert(`Não há tarefas para entregar em ${formattedDate}`);
    }
  };

  const ordenarTarefas = (lista: ITarefa[]) => {
    const prioridade = { 'Atrasada': 1, 'Pendente': 2, 'Concluída': 3 } as const;
    return [...lista].sort((a, b) => {
      const prioridadeA = prioridade[a.status as keyof typeof prioridade] || 99;
      const prioridadeB = prioridade[b.status as keyof typeof prioridade] || 99;

      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;

      return new Date(a.dataEntrega).getTime() - new Date(b.dataEntrega).getTime();
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Sistema de Tarefas</Text>
        <Text style={styles.counter}>{tarefas.length} tarefas</Text>
      </View>

      <FlatList
        data={ordenarTarefas(tarefas)}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Tarefas
            tarefa={item}
            onDelete={handleDeleteTarefa}
            onEdit={handleEditTarefa}
            onToggleConcluida={handleToggleConcluida}
          />
        )}
        contentContainerStyle={styles.listContainer}
      />


      <Link href="/Screens/Formulario" asChild>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </Link>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#60A5FA',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
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
  listContainer: {
    padding: 16,
    paddingBottom: 80,
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
  calendarButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    backgroundColor: '#60A5FA',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});