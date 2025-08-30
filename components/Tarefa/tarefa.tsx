import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ITarefa } from '../../interfaces/ITarefa';

interface TarefaProps {
  tarefa: ITarefa;
  onDelete: (id: string) => void;
  onEdit: (tarefa: ITarefa) => void;
  onToggleConcluida: (id: string) => void;
}

const getStatusStyle = (status: string): TextStyle => {
  switch (status.toLowerCase()) {
    case 'pendente':
      return { color: '#e7b416', fontSize: 14, marginBottom: 5, fontWeight: '500' as TextStyle['fontWeight'] };
    case 'atrasada':
      return { color: '#ff3b30', fontSize: 14, marginBottom: 5, fontWeight: '500' as TextStyle['fontWeight'] };
    case 'concluída':
      return { color: 'green', fontSize: 14, marginBottom: 5, fontWeight: '500' as TextStyle['fontWeight'] };
    default:
      return styles.status;
  }
};

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'Data inválida';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }
    
    return dateObj.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

const formatTime = (date: Date | string | undefined): string => {
  if (!date) return 'Horário inválido';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Horário inválido';
    }
    
    return dateObj.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  } catch {
    return 'Horário inválido';
  }
};

export default function Tarefas({ tarefa, onDelete, onEdit, onToggleConcluida }: TarefaProps) {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.name}>{tarefa.nomeDaTarefa}</Text>
        <Text style={styles.descricao}>{tarefa.descricao}</Text>
        <Text style={getStatusStyle(tarefa.status)}>{tarefa.status}</Text>

        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTimeLabel}>Criado em: </Text>
          <Text style={styles.dateTimeText}>
            {formatDate(tarefa.dataHora)} às {formatTime(tarefa.dataHora)}
          </Text>
        </View>

        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTimeLabel}>Entrega: </Text>
          <Text style={styles.dateTimeText}>
            {formatDate(tarefa.dataEntrega)} às {formatTime(tarefa.dataEntrega)}
          </Text>
        </View>

        <Text style={styles.responsavel}>Responsável: {tarefa.responsavel}</Text>
      </View>

      <View style={styles.actionsContainer}>
        {tarefa.status !== 'Concluída' && (
          <TouchableOpacity style={styles.editButton} onPress={() => onEdit(tarefa)}>
            <Ionicons name="pencil-outline" size={24} color="#60A5FA" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => onDelete(tarefa.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#ff3b30" />
        </TouchableOpacity>
        {tarefa.status !== 'Concluída' && (
          <TouchableOpacity
            style={styles.concluirButton}
            onPress={() => onToggleConcluida(tarefa.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="green" />
          </TouchableOpacity>
        )}
      </View>
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
    marginBottom: 6,
    color: '#333',
  },
  descricao: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#444',
  },
  responsavel: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  concluirButton: {
    padding: 8,
    marginLeft: 5,
  },
  concluirButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: 'green',
    fontWeight: '600',
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