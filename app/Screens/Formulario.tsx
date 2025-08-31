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
  Alert,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { ITarefa } from "../../interfaces/ITarefa";
import { IAtarefado } from "../../interfaces/IAtarefado";
import Toast from "react-native-toast-message";
import DateTimePicker from "@react-native-community/datetimepicker";

interface IUsuarioEquipe {
  id: string;
  nome: string;
  email: string;
}

export default function Formulario() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [nomeDaTarefa, setNomeDaTarefa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("Pendente");
  const [responsavel, setResponsavel] = useState("");
  const [dataOriginal, setDataOriginal] = useState<Date | null>(null);
  const [dataEntrega, setDataEntrega] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [atarefados, setAtarefados] = useState<IAtarefado[]>([]);
  const [membrosEquipe, setMembrosEquipe] = useState<IUsuarioEquipe[]>([]);
  const [showResponsavelDropdown, setShowResponsavelDropdown] = useState(false);
  const [equipeId, setEquipeId] = useState<string | null>(null);
  const responsavelSelecionado = [...membrosEquipe].find((a) => a.nome === responsavel);

  const getTarefasStorageKey = (equipeId: string) => `@tarefas_${equipeId}`;

  const validarData = (data: Date): boolean => {
    const agora = new Date();
    if (data < agora) {
      Alert.alert(
        "Data inválida",
        "Não é possível salvar tarefas com datas/horários no passado",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const carregarAtarefados = async () => {
    const data = await AsyncStorage.getItem("@atarefados");
    if (data) {
      try {
        const lista = JSON.parse(data) as IAtarefado[];
        setAtarefados(lista);
      } catch (err) {
        console.error("Erro ao carregar atarefados:", err);
      }
    }
  };

  // ✅ usa convites aceitos como fallback e evita erro de TS
  const carregarMembrosEquipe = async () => {
    try {
      const equipeAtualData = await AsyncStorage.getItem("@equipeAtual");
      if (!equipeAtualData) {
        setMembrosEquipe([]);
        return;
      }
      const equipeAtual = JSON.parse(equipeAtualData);

      const equipesRaw = await AsyncStorage.getItem("@equipes");
      const equipes = equipesRaw ? JSON.parse(equipesRaw) : [];
      const equipe = equipes.find((e: any) => e.id === equipeAtual.id) || equipeAtual;

      const atRaw = await AsyncStorage.getItem("@atarefados");
      const todosAtarefados: IAtarefado[] = atRaw ? JSON.parse(atRaw) : [];

      const membrosField = equipe?.membros ?? [];
      const membroIds: string[] = Array.isArray(membrosField)
        ? membrosField
            .map((m: any) => (typeof m === "string" ? m : m?.id))
            .filter(Boolean)
        : [];

      const convitesAceitos = (equipe?.convites ?? []).filter(
        (c: any) => c.status === "aceito"
      );

      // 👉 TIPADOS: Map<string, IUsuarioEquipe>
      const convitesMap: Map<string, IUsuarioEquipe> = new Map(
        convitesAceitos.map((c: any) => [
          c.usuarioId as string,
          { id: c.usuarioId as string, nome: c.usuarioNome as string, email: (c.email ?? "") as string },
        ])
      );

      const atMap: Map<string, IUsuarioEquipe> = new Map(
        todosAtarefados.map((a: IAtarefado) => [
          a.id,
          { id: a.id, nome: a.nome, email: a.email },
        ])
      );

      // 👉 Retorno garantido de IUsuarioEquipe (sem undefined)
      const membros: IUsuarioEquipe[] = membroIds.map((id) => {
        const doAt = atMap.get(id);
        if (doAt) return doAt;
        const doConvite = convitesMap.get(id);
        if (doConvite) return doConvite;
        return { id, nome: `${id.slice(0, 6)}...`, email: "" };
      });

      setMembrosEquipe(membros);
    } catch (error) {
      console.error("Erro ao carregar membros da equipe:", error);
      setMembrosEquipe([]);
    }
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        await carregarAtarefados();
        await carregarMembrosEquipe();

        if (params.equipeId) {
          setEquipeId(params.equipeId as string);
        } else {
          const equipeAtualData = await AsyncStorage.getItem("@equipeAtual");
          if (equipeAtualData) {
            const equipe = JSON.parse(equipeAtualData);
            setEquipeId(equipe.id);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    carregarDados();
  }, []);

  const onChangeDateTime = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dataEntrega;

    if (pickerMode === "date") {
      setShowDatePicker(false);
      const newDate = new Date(currentDate);
      newDate.setHours(dataEntrega.getHours());
      newDate.setMinutes(dataEntrega.getMinutes());
      setDataEntrega(newDate);
    } else {
      setShowTimePicker(false);
      const newDate = new Date(dataEntrega);
      newDate.setHours(currentDate.getHours());
      newDate.setMinutes(currentDate.getMinutes());
      setDataEntrega(newDate);
    }
  };

  const openDatePicker = () => {
    setPickerMode("date");
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setPickerMode("time");
    setShowTimePicker(true);
  };

  useEffect(() => {
    if (params.editarTarefa) {
      const tarefa = JSON.parse(params.editarTarefa as string);
      setNomeDaTarefa(tarefa.nomeDaTarefa);
      setDescricao(tarefa.descricao);
      setStatus(tarefa.status);
      setResponsavel(tarefa.responsavel);
      setDataEntrega(new Date(tarefa.dataEntrega));
      setDataOriginal(new Date(tarefa.dataHora));
    }
  }, [params.editarTarefa]);

  const handleSalvar = async () => {
    if (!nomeDaTarefa.trim() || !descricao.trim() || !responsavel.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos corretamente!");
      return;
    }

    if (!validarData(dataEntrega)) {
      return;
    }

    if (!equipeId) {
      Alert.alert("Erro", "Nenhuma equipe selecionada");
      return;
    }

    const id = params.id ? params.id.toString() : Date.now().toString();
    const storageKey = getTarefasStorageKey(equipeId);

    const novaTarefa: ITarefa = {
      id,
      nomeDaTarefa: nomeDaTarefa.trim(),
      descricao: descricao.trim(),
      status,
      dataHora: dataOriginal || new Date(),
      dataEntrega,
      responsavel: responsavel.trim(),
      responsavelId: responsavelSelecionado?.id,
      equipeId,
    };

    try {
      const savedTarefas = await AsyncStorage.getItem(storageKey);
      const currentTarefas = savedTarefas ? JSON.parse(savedTarefas) : [];

      const updatedTarefas = params.id
        ? currentTarefas.filter((t: ITarefa) => t.id !== id)
        : currentTarefas;

      const finalTarefas = [novaTarefa, ...updatedTarefas];

      await AsyncStorage.setItem(storageKey, JSON.stringify(finalTarefas));

      setNomeDaTarefa("");
      setDescricao("");
      setStatus("Pendente");
      setResponsavel("");
      setDataOriginal(null);

      Toast.show({
        type: "info",
        text1: params.id ? "Sucesso!" : "📌 Nova Tarefa Atribuída!",
        text2: params.id
          ? "Tarefa atualizada"
          : `${novaTarefa.responsavel}, você foi designado para: "${novaTarefa.nomeDaTarefa}"`,
        text1Style: { fontSize: 13 },
        text2Style: { fontSize: 11 },
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 70,
      });

      setTimeout(() => {
        router.push("/Screens/Home");
      }, 1500);
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      Alert.alert("Erro", "Ocorreu um erro ao salvar a tarefa");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Link href="/Screens/Home" asChild>
            <Text style={styles.backButton}>← Voltar</Text>
          </Link>

          <Text style={styles.title}>
            {params.id ? "Editar Tarefa" : "Nova Tarefa"}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Tarefa</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome da tarefa"
              value={nomeDaTarefa}
              onChangeText={setNomeDaTarefa}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Descreva a tarefa"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data e Hora de Entrega</Text>

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[styles.dateTimeInput, { flex: 2 }]}
                onPress={openDatePicker}
              >
                <Text>{dataEntrega.toLocaleDateString("pt-BR")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateTimeInput, { flex: 1, marginLeft: 10 }]}
                onPress={openTimePicker}
              >
                <Text>
                  {dataEntrega.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {(showDatePicker || showTimePicker) && (
              <DateTimePicker
                value={dataEntrega}
                mode={pickerMode}
                display="default"
                onChange={onChangeDateTime}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Responsável</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() =>
                setShowResponsavelDropdown(!showResponsavelDropdown)
              }
            >
              <Text>{responsavel || "Selecione um responsável"}</Text>
            </TouchableOpacity>

            {showResponsavelDropdown && (
              <View style={styles.dropdown}>
                <FlatList
                  scrollEnabled={membrosEquipe.length > 3}
                  data={membrosEquipe}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setResponsavel(item.nome);
                        setShowResponsavelDropdown(false);
                      }}
                    >
                      <Text>{item.nome}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={params.id ? "Atualizar Tarefa" : "Salvar Tarefa"}
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
    paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    minHeight: "100%",
  },
  backButton: {
    marginBottom: 0,
    marginTop: 20,
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
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateTimeInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 16,
    marginBottom: 8,
  },
  dropdown: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: "#fff",
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});