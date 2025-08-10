
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { ITarefa } from '../../interfaces/ITarefa';
import Tarefas from '@/components/Tarefa/tarefa';

type DotKey = 'atrasada' | 'pendente' | 'concluida';
type Dot = { key: DotKey; color: string };

const DOTS: Record<DotKey, Dot> = {
  atrasada:  { key: 'atrasada',  color: '#ef4444' }, 
  pendente:  { key: 'pendente',  color: '#f59e0b' },
  concluida: { key: 'concluida', color: '#22c55e' }, 
};

export default function Calendario() {
  const router = useRouter();

  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [tarefas, setTarefas] = useState<ITarefa[]>([]);
  const [tarefasFiltradas, setTarefasFiltradas] = useState<ITarefa[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<string>('');

  const buildMarks = (lista: ITarefa[]) => {
    const marks: Record<string, { dots: Dot[] }> = {};
    lista.forEach((t) => {
      if (!t.dataEntrega) return;
      const key = new Date(t.dataEntrega).toISOString().split('T')[0];

      let dot: Dot = DOTS.pendente;
      if (t.status === 'Atrasada') dot = DOTS.atrasada;
      else if (t.status === 'Concluída') dot = DOTS.concluida;

      if (!marks[key]) {
        marks[key] = { dots: [dot] };
      } else if (!marks[key].dots.some((d) => d.key === dot.key)) {
        marks[key].dots.push(dot);
      }
    });
    return marks;
  };

  const loadTarefas = async () => {
    const dados = await AsyncStorage.getItem('@tarefas');
    const lista: ITarefa[] = dados ? JSON.parse(dados) : [];
    setTarefas(lista);
    setMarkedDates(buildMarks(lista));
  };

  const filtrarPorData = useCallback(
    (dateString: string) => {
      setDataSelecionada(dateString);
      const filtradas = tarefas.filter((t) => {
        const k = new Date(t.dataEntrega).toISOString().split('T')[0];
        return k === dateString;
      });
      setTarefasFiltradas(filtradas);
    },
    [tarefas]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadTarefas();
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await loadTarefas();
        if (dataSelecionada) filtrarPorData(dataSelecionada);
      })();
    }, [dataSelecionada, filtrarPorData])
  );

  const handleEdit = (tarefa: ITarefa) => {
    router.push(`/Screens/Formulario?id=${encodeURIComponent(tarefa.id)}`);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Excluir tarefa', 'Tem certeza que deseja excluir esta tarefa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const dados = await AsyncStorage.getItem('@tarefas');
          const lista: ITarefa[] = dados ? JSON.parse(dados) : [];
          const nova = lista.filter((t) => t.id !== id);
          await AsyncStorage.setItem('@tarefas', JSON.stringify(nova));

          setTarefas(nova);
          setMarkedDates(buildMarks(nova));
          if (dataSelecionada) filtrarPorData(dataSelecionada);

          Toast.show({
            type: 'info',
            text1: 'Sucesso!',
            text2: 'Tarefa excluída com sucesso.',
            text1Style: { fontSize: 13 },
            text2Style: { fontSize: 11 },
            visibilityTime: 3000,
            autoHide: true,
            topOffset: 70,
          });
        },
      },
    ]);
  };

  const handleToggleConcluida = async (id: string) => {
    const dados = await AsyncStorage.getItem('@tarefas');
    const lista: ITarefa[] = dados ? JSON.parse(dados) : [];
    const nova = lista.map((t) => (t.id === id ? { ...t, status: 'Concluída' } : t));
    await AsyncStorage.setItem('@tarefas', JSON.stringify(nova));

    setTarefas(nova);
    setMarkedDates(buildMarks(nova));
    if (dataSelecionada) filtrarPorData(dataSelecionada);

    Toast.show({
      type: 'info',
      text1: 'Sucesso!',
      text2: 'Tarefa marcada como concluída.',
      text1Style: { fontSize: 13 },
      text2Style: { fontSize: 11 },
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 70,
    });
  };

  const markedWithSelection = useMemo(() => {
    if (!dataSelecionada) return markedDates;
    return {
      ...markedDates,
      [dataSelecionada]: {
        ...(markedDates[dataSelecionada] || {}),
        selected: true,
        selectedColor: '#60A5FA',
      },
    };
  }, [markedDates, dataSelecionada]);

  const renderItem = ({ item }: { item: ITarefa }) => (
    <Tarefas
      tarefa={item}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onToggleConcluida={handleToggleConcluida}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendário de Entregas</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#60A5FA" />
      ) : (
        <Calendar
          markingType="multi-dot"
          markedDates={markedWithSelection}
          onDayPress={(day) => filtrarPorData(day.dateString)}
          theme={{
            selectedDayBackgroundColor: '#60A5FA',
            todayTextColor: '#60A5FA',
            arrowColor: '#60A5FA',
            textMonthFontWeight: 'bold',
          }}
        />
      )}

      {dataSelecionada ? (
        <>
          <Text style={styles.subtitle}>
            Tarefas em {new Date(dataSelecionada).toLocaleDateString('pt-BR')}
          </Text>

          {tarefasFiltradas.length === 0 ? (
            <Text style={styles.empty}>Nenhuma tarefa para esta data.</Text>
          ) : (
            <FlatList
              data={tarefasFiltradas}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
            />
          )}
        </>
      ) : (
        <Text style={styles.helper}>Selecione uma data para ver as tarefas.</Text>
      )}

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  subtitle: { marginTop: 20, fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 10 },
  helper: { textAlign: 'center', color: '#666', marginTop: 18 },
  empty: { textAlign: 'center', color: '#666', marginTop: 20 },
  list: { paddingBottom: 30 },
});
