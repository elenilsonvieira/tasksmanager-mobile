import React, { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { db } from "@/config/firebaseConfig";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Tarefas from "@/components/Tarefa/tarefa";
import { ITarefa } from "@/interfaces/ITarefa";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import ConfirmModal from "@/components/modal/ConfirmModal";
import Convite from "@/components/Equipe/Convite";
import UsuarioEquipe from "@/components/Equipe/UsuarioEquipe";
import ModalUsuarios from "@/components/Equipe/ModalUsuarios";
import { IAtarefado } from "@/interfaces/IAtarefado";
import { IEquipe } from "@/interfaces/IEquipe";
import { IConvite } from "@/interfaces/IConvite";
import { IUsuarioEquipe } from "@/interfaces/IUsuarioEquipe";

const Tab = createMaterialTopTabNavigator();
const getTarefasStorageKey = (equipeId: string) => `@tarefas_${equipeId}`;

// ✅ helper simples para deduplicar arrays
const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

function TarefasTab({
  tarefas,
  handleDeleteTarefa,
  handleEditTarefa,
  handleToggleConcluida,
}: {
  tarefas: ITarefa[];
  handleDeleteTarefa: (id: string) => void;
  handleEditTarefa: (tarefa: ITarefa) => void;
  handleToggleConcluida: (id: string) => void;
}) {
  const ordenarTarefas = (lista: ITarefa[]) => {
    const prioridade = { Atrasada: 1, Pendente: 2, Concluída: 3 } as const;
    return [...lista].sort((a, b) => {
      const prioridadeA = prioridade[a.status as keyof typeof prioridade] || 99;
      const prioridadeB = prioridade[b.status as keyof typeof prioridade] || 99;

      if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;
      return (
        new Date(a.dataEntrega).getTime() - new Date(b.dataEntrega).getTime()
      );
    });
  };

  return (
    <View style={styles.tabContainer}>
      <FlatList
        data={ordenarTarefas(tarefas)}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
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
    </View>
  );
}

interface UsuariosTabProps {
  usuarios: IUsuarioEquipe[];
  convitesPendentes: IConvite[];
  convitesRespondidos: IConvite[];
  onAceitarConvite: (id: string) => void;
  onRecusarConvite: (id: string) => void;
  onEnviarConvites: () => void;
  onRemoverMembro?: (id: string) => void;
  onExcluirConvite?: (id: string) => void;
}

function UsuariosTab({
  usuarios,
  convitesPendentes,
  convitesRespondidos,
  onAceitarConvite,
  onRecusarConvite,
  onEnviarConvites,
  onRemoverMembro,
  onExcluirConvite,
}: UsuariosTabProps) {
  return (
    <View style={styles.tabContainer}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Membros da Equipe</Text>
          {usuarios.length > 0 ? (
            <FlatList
              data={usuarios}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              renderItem={({ item }) => (
                <UsuarioEquipe usuario={item} onRemover={onRemoverMembro} />
              )}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>Nenhum membro na equipe</Text>
          )}
        </View>

        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Convites Pendentes</Text>
          {convitesPendentes.length > 0 ? (
            <FlatList
              data={convitesPendentes}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              renderItem={({ item }) => (
                <Convite
                  convite={item}
                  onAceitar={onAceitarConvite}
                  onRecusar={onRecusarConvite}
                />
              )}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>Nenhum convite pendente</Text>
          )}
        </View>

        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Convites Respondidos</Text>
          {convitesRespondidos.length > 0 ? (
            <FlatList
              data={convitesRespondidos}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              renderItem={({ item }) => (
                <Convite
                  convite={item}
                  onExcluir={() => onExcluirConvite?.(item.id)}
                />
              )}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>Nenhum convite respondido</Text>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

export default function Home() {
  const [tarefas, setTarefas] = useState<ITarefa[]>([]);
  const [activeTab, setActiveTab] = useState<"Tarefas" | "Usuários">("Tarefas");
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tarefaToDelete, setTarefaToDelete] = useState<string | null>(null);
  const [usuariosEquipe, setUsuariosEquipe] = useState<IUsuarioEquipe[]>([]);
  const [convites, setConvites] = useState<IConvite[]>([]);
  const [modalUsuariosVisible, setModalUsuariosVisible] = useState(false);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<IAtarefado[]>(
    []
  );
  const [showMemberConfirmModal, setShowMemberConfirmModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [equipeAtual, setEquipeAtual] = useState<IEquipe | null>(null);

  const obterEquipeAtual = async () => {
    try {
      const data = await AsyncStorage.getItem("@equipeAtual");
      if (data) {
        const equipe = JSON.parse(data) as IEquipe;
        setEquipeAtual(equipe);
        return equipe;
      }
      return null;
    } catch (error) {
      console.error("Erro ao obter equipe atual:", error);
      return null;
    }
  };

  const carregarUsuarios = async () => {
    const data = await AsyncStorage.getItem("@atarefados");
    if (data) {
      try {
        const usuarios = JSON.parse(data) as IAtarefado[];
        setUsuariosDisponiveis(usuarios);
      } catch (err) {
        console.error("Erro ao carregar atarefados:", err);
      }
    }
  };

  const carregarConvites = async () => {
    const equipe = await obterEquipeAtual();
    if (equipe) {
      setConvites(equipe.convites || []);

      if (equipe.membros && equipe.membros.length > 0) {
        try {
          // ✅ deduplica ids de membros antes de buscar no Firestore
          const membrosIds = uniq(equipe.membros);
          const membrosCompletos = await Promise.all(
            membrosIds.map(async (membroId) => {
              try {
                const userDoc = await getDoc(doc(db, "usuarios", membroId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  return {
                    id: membroId,
                    nome: userData.nome,
                    email: userData.email,
                  };
                }
              } catch (error) {
                console.error("Erro ao carregar dados do membro:", membroId, error);
              }
              return null;
            })
          );

          const membrosValidos = membrosCompletos.filter(Boolean) as IUsuarioEquipe[];
          setUsuariosEquipe(membrosValidos);
        } catch (error) {
          console.error("Erro ao carregar membros:", error);
        }
      } else {
        setUsuariosEquipe([]);
      }
    }
  };

  const enviarEmailConvite = async (
    emailDestino: string,
    nomeDestino: string,
    nomeEquipe: string
  ) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_SEND_INVITE;

      if (!API_URL) {
        throw new Error("URL da API não configurada");
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailDestino, nomeDestino, nomeEquipe }),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Convite enviado",
          text2: `Convite enviado automaticamente para ${nomeDestino}`,
          visibilityTime: 3000,
        });
      } else {
        console.error("Erro backend:", data);
        Alert.alert("Erro", data.error || "Erro ao enviar convite");
      }
    } catch (err) {
      console.error("Erro ao conectar ao servidor:", err);
      Alert.alert(
        "Erro",
        "Não foi possível conectar ao servidor de e-mail.\nVerifique se o servidor está rodando e acessível."
      );
    }
  };

  const enviarConvitePorEmail = async (email: string) => {
    try {
      const equipe = await obterEquipeAtual();
      if (!equipe) {
        Alert.alert("Erro", "Nenhuma equipe selecionada");
        return;
      }

      const q = query(collection(db, "usuarios"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "E-mail não encontrado no sistema",
          visibilityTime: 3000,
        });
        return;
      }

      const usuarioDoc = snapshot.docs[0];
      const usuarioData = usuarioDoc.data();
      const usuarioId = usuarioDoc.id;

      const conviteExistente = equipe.convites?.find(
        (c) => c.usuarioId === usuarioId && c.status === "pendente"
      );
      if (conviteExistente) {
        Alert.alert("Aviso", "Já existe um convite pendente para este e-mail");
        return;
      }

      await enviarEmailConvite(email, usuarioData.nome, equipe.nomeDaEquipe);

      const novoConvite: IConvite = {
        id: Date.now().toString(),
        usuarioId,
        usuarioNome: usuarioData.nome,
        status: "pendente",
        equipeId: equipe.id,
      };

      const equipeAtualizada: IEquipe = {
        ...equipe,
        convites: [...(equipe.convites || []), novoConvite],
      };

      await AsyncStorage.mergeItem("@equipeAtual", JSON.stringify(equipeAtualizada));

      const savedEquipes = await AsyncStorage.getItem("@equipes");
      const equipes = savedEquipes ? JSON.parse(savedEquipes) : [];
      const equipeIndex = equipes.findIndex((e: IEquipe) => e.id === equipe.id);
      if (equipeIndex !== -1) {
        equipes[equipeIndex] = equipeAtualizada;
        await AsyncStorage.setItem("@equipes", JSON.stringify(equipes));
      }

      setConvites((prev) => [...prev, novoConvite]);

      Toast.show({
        type: "success",
        text1: "Convite enviado",
        text2: `Convite enviado para ${usuarioData.nome}`,
        visibilityTime: 3000,
      });
    } catch (err) {
      console.error("Erro ao enviar convite:", err);
      Alert.alert("Erro", "Não foi possível enviar o convite");
    }
  };

  const aceitarConvite = async (conviteId: string) => {
    try {
      const equipe = await obterEquipeAtual();
      if (!equipe) return;

      const conviteIndex = equipe.convites?.findIndex((c: IConvite) => c.id === conviteId) ?? -1;
      if (conviteIndex === -1) return;

      const convite = equipe.convites![conviteIndex];

      const userDoc = await getDoc(doc(db, "usuarios", convite.usuarioId));
      if (!userDoc.exists()) {
        Alert.alert("Erro", "Usuário não encontrado");
        return;
      }

      const userData = userDoc.data();
      const conviteAtualizado: IConvite = {
        ...convite,
        status: "aceito",
      };

      // ✅ deduplica membros para evitar duplicação e keys repetidas
      const membrosDedup = uniq([...(equipe.membros || []), convite.usuarioId]);

      const equipeAtualizada: IEquipe = {
        ...equipe,
        convites: equipe.convites?.map((c: IConvite) =>
          c.id === conviteId ? conviteAtualizado : c
        ),
        membros: membrosDedup, // ✅
      };

      await AsyncStorage.setItem("@equipeAtual", JSON.stringify(equipeAtualizada));

      const savedEquipes = await AsyncStorage.getItem("@equipes");
      const equipes = savedEquipes ? (JSON.parse(savedEquipes) as IEquipe[]) : [];

      const equipeGlobalIndex = equipes.findIndex((e: IEquipe) => e.id === equipe.id);
      if (equipeGlobalIndex !== -1) {
        const equipeGlobal = equipes[equipeGlobalIndex];
        const membrosGlobDedup = uniq([...(equipeGlobal.membros || []), convite.usuarioId]); // ✅
        const equipeGlobalAtualizada = {
          ...equipeGlobal,
          convites: (equipeGlobal.convites || []).map((c: IConvite) =>
            c.id === conviteId ? conviteAtualizado : c
          ),
          membros: membrosGlobDedup, // ✅
        };

        equipes[equipeGlobalIndex] = equipeGlobalAtualizada;
        await AsyncStorage.setItem("@equipes", JSON.stringify(equipes));
      }

      setEquipeAtual(equipeAtualizada);
      setConvites(equipeAtualizada.convites || []);

      // ✅ evita inserir duplicado na lista visível
      setUsuariosEquipe((prev) => {
        const jaExiste = prev.some((u) => u.id === convite.usuarioId);
        return jaExiste
          ? prev
          : [...prev, { id: convite.usuarioId, nome: userData.nome, email: userData.email }];
      });

      Toast.show({
        type: "success",
        text1: "Convite aceito",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Erro ao aceitar convite:", error);
      Alert.alert("Erro", "Ocorreu um erro ao aceitar o convite");
    }
  };

  const recusarConvite = async (conviteId: string) => {
    try {
      const equipe = await obterEquipeAtual();
      if (!equipe) return;

      const conviteIndex =
        equipe.convites?.findIndex((c: IConvite) => c.id === conviteId) ?? -1;

      if (conviteIndex === -1) return;

      const conviteAtualizado: IConvite = {
        ...equipe.convites![conviteIndex],
        status: "recusado",
      };

      const equipeAtualizada: IEquipe = {
        ...equipe,
        convites: equipe.convites?.map((c: IConvite) =>
          c.id === conviteId ? conviteAtualizado : c
        ),
      };

      await AsyncStorage.mergeItem(
        "@equipeAtual",
        JSON.stringify(equipeAtualizada)
      );

      const savedEquipes = await AsyncStorage.getItem("@equipes");
      const equipes = savedEquipes ? JSON.parse(savedEquipes) : [];
      const equipeIndex = equipes.findIndex((e: IEquipe) => e.id === equipe.id);
      if (equipeIndex !== -1) {
        equipes[equipeIndex] = equipeAtualizada;
        await AsyncStorage.setItem("@equipes", JSON.stringify(equipes));
      }

      setConvites(equipeAtualizada.convites || []);

      Toast.show({
        type: "info",
        text1: "Convite recusado",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Erro ao recusar convite:", error);
      Alert.alert("Erro", "Ocorreu um erro ao recusar o convite");
    }
  };

  const excluirConvite = async (conviteId: string) => {
    try {
      const atualRaw = await AsyncStorage.getItem('@equipeAtual');
      const equipeAtual = atualRaw ? JSON.parse(atualRaw) : null;
      const teamId = equipeAtual?.id;
      if (!teamId) {
        Alert.alert('Erro', 'Equipe não encontrada.');
        return;
      }

      const eqRaw = await AsyncStorage.getItem('@equipes');
      const equipes = eqRaw ? JSON.parse(eqRaw) : [];
      const idx = equipes.findIndex((e: any) => e.id === teamId);
      if (idx === -1) {
        Alert.alert('Erro', 'Equipe não encontrada.');
        return;
      }

      equipes[idx].convites = (equipes[idx].convites || []).filter(
        (c: any) => c.id !== conviteId
      );

      await AsyncStorage.setItem('@equipes', JSON.stringify(equipes));
      await AsyncStorage.setItem('@equipeAtual', JSON.stringify(equipes[idx]));

      setConvites((prev) => prev.filter((c) => c.id !== conviteId));

      Toast.show({ type: 'info', text1: 'Convite excluído', topOffset: 70 });
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Falha ao excluir convite.');
    }
  };

  const handleRemoverMembro = async () => {
    if (!memberToRemove) return;

    try {
      const equipe = await obterEquipeAtual();
      if (!equipe) return;

      const equipeAtualizada: IEquipe = {
        ...equipe,
        membros: equipe.membros?.filter((id) => id !== memberToRemove) || [],
        convites:
          equipe.convites?.filter((c) => c.usuarioId !== memberToRemove) || [],
      };

      await AsyncStorage.mergeItem(
        "@equipeAtual",
        JSON.stringify(equipeAtualizada)
      );

      const savedEquipes = await AsyncStorage.getItem("@equipes");
      const equipes = savedEquipes
        ? (JSON.parse(savedEquipes) as IEquipe[])
        : [];
      const equipeIndex = equipes.findIndex((e: IEquipe) => e.id === equipe.id);
      if (equipeIndex !== -1) {
        equipes[equipeIndex] = equipeAtualizada;
        await AsyncStorage.setItem("@equipes", JSON.stringify(equipes));
      }

      setUsuariosEquipe((prev) => prev.filter((u) => u.id !== memberToRemove));
      setConvites((prev) => prev.filter((c) => c.usuarioId !== memberToRemove));

      Toast.show({
        type: "info",
        text1: "Membro removido",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      Alert.alert("Erro", "Ocorreu um erro ao remover o membro");
    } finally {
      setShowMemberConfirmModal(false);
      setMemberToRemove(null);
    }
  };

  const verificarTarefasAtrasadas = (lista: ITarefa[]) => {
    const agora = new Date();
    return lista.map((tarefa) => {
      if (
        tarefa.status.toLowerCase() === "pendente" &&
        new Date(tarefa.dataEntrega) < agora
      ) {
        return { ...tarefa, status: "Atrasada" };
      }
      return tarefa;
    });
  };

  const carregarTarefas = async () => {
    const equipe = await obterEquipeAtual();
    if (!equipe) {
      setTarefas([]);
      return;
    }

    const storageKey = getTarefasStorageKey(equipe.id);
    const data = await AsyncStorage.getItem(storageKey);

    if (data) {
      try {
        const lista = JSON.parse(data) as ITarefa[];
        const listaValida = lista.filter(
          (tarefa) =>
            tarefa.id &&
            tarefa.nomeDaTarefa &&
            tarefa.status &&
            tarefa.dataEntrega &&
            tarefa.dataHora
        );

        const listaCorrigida = listaValida.map((tarefa) => ({
          ...tarefa,
          dataHora: new Date(tarefa.dataHora),
          dataEntrega: new Date(tarefa.dataEntrega),
        }));

        const atualizada = verificarTarefasAtrasadas(listaCorrigida);
        setTarefas(atualizada);
        await AsyncStorage.setItem(storageKey, JSON.stringify(atualizada));
      } catch (err) {
        console.error("Erro ao carregar tarefas:", err);
        setTarefas([]);
      }
    } else {
      setTarefas([]);
    }
  };

  const handleDeleteTarefa = (id: string) => {
    setTarefaToDelete(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!tarefaToDelete) return;

    try {
      const equipe = await obterEquipeAtual();
      if (!equipe) return;

      const storageKey = getTarefasStorageKey(equipe.id);
      const novasTarefas = tarefas.filter(
        (tarefa) => tarefa.id !== tarefaToDelete
      );
      setTarefas(novasTarefas);
      await AsyncStorage.setItem(storageKey, JSON.stringify(novasTarefas));

      Toast.show({
        type: "success",
        text1: "Tarefa excluída",
        text2: "A tarefa foi removida com sucesso",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      Alert.alert("Erro", "Não foi possível excluir a tarefa");
    } finally {
      setShowConfirmModal(false);
      setTarefaToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setTarefaToDelete(null);
  };

  const handleEditTarefa = async (tarefa: ITarefa) => {
    const equipe = await obterEquipeAtual();
    router.push({
      pathname: "/Screens/Formulario",
      params: {
        editarTarefa: JSON.stringify(tarefa),
        id: tarefa.id,
        equipeId: equipe?.id,
      },
    });
  };

  const handleToggleConcluida = async (id: string) => {
    const equipe = await obterEquipeAtual();
    if (!equipe) return;

    const storageKey = getTarefasStorageKey(equipe.id);
    const novas = tarefas.map((tarefa) =>
      tarefa.id === id ? { ...tarefa, status: "Concluída" } : tarefa
    );
    setTarefas(novas);
    await AsyncStorage.setItem(storageKey, JSON.stringify(novas));
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        await carregarUsuarios();
        const equipe = await obterEquipeAtual();
        if (equipe) {
          await carregarConvites();
          await carregarTarefas();
        } else {
          setTarefas([]);
          setUsuariosEquipe([]);
          setConvites([]);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    carregarDados();
    const interval = setInterval(() => {
      carregarTarefas();
    }, 10 * 1000);

    return () => clearInterval(interval);
  }, [equipeAtual?.id]);

  const convitesPendentes = convites.filter(
    (c: IConvite) => c.status === "pendente"
  );
  const convitesRespondidos = convites.filter(
    (c: IConvite) => c.status !== "pendente"
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/Equipe")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Sistema de Tarefas</Text>
        <Text style={styles.counter}>{tarefas.length} tarefas</Text>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#60A5FA",
          tabBarInactiveTintColor: "gray",
          tabBarIndicatorStyle: {
            backgroundColor: "#60A5FA",
          },
          tabBarLabelStyle: {
            fontWeight: "bold",
          },
          tabBarStyle: {
            backgroundColor: "#fff",
          },
        }}
        screenListeners={() => ({
          state: (e) => {
            const idx = e?.data?.state?.index;
            if (idx === 0) {
              setActiveTab("Tarefas");
            } else if (idx === 1) {
              setActiveTab("Usuários");
              carregarConvites();
            }
          },
        })}
      >
        <Tab.Screen name="Tarefas">
          {() => (
            <TarefasTab
              tarefas={tarefas}
              handleDeleteTarefa={handleDeleteTarefa}
              handleEditTarefa={handleEditTarefa}
              handleToggleConcluida={handleToggleConcluida}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Usuários">
          {() => (
            <UsuariosTab
              usuarios={usuariosEquipe}
              convitesPendentes={convitesPendentes}
              convitesRespondidos={convitesRespondidos}
              onAceitarConvite={aceitarConvite}
              onRecusarConvite={recusarConvite}
              onEnviarConvites={() => setModalUsuariosVisible(true)}
              onRemoverMembro={(id) => {
                setMemberToRemove(id);
                setShowMemberConfirmModal(true);
              }}
              onExcluirConvite={excluirConvite}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      {activeTab === "Tarefas" ? (
        <Link href="/Screens/Formulario" asChild>
          <TouchableOpacity style={styles.fab}>
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </Link>
      ) : (
        <TouchableOpacity
          style={[styles.fab, styles.fabInvite]}
          onPress={() => setModalUsuariosVisible(true)}
        >
          <Ionicons name="person-add-outline" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      <ConfirmModal
        visible={showConfirmModal}
        title="Excluir Tarefa"
        message="Tem certeza que deseja excluir esta tarefa?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ConfirmModal
        visible={showMemberConfirmModal}
        title="Remover membro"
        message="Tem certeza que deseja remover este membro da equipe?"
        onConfirm={handleRemoverMembro}
        onCancel={() => {
          setShowMemberConfirmModal(false);
          setMemberToRemove(null);
        }}
      />

      <ModalUsuarios
        visible={modalUsuariosVisible}
        onClose={() => setModalUsuariosVisible(false)}
        onSelecionar={enviarConvitePorEmail}
      />

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#60A5FA",
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
    flex: 1,
    textAlign: "center",
  },
  counter: {
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 24,
    backgroundColor: "#60A5FA",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabInvite: {
    backgroundColor: "#60A5FA",
  },
  tabContent: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: 16,
    fontStyle: "italic",
  },
});
