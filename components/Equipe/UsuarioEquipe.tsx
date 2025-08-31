import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IUsuarioEquipe } from "@/interfaces/IUsuarioEquipe";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

interface UsuarioEquipeProps {
  usuario: IUsuarioEquipe;
  onRemover?: (id: string) => void;
}

const norm = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export default function UsuarioEquipe({ usuario, onRemover }: UsuarioEquipeProps) {
  const handlePressRemover = async () => {
    try {
      const atualRaw = await AsyncStorage.getItem("@equipeAtual");
      const equipeAtual = atualRaw ? JSON.parse(atualRaw) : null;
      const teamId = equipeAtual?.id;
      if (!teamId) {
        Toast.show({ type: "error", text1: "Equipe não encontrada." });
        return;
      }

      // 2) Carrega equipes/atarefados para descobrir o nome do membro (fallback por convite)
      const eqRaw = await AsyncStorage.getItem("@equipes");
      const equipes = eqRaw ? JSON.parse(eqRaw) : [];
      const equipe =
        equipes.find((e: any) => e.id === teamId) || equipeAtual || null;

      const atRaw = await AsyncStorage.getItem("@atarefados");
      const atarefados = atRaw ? JSON.parse(atRaw) : [];

      const convitesAceitos = (equipe?.convites || []).filter(
        (c: any) => c.status === "aceito"
      );

      const nomeMembro =
        atarefados.find((a: any) => a.id === usuario.id)?.nome ||
        convitesAceitos.find((c: any) => c.usuarioId === usuario.id)?.usuarioNome ||
        usuario.nome || "";

      // 3) Verifica tarefas da equipe
      const tarefasKey = `@tarefas_${teamId}`;
      const tRaw = await AsyncStorage.getItem(tarefasKey);
      const tarefas = tRaw ? JSON.parse(tRaw) : [];

      const bloqueado = tarefas.some((t: any) => {
        const pend = /pendente/i.test(String(t?.status ?? ""));
        if (!pend) return false;
        const byId = t?.responsavelId === usuario.id;
        const byName = norm(String(t?.responsavel ?? "")) === norm(nomeMembro);
        return byId || byName;
      });

      if (bloqueado) {
        Toast.show({
          type: "error",
          text1: "Não é possível remover",
          text2: "Este usuário possui tarefa pendente nesta equipe.",
          visibilityTime: 3000,
          topOffset: 70,
        });
        return;
      }

      onRemover?.(usuario.id);
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: "Erro ao verificar tarefas." });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.nome}>{usuario.nome}</Text>
        <Text style={styles.email}>{usuario.email}</Text>
      </View>

      {onRemover && (
        <TouchableOpacity style={styles.removeButton} onPress={handlePressRemover}>
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
    marginVertical: 6,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
    marginLeft: 10,
  },
});