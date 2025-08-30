import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Equipe from '@/components/Equipe/equipe';
import { IEquipe } from '@/interfaces/IEquipe';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, useNavigation } from 'expo-router';
import Toast from 'react-native-toast-message';
import ConfirmModal from '@/components/modal/ConfirmModal';

const STORAGE_KEY = '@equipes';

function CounterChip({ value }: { value: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{value} {value === 1 ? 'equipe' : 'equipes'}</Text>
    </View>
  );
}

export default function HomeEquipe() {
  const [equipes, setEquipes] = useState<IEquipe[]>([]);
  const router = useRouter();
  const navigation = useNavigation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [equipeToDelete, setEquipeToDelete] = useState<string | null>(null);

  const carregarEquipes = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const lista = JSON.parse(data) as IEquipe[];

        const listaValida = lista.filter(equipe =>
          equipe.id && equipe.nomeDaEquipe && equipe.dataHora
        );

        const listaCorrigida = listaValida.map(equipe => ({
          ...equipe,
          dataHora: new Date(equipe.dataHora),
        }));

        setEquipes(listaCorrigida);
      } catch (err) {
        console.error('Erro ao carregar equipes:', err);
        setEquipes([]);
      }
    } else {
      setEquipes([]);
    }
  };

  const handleDeleteEquipe = (id: string) => {
    setEquipeToDelete(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!equipeToDelete) return;

    const novas = equipes.filter(equipe => equipe.id !== equipeToDelete);
    setEquipes(novas);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novas));
    setShowConfirmModal(false);
    setEquipeToDelete(null);

    Toast.show({
      type: 'info',
      text1: 'Sucesso!',
      text2: 'Equipe excluída com sucesso!',
      text1Style: { fontSize: 13 },
      text2Style: { fontSize: 11 },
      visibilityTime: 3000,
    });
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setEquipeToDelete(null);
  };

  const handleEditEquipe = (equipe: IEquipe) => {
    router.push({
      pathname: '/Screens/FormularioEquipe',
      params: { editarEquipe: JSON.stringify(equipe), id: equipe.id },
    });
  };

  useEffect(() => {
    carregarEquipes();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Sistema de Equipes',
      headerTitleAlign: 'center',
      headerRight: () => <CounterChip value={equipes.length} />,
    } as any);
  }, [navigation, equipes.length]);

  return (
    <View style={styles.container}>
      <FlatList
        data={equipes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Equipe
            equipe={item}
            onDelete={handleDeleteEquipe}
            onEdit={handleEditEquipe}
          />
        )}
        contentContainerStyle={styles.listContainer}
      />

      <Link href="/Screens/FormularioEquipe" asChild>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </Link>

      <ConfirmModal
        visible={showConfirmModal}
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir esta equipe?"
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
