import React, { useState } from "react";
import {
  Modal,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

interface ModalUsuariosProps {
  visible: boolean;
  onClose: () => void;
  onSelecionar: (email: string) => void;
}

export default function ModalUsuarios({
  visible,
  onClose,
  onSelecionar,
}: ModalUsuariosProps) {
  const [email, setEmail] = useState("");

  const handleConfirmar = async () => {
    if (!email) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Informe o e-mail do usuário",
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 70,
      });
      return;
    }
    onSelecionar(email.trim().toLowerCase());
    setEmail("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#60A5FA" />
          </TouchableOpacity>
          <Text style={styles.title}>Convidar Usuário</Text>
          <TouchableOpacity onPress={handleConfirmar}>
            <Text style={styles.confirmText}>Convidar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>E-mail do membro:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      </View>
      <Toast/>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 18, fontWeight: "bold" },
  confirmText: { color: "#60A5FA", fontSize: 16, fontWeight: "500" },
  formContainer: { padding: 16 },
  label: { fontSize: 16, marginBottom: 8, color: "#333" },
  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
});