import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Atarefados from '@/components/Atarefado/atarefado';
import { IAtarefado } from '@/interfaces/IAtarefado';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, useNavigation } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ITarefa } from '@/interfaces/ITarefa';
import ConfirmModal from '@/components/modal/ConfirmModal';

const STORAGE_KEY = '@atarefados';
const TAREFAS_STORAGE_KEY = '@tarefas';

function CounterChip({ value }: { value: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{value} {value === 1 ? 'atarefado' : 'atarefados'}</Text>
    </View>
  );
}

export default function HomeAtarefados() {
  const [atarefados, setAtarefados] = useState<IAtarefado[]>([]);
  const router = useRouter();
  const navigation = useNavigation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [atarefadoToDelete, setAtarefadoToDelete] = useState<string | null>(null);

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
        console.error('Erro ao carregar atarefados:', err);
        setAtarefados([]);
      }
    } else {
      setAtarefados([]);
    }
  };

  //  BLOQUEAR EXCLUSÃO 
  const handleDeleteAtarefado = async (id: string) => {
    const alvo = atarefados.find(a => a.id === id);
    const norm = (s: string) =>
      s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const nomeAlvoNorm = norm(alvo?.nome || '');

    let emUso = false;
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tarefaKeys = keys.filter(
        k => k === TAREFAS_STORAGE_KEY || k.startsWith(`${TAREFAS_STORAGE_KEY}_`)
  );

      for (const key of tarefaKeys) {
        const tRaw = await AsyncStorage.getItem(key);
        const tarefas: ITarefa[] = tRaw ? JSON.parse(tRaw) : [];

        const temPendente = tarefas.some((t: any) => {
          const statusPend = /pendente/i.test(String(t?.status ?? ''));
          if (!statusPend) return false;

          const idMatch = t?.responsavelId === id;
          const nomeMatch =
            !!nomeAlvoNorm &&
            norm(String(t?.responsavel ?? '')) === nomeAlvoNorm;

          return idMatch || nomeMatch;
        });

        if (temPendente) {
          emUso = true;
          break;
        }
      }
    } catch (e) {
      console.warn('Erro ao verificar tarefas:', e);
    }

    if (emUso) {
      Toast.show({
        type: 'error',
        text1: 'Não é possível excluir',
        text2: 'Este usuário está atribuído a uma ou mais tarefas pendentes.',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 70,
      });
      return;
    }

    setAtarefadoToDelete(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!atarefadoToDelete) return;

    const novos = atarefados.filter(atarefado => atarefado.id !== atarefadoToDelete);
    setAtarefados(novos);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novos));
    setShowConfirmModal(false);
    setAtarefadoToDelete(null);

    Toast.show({
      type: 'info',
      text1: 'Sucesso!',
      text2: 'Atarefado excluído com sucesso!',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 70,
    });
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setAtarefadoToDelete(null);
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Cadastro de Usuário',
      headerTitleAlign: 'center',
      headerRight: () => <CounterChip value={atarefados.length} />,
    } as any);
  }, [navigation, atarefados.length]);

  const ordenarAtarefados = (lista: IAtarefado[]) =>
    [...lista].sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <View style={styles.container}>
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

      <ConfirmModal
        visible={showConfirmModal}
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir este atarefado?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: { padding: 16, paddingBottom: 80 },
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
  pill: {
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
