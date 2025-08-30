// Screens/Calendario.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import ConfirmModal from '@/components/modal/ConfirmModal';
import { getAuth } from 'firebase/auth';

import { ITarefa } from '../../interfaces/ITarefa';
import { IEquipe } from '../../interfaces/IEquipe';
import Tarefas from '@/components/Tarefa/tarefa';


const DOTS = {
  atrasada:  { key: 'atrasada',  color: '#ef4444' },
  pendente:  { key: 'pendente',  color: '#f59e0b' },
  concluida: { key: 'concluida', color: '#22c55e' },
} as const;
type DotKey = keyof typeof DOTS;


const S = (v: any) => (v == null ? null : String(v));
const keyForTeam = (equipeId: string) => `@tarefas_${String(equipeId)}`;

const toDayStr = (value: any): string | null => {
  if (!value) return null;
  let d: Date | null = null;

  if (value instanceof Date) d = value;
  else if (typeof value === 'number') d = new Date(value);
  else if (typeof value === 'string') {
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s|$)/);
    d = m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : new Date(value);
  } else if (value && typeof value === 'object' && typeof (value as any).seconds === 'number') {
    d = new Date((value as any).seconds * 1000);
  }

  if (!d || isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const statusToKey = (status?: string): DotKey => {
  const s = (status || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (s.includes('atras')) return 'atrasada';
  if (s.includes('conclu')) return 'concluida';
  return 'pendente';
};

// pega uid do usuário logado (Firebase) com fallback para AsyncStorage
async function getLoggedUid(): Promise<string | null> {
  try {
    const auth = getAuth();
    const uid = auth?.currentUser?.uid ?? null;
    if (uid) return uid;
  } catch {}
  const keys = ['@usuarioAtual', '@currentUser', '@user', '@auth_user', '@authUser'];
  for (const k of keys) {
    const raw = await AsyncStorage.getItem(k);
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const _uid = u?.id ?? u?.uid ?? u?.userId ?? null;
        if (_uid) return String(_uid);
      } catch {}
    }
  }
  return null;
}

export default function Calendario() {
  const router = useRouter();

  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const [equipes, setEquipes] = useState<IEquipe[]>([]);
  const [tarefas, setTarefas] = useState<ITarefa[]>([]);

  const [selectedEquipeId, setSelectedEquipeId] = useState<string | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string>('');
  const [tarefasFiltradas, setTarefasFiltradas] = useState<ITarefa[]>([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tarefaToDelete, setTarefaToDelete] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);

  // carrega uid
  useEffect(() => {
    (async () => {
      setUid(await getLoggedUid());
    })();
  }, []);

  // carrega tarefas de cada equipe passada
  const loadAllTeamTasks = async (eqs: IEquipe[]): Promise<ITarefa[]> => {
    const perTeam = await Promise.all(
      (eqs || []).map(async (eq) => {
        const raw = await AsyncStorage.getItem(keyForTeam(eq.id));
        const arr: ITarefa[] = raw ? JSON.parse(raw) : [];
        // 🔧 força o equipeId de TODA tarefa a ser o id da equipe dona do arquivo
        return arr.map((t) => ({ ...t, equipeId: String(eq.id) }));
      })
    );
    return perTeam.flat();
  };

  // 🔹 chips só com equipes do usuário logado
  const loadEquipesETarefas = async () => {
    const rawEq = await AsyncStorage.getItem('@equipes');
    const lista: IEquipe[] = rawEq ? JSON.parse(rawEq) : [];

    const minhas = (uid)
      ? (lista || []).filter((eq) => {
          const membros = Array.isArray(eq?.membros) ? eq.membros.map((m) => String(m)) : [];
          return membros.includes(String(uid));
        })
      : [];

    setEquipes(minhas);

    const allTasks = await loadAllTeamTasks(minhas);
    setTarefas(allTasks);

    // se o chip selecionado não for válido pra este usuário, volta para "Todas"
    if (selectedEquipeId && !minhas.some((e) => String(e.id) === String(selectedEquipeId))) {
      setSelectedEquipeId(null);
    }
  };

  const loadEquipeAtualOnce = async () => {
    const rawSel = await AsyncStorage.getItem('@equipeAtual');
    if (rawSel) {
      const eq = JSON.parse(rawSel) as { id?: string | null };
      if (eq?.id) setSelectedEquipeId(String(eq.id));
    }
  };

  //  lista base sempre filtrada pelo chip selecionado (ou todas do usuário)
  const tarefasBase = useMemo(() => {
    if (!selectedEquipeId) return tarefas;
    return (tarefas || []).filter((t) => String(t.equipeId) === String(selectedEquipeId));
  }, [tarefas, selectedEquipeId]);

  const buildMarks = (lista: ITarefa[]) => {
    const marks: Record<string, { dots: { key: string; color: string }[]; marked: boolean }> = {};
    (lista || []).forEach((t) => {
      const dEntrega = toDayStr((t as any).dataEntrega);
      const key = statusToKey((t as any).status);
      const dot = DOTS[key];

      if (dEntrega) {
        if (!marks[dEntrega]) {
          marks[dEntrega] = { dots: [{ key: dot.key, color: dot.color }], marked: true };
        } else if (!marks[dEntrega].dots.some((d) => d.key === dot.key)) {
          marks[dEntrega].dots.push({ key: dot.key, color: dot.color });
        }
      }
    });
    return marks;
  };


  useEffect(() => {
    (async () => {
      if (uid === null) return; 
      setLoading(true);
      await Promise.all([loadEquipesETarefas(), loadEquipeAtualOnce()]);
      setLoading(false);
    })();
  
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await loadEquipesETarefas();
        if (dataSelecionada) filtrarPorData(dataSelecionada);
      })();
    }, [dataSelecionada, uid])
  );

  useEffect(() => {
    setMarkedDates(buildMarks(tarefasBase));
  }, [tarefasBase]);

  
  const filtrarPorData = useCallback(
    (dateString: string) => {
      setDataSelecionada(dateString);
      const filtradas = (tarefasBase || []).filter((t) => {
        const dEntrega = toDayStr((t as any).dataEntrega);
        return dEntrega === dateString;
      });
      setTarefasFiltradas(filtradas);
    },
    [tarefasBase]
  );

  const handleEdit = (tarefa: ITarefa) => {
    router.push(`/Screens/Formulario?id=${encodeURIComponent(tarefa.id)}`);
  };

  const handleDelete = (id: string) => {
    setTarefaToDelete(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!tarefaToDelete) return;

    const tarefa = tarefas.find((t) => t.id === tarefaToDelete);
    if (!tarefa || !tarefa.equipeId) return;

    const key = keyForTeam(String(tarefa.equipeId));
    const raw = await AsyncStorage.getItem(key);
    const list: ITarefa[] = raw ? JSON.parse(raw) : [];
    const nova = list.filter((t) => t.id !== tarefaToDelete);
    await AsyncStorage.setItem(key, JSON.stringify(nova));
    const novasTarefas = tarefas.filter((t) => t.id !== tarefaToDelete);
    setTarefas(novasTarefas);

    setShowConfirmModal(false);
    setTarefaToDelete(null);

    Toast.show({
      type: 'info',
      text1: 'Sucesso!',
      text2: 'Tarefa excluída com sucesso.',
      text1Style: { fontSize: 13 },
      text2Style: { fontSize: 11 },
      visibilityTime: 3000,
      topOffset: 70,
    });
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setTarefaToDelete(null);
  };

  const handleToggleConcluida = async (id: string) => {
    const tarefa = tarefas.find((t) => t.id === id);
    if (!tarefa || !tarefa.equipeId) return;

    const key = keyForTeam(String(tarefa.equipeId));
    const raw = await AsyncStorage.getItem(key);
    const list: ITarefa[] = raw ? JSON.parse(raw) : [];
    const atualizada = list.map((t) => (t.id === id ? { ...t, status: 'Concluída' } : t));
    await AsyncStorage.setItem(key, JSON.stringify(atualizada));

    const novas = tarefas.map((t) => (t.id === id ? { ...t, status: 'Concluída' } : t));
    setTarefas(novas);

    Toast.show({
      type: 'info',
      text1: 'Sucesso!',
      text2: 'Tarefa marcada como concluída.',
      text1Style: { fontSize: 13 },
      text2Style: { fontSize: 11 },
      visibilityTime: 3000,
      topOffset: 70,
    });
  };

  const handleSelectEquipe = async (id: string | null) => {
    const novoId = id == null ? null : String(id);
    if (novoId === selectedEquipeId) return;

    setSelectedEquipeId(novoId);

    if (novoId) {
      const eq = equipes.find((e) => String(e.id) === novoId);
      await AsyncStorage.setItem('@equipeAtual', JSON.stringify(eq ?? { id: novoId }));
    } else {
      await AsyncStorage.removeItem('@equipeAtual'); // "Todas" (apenas das equipes do usuário)
    }

    
    if (dataSelecionada) {
      setTimeout(() => filtrarPorData(dataSelecionada), 0);
    }
  };

  const markedWithSelection = useMemo(() => {
    if (!dataSelecionada) return markedDates;
    const current = markedDates[dataSelecionada] || {};
    const dots = Array.isArray(current.dots) ? current.dots : [];
    return {
      ...markedDates,
      [dataSelecionada]: {
        ...current,
        dots,
        marked: true,
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

      
      <View style={styles.teamRow}>
        <TouchableOpacity
          style={[styles.chip, selectedEquipeId === null && styles.chipActive]}
          onPress={() => handleSelectEquipe(null)}
          disabled={equipes.length === 0}
        >
          <Text style={[styles.chipText, selectedEquipeId === null && styles.chipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>

        {equipes.map((eq) => {
          const active = selectedEquipeId === String(eq.id);
          return (
            <TouchableOpacity
              key={String(eq.id)}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => handleSelectEquipe(String(eq.id))}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {eq.nomeDaEquipe}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#60A5FA" />
      ) : (
        <Calendar
          markingType="multi-dot"
          markedDates={markedWithSelection || {}}
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
            Tarefas em {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR')}
            {selectedEquipeId
              ? ` • ${equipes.find((e) => String(e.id) === String(selectedEquipeId))?.nomeDaEquipe ?? ''}`
              : ' • Todas as equipes'}
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

      <ConfirmModal
        visible={showConfirmModal}
        title="Excluir tarefa"
        message="Tem certeza que deseja excluir esta tarefa?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign: 'center' },

  teamRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#e8f0fe', borderColor: '#60A5FA' },
  chipText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: '#1d4ed8' },

  subtitle: { marginTop: 10, fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 10 },
  helper: { textAlign: 'center', color: '#666', marginTop: 18 },
  empty: { textAlign: 'center', color: '#666', marginTop: 20 },
  list: { paddingBottom: 30 },
});
