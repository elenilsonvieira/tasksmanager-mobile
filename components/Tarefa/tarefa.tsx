import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ITarefa } from '../../interfaces/ITarefa';

interface TarefaProps {
  tarefa: ITarefa;
  onDelete: (id: string) => void;
  onEdit: (tarefa: ITarefa) => void;
}

export default function Tarefas({ tarefa, onDelete, onEdit }: TarefaProps) {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.name}>{tarefa.nomeDaTarefa}</Text>
        <Text style={styles.descricao}>{tarefa.descricao}</Text>
        <Text style={styles.status}>{tarefa.status}</Text>
        <Text style={styles.DataHora}>{tarefa.dataHora.toLocaleString()}</Text>
        <Text style={styles.responsavel}>{tarefa.responsavel}</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => onEdit(tarefa)}
        >
          <Icon name="pencil-outline" size={24} color="#60A5FA" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => onDelete(tarefa.id)}
        >
          <Icon name="trash-outline" size={24} color="#ff3b30" />
        </TouchableOpacity>
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
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  box: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  descricao: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    color: '#60A5FA',
    marginBottom: 5,
    fontWeight: '500',
  },
  DataHora: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  responsavel: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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