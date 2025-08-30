import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IConvite } from "@/interfaces/IConvite";

interface ConviteProps {
  convite: IConvite;
  onAceitar?: (id: string) => void;
  onRecusar?: (id: string) => void;
  onExcluir?: (id: string) => void; 
}

export default function Convite({
  convite,
  onAceitar,
  onRecusar,
  onExcluir,
}: ConviteProps) {
  const getStatusColor = () => {
    switch (convite.status) {
      case "aceito":
        return "#4CAF50";
      case "recusado":
        return "#F44336";
      default:
        return "#FFC107";
    }
  };

  const RightContent = () => {
    if (convite.status === "pendente" && onAceitar && onRecusar) {
      return (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => onAceitar(convite.id)}
          >
            <Ionicons name="checkmark" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => onRecusar(convite.id)}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>

          {onExcluir && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onExcluir(convite.id)}
            >
              <Ionicons name="trash-outline" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.rightRow}>
        <Text style={[styles.status, { color: getStatusColor() }]}>
          {convite.status === "aceito" ? "Aceito" : "Recusado"}
        </Text>
        {onExcluir && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { marginLeft: 10 }]}
            onPress={() => onExcluir(convite.id)}
          >
            <Ionicons name="trash-outline" size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        convite.status !== "pendente" && styles.disabled,
      ]}
    >
      <Text style={styles.nome}>{convite.usuarioNome}</Text>
      <RightContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    marginVertical: 6,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: "#f5f5f5",
  },
  nome: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  deleteButton: {
    backgroundColor: "#E53935",
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
  },
});
