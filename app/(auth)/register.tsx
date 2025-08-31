import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/config/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";

export default function Register() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState(new Date());
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  const dataMinima = new Date(
    new Date().getFullYear() - 14,
    new Date().getMonth(),
    new Date().getDate()
  );

  const formatarCPF = (text: string) => {
    // Remove tudo que não é dígito
    const digits = text.replace(/\D/g, "");

    // Aplica a formatação do CPF (XXX.XXX.XXX-XX)
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    } else if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
        6,
        9
      )}-${digits.slice(9, 11)}`;
    }
  };

  const handleCpfChange = (text: string) => {
    const formattedCpf = formatarCPF(text);
    setCpf(formattedCpf);
  };

  const validarCPF = (cpf: string) => {
    // Remove a formatação
    const cpfLimpo = cpf.replace(/\D/g, "");

    // Verifica se tem 11 dígitos
    if (cpfLimpo.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1+$/.test(cpfLimpo)) {
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    const trimmedNome = nome.trim();
    const trimmedCpf = cpf.trim();
    const trimmedEmail = email.trim();
    const trimmedSenha = senha.trim();
    const trimmedConfirmarSenha = confirmarSenha.trim();

    if (
      trimmedNome === "" ||
      trimmedCpf === "" ||
      trimmedEmail === "" ||
      trimmedSenha === "" ||
      trimmedConfirmarSenha === ""
    ) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Preencha todos os campos.",
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "Por favor, insira um email válido!",
      });
      return;
    }

    if (!validarCPF(trimmedCpf)) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "CPF inválido.",
      });
      return;
    }

    if (nascimento > dataMinima) {
      Toast.show({
        type: "error",
        text1: "Atenção",
        text2: "O usuário deve ter pelo menos 14 anos de idade!",
      });
      return;
    }

    if (trimmedSenha !== trimmedConfirmarSenha) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "As senhas não coincidem.",
      });
      return;
    }

    try {
      // Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        trimmedSenha
      );

      // Atualiza o perfil do usuário com o nome
      await updateProfile(userCredential.user, {
        displayName: trimmedNome,
      });

      // Salva informações adicionais no Firestore
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        nome: trimmedNome,
        cpf: trimmedCpf.replace(/\D/g, ""),
        nascimento: nascimento.toISOString(),
        email: trimmedEmail,
        dataCriacao: new Date(),
      });

      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Conta criada com sucesso!",
      });
      router.replace("../login");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao cadastrar",
        text2: error.message,
      });
    }
  };

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f5f5f5"
        translucent={true}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 60 : StatusBar.currentHeight
        }
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Text style={styles.title}>Cadastro</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome de Usuário</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                placeholderTextColor="#888"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CPF</Text>
              <TextInput
                style={styles.input}
                placeholder="000.000.000-00"
                placeholderTextColor="#888"
                value={cpf}
                onChangeText={handleCpfChange}
                keyboardType="numeric"
                maxLength={14}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data de nascimento</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {nascimento.toLocaleDateString("pt-BR")}
                </Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={nascimento}
                mode="date"
                display="default"
                maximumDate={dataMinima}
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setNascimento(date);
                }}
              />
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="exemplo@email.com"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="********"
                  placeholderTextColor="#888"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={mostrarSenha ? "eye-off" : "eye"}
                    size={22}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="********"
                  placeholderTextColor="#888"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry={!mostrarConfirmarSenha}
                />
                <TouchableOpacity
                  onPress={() =>
                    setMostrarConfirmarSenha(!mostrarConfirmarSenha)
                  }
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={mostrarConfirmarSenha ? "eye-off" : "eye"}
                    size={22}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("../login")}>
              <Text style={styles.link}>Já tenho conta</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
        <Toast />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 40,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
    textAlign: "center",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    marginLeft: 5,
    fontWeight: "500",
    // letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
    minHeight: 50,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    minHeight: 50,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    width: "100%",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
    minHeight: 50,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    marginTop: 20,
    color: "#007AFF",
    fontSize: 16,
    textAlign: "center",
  },
  dateInput: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    minHeight: 50,
  },
  dateText: {
    fontSize: 16,
    color: "#000",
  },
});