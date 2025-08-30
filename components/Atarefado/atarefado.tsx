import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IAtarefado } from '../../interfaces/IAtarefado';

interface AtarefadoProps {
  atarefado: IAtarefado;
  onDelete?: (id: string) => void;
  onEdit?: (atarefado: IAtarefado) => void;
}

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'Data inválida';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('pt-BR') : 'Data inválida';
  } catch {
    return 'Data inválida';
  }
};

export default function Atarefados({ atarefado, onDelete, onEdit }: AtarefadoProps) {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.name}>{atarefado.nome}</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Email: </Text>
          <Text style={styles.infoText}>{atarefado.email}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>CPF: </Text>
          <Text style={styles.infoText}>{atarefado.cpf}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Nascimento: </Text>
          <Text style={styles.infoText}>{formatDate(atarefado.nascimento)}</Text>
        </View>
      </View>

      {onDelete && onEdit && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={() => onEdit(atarefado)}>
            <Ionicons name="pencil-outline" size={24} color="#60A5FA" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(atarefado.id)}>
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  box: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#444',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 5,
  },
});