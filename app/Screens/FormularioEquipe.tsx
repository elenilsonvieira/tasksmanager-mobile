import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter, Link } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { IEquipe } from "../../interfaces/IEquipe";
import Toast from "react-native-toast-message";

export default function FormularioEquipe() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [nomeDaEquipe, setNomeDaEquipe] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (params.editarEquipe) {
      const equipe = JSON.parse(params.editarEquipe as string);
      setNomeDaEquipe(equipe.nomeDaEquipe);
      setDescricao(equipe.descricao);
    }
  }, [params.editarEquipe]);

  const handleSalvar = async () => {
    if (!nomeDaEquipe.trim()) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "O nome da equipe é obrigatório!",
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 70,
      });
      return;
    }

    const id = params.id ? params.id.toString() : Date.now().toString();
    const dataCriacao = new Date(); 

    const novaEquipe: IEquipe = {
      id,
      nomeDaEquipe: nomeDaEquipe.trim(),
      descricao: descricao.trim(),
      dataHora: dataCriacao,
      membros: [],
      convites: []
    };

    try {
      const savedEquipes = await AsyncStorage.getItem("@equipes");
      const currentEquipes = savedEquipes ? JSON.parse(savedEquipes) : [];

      const updatedEquipes = params.id
        ? currentEquipes.filter((e: IEquipe) => e.id !== id)
        : currentEquipes;

      const finalEquipes = [novaEquipe, ...updatedEquipes];

      await AsyncStorage.setItem("@equipes", JSON.stringify(finalEquipes));
      await AsyncStorage.setItem("@equipeAtual", JSON.stringify(novaEquipe));

      setNomeDaEquipe("");
      setDescricao("");

      Toast.show({
        type: "info",
        text1: params.id ? "Sucesso!" : "Nova Equipe Criada!",
        text2: params.id ? "Equipe atualizada" : `Equipe "${novaEquipe.nomeDaEquipe}" criada com sucesso`,
        text1Style: {
          fontSize: 13,
        },
        text2Style: {
          fontSize: 11,
        },
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 70,
      });

      setTimeout(() => {
        router.push("/(tabs)/Equipe");
      }, 1500);
    } catch (error) {
      console.error("Erro ao salvar equipe:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Ocorreu um erro ao salvar a equipe",
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 70,
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Link href="/(tabs)/Equipe" asChild>
          <Text style={styles.backButton}>← Voltar</Text>
        </Link>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {params.id ? "Editar Equipe" : "Nova Equipe"}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Equipe *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome da equipe"
              value={nomeDaEquipe}
              onChangeText={setNomeDaEquipe}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Descreva a equipe (opcional)"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={params.id ? "Atualizar Equipe" : "Salvar Equipe"}
              onPress={handleSalvar}
              color="#60A5FA"
            />
          </View>
        </View>
        <Toast />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    minHeight: "100%",
  },
  backButton: {
    marginBottom: 20,
    color: "#60A5FA",
    fontSize: 16,
    padding: 8,
  },
  formContainer: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#333",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#444",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 16,
    marginBottom: 8,
  },
});