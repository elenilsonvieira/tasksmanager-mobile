import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Atarefados from '@/components/Atarefado/atarefado';
import { IAtarefado } from '@/interfaces/IAtarefado';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ITarefa } from '@/interfaces/ITarefa';

const STORAGE_KEY = '@atarefados';
const TAREFAS_STORAGE_KEY = '@tarefas';

export default function HomeAtarefados() {
  const [atarefados, setAtarefados] = useState<IAtarefado[]>([]);
  const router = useRouter();

  const carregarAtarefados = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const lista = JSON.parse(data) as IAtarefado[];

        const listaValida = lista.filter(atarefado =>
          atarefado.id && atarefado.nome && atarefado.email && atarefado.cpf
        );

        const listaCorrigida = listaValida.map(atarefado => ({
          ...atarefado,
          nascimento: new Date(atarefado.nascimento),
        }));

        setAtarefados(listaCorrigida);
      } catch (err) {
        console.error("Erro ao carregar atarefados:", err);
        setAtarefados([]);
      }
    }
  };

  const handleDeleteAtarefado = async (id: string) => {
    const tarefasData = await AsyncStorage.getItem(TAREFAS_STORAGE_KEY);
    const tarefas: ITarefa[] = tarefasData ? JSON.parse(tarefasData) : [];
    
    const atarefadoEmUso = tarefas.some(tarefa => tarefa.responsavelId === id);

    if (atarefadoEmUso) {
      Alert.alert(
        "Não é possível excluir",
        "Este usuário está atribuído a uma ou mais tarefas e não pode ser excluído.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir este atarefado?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const novos = atarefados.filter(atarefado => atarefado.id !== id);
            setAtarefados(novos);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novos));
            Toast.show({
              type: 'info',
              text1: 'Sucesso!',
              text2: 'Atarefado excluído com sucesso!',
              visibilityTime: 3000,
            });
          }
        }
      ]
    );
  };

  const handleEditAtarefado = (atarefado: IAtarefado) => {
    router.push({
      pathname: '/Screens/FormAtarefado',
      params: { editarAtarefado: JSON.stringify(atarefado), id: atarefado.id },
    });
  };

  useEffect(() => {
    carregarAtarefados();
  }, []);

  const ordenarAtarefados = (lista: IAtarefado[]) => {
    return [...lista].sort((a, b) => {
      return a.nome.localeCompare(b.nome);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Cadastro de Usuário</Text>
        <Text style={styles.counter}>{atarefados.length} atarefados</Text>
      </View>

      <FlatList
        data={ordenarAtarefados(atarefados)}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Atarefados
            atarefado={item}
            onDelete={handleDeleteAtarefado}
            onEdit={handleEditAtarefado}
          />
        )}
        contentContainerStyle={styles.listContainer}
      />

      <Link href="/Screens/FormAtarefado" asChild>
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
});
